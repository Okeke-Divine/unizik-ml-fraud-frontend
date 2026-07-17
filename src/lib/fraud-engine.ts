// src/lib/fraud-engine.ts

import { prisma } from './prisma';
import { TransactionStatus } from '@prisma/client';

export interface PaymentInitiationRequest {
  studentId: string;
  invoiceId: string;
  amount: number;
  reference: string;
  deviceId: string;
  ipAddress: string;
  asnNumber: number; // 0 = Clean campus/local ISP, 1 = High-risk datacenter/VPN
  pageDwellTime: number; // Seconds spent on the checkout page
  hardwareMismatch: number; // 0 = Match, 1 = Hijack/mismatch against login token
}

export interface FraudEngineResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: TransactionStatus;
  verdict: 'LEGITIMATE' | 'FRAUDULENT' | 'SYSTEM_ERROR';
  confidence: number;
  explanation: string;
}

/**
 * Calculates West Africa Time (WAT / UTC+1) to determine if the transaction
 * occurs during high-risk off-peak campus hours (1:00 AM - 4:30 AM WAT).
 */
function isOffPeakHourWAT(): number {
  const now = new Date();
  // Convert current time to UTC+1 (WAT is UTC+1 hour)
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  
  let watHours = utcHours + 1;
  if (watHours >= 24) watHours -= 24;

  // Off-peak boundary: 01:00 to 04:30 WAT
  if (watHours >= 1 && watHours < 4) return 1;
  if (watHours === 4 && utcMinutes <= 30) return 1;
  return 0;
}

/**
 * RUTHLESS AGGREGATION ENGINE
 * Intercepts checkout requests, computes behavioral velocity against the SQLite ledger,
 * evaluates risk via Python AI, and logs immutable audit records.
 */
export async function evaluatePaymentTransaction(
  payload: PaymentInitiationRequest
): Promise<FraudEngineResponse> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // 1. DATABASE AGGREGATION: Calculate 24-hour device-to-student velocity
    // Find all distinct students who initiated a transaction on this device ID in the last 24h
    const distinctStudentsOnDevice = await prisma.transaction.findMany({
      where: {
        deviceId: payload.deviceId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    // If the current student is not in the historical list, add +1 to the velocity count
    const hasCurrentStudent = distinctStudentsOnDevice.some(
      (record) => record.studentId === payload.studentId
    );
    const deviceStudentCount24h = distinctStudentsOnDevice.length + (hasCurrentStudent ? 0 : 1);

    // 2. DATABASE AGGREGATION: Calculate 1-hour failure rate
    // Count all BLOCKED or FAILED transactions associated with this student OR device in the last hour
    const failedAttempts1h = await prisma.transaction.count({
      where: {
        OR: [{ studentId: payload.studentId }, { deviceId: payload.deviceId }],
        status: { in: [TransactionStatus.BLOCKED, TransactionStatus.FAILED] },
        createdAt: { gte: oneHourAgo },
      },
    });

    // 3. CONSTRUCT THE ML FEATURE VECTOR
    const offPeakFlag = isOffPeakHourWAT();
    const mlPayload = {
      device_student_count_24h: deviceStudentCount24h,
      page_dwell_time_seconds: payload.pageDwellTime,
      is_high_risk_asn: payload.asnNumber,
      failed_attempts_1h: failedAttempts1h,
      session_hardware_mismatch: payload.hardwareMismatch,
      is_off_peak_hour: offPeakFlag,
    };

    console.log("--------------------------------------------------");
    console.log("[TELEMETRY] Sending 6-param vector to Python AI:");
    console.log(JSON.stringify(mlPayload, null, 2));
    console.log("--------------------------------------------------");

    // 4. DISPATCH TO PYTHON FLASK MICROSERVICE
    const mlEndpoint = process.env.ML_ENGINE_URL || 'http://127.0.0.1:5000/api/predict';
    let aiVerdict = 'LEGITIMATE';
    let aiConfidence = 1.0;
    let aiExplanation = 'Transaction parameters align with normal campus student behavioral distributions.';
    let isErrorFallback = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // Strict 3.5s timeout

      const response = await fetch(mlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const mlResult = await response.json();
        if (mlResult.status === 'success') {
          aiVerdict = mlResult.verdict;
          aiConfidence = mlResult.confidence;
          aiExplanation = mlResult.explanation;
        } else {
          throw new Error(mlResult.message || 'AI engine returned non-success status.');
        }
      } else {
        throw new Error(`AI engine responded with HTTP ${response.status}`);
      }
    } catch (mlError: any) {
      // IF PYTHON IS DOWN OR TIMED OUT: Fallback to Heuristic Hard-Guardrails
      console.error('[FRAUD ENGINE WARNING] AI Microservice unreachable. Engaging heuristic safety net:', mlError.message);
      isErrorFallback = true;
      
      // Heuristic fallback: Block if there are excessive failures or VPN + Hardware mismatch
      if (failedAttempts1h >= 3 || (payload.hardwareMismatch === 1 && payload.asnNumber === 1)) {
        aiVerdict = 'FRAUDULENT';
        aiConfidence = 0.9999;
        aiExplanation = 'BLOCKED BY FALLBACK HEURISTIC: High failure rate or session hijack detected while AI service was offline.';
      }
    }

    // 5. ATOMIC LEDGER EXECUTION
    // Determine target transaction status based on AI/Heuristic verdict
    const targetStatus: TransactionStatus =
      aiVerdict === 'FRAUDULENT' ? TransactionStatus.BLOCKED : TransactionStatus.CLEARED;

    // Execute atomic database write: Create transaction record + create audit log if fraudulent
    const createdTransaction = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          reference: payload.reference,
          invoiceId: payload.invoiceId,
          studentId: payload.studentId,
          amount: payload.amount,
          status: targetStatus,
          deviceId: payload.deviceId,
          ipAddress: payload.ipAddress,
          asnNumber: payload.asnNumber,
          pageDwellTime: payload.pageDwellTime,
          isOffPeak: offPeakFlag,
          hardwareMismatch: payload.hardwareMismatch,
        },
      });

      // If blocked by fraud engine, write immutable audit record
      if (aiVerdict === 'FRAUDULENT') {
        await tx.fraudAuditLog.create({
          data: {
            transactionId: txn.id,
            studentId: payload.studentId,
            prediction: 1,
            confidence: aiConfidence,
            verdict: aiVerdict,
            explanation: aiExplanation,
          },
        });
      }

      // If cleared, update invoice status to PAID
      if (targetStatus === TransactionStatus.CLEARED) {
        await tx.feeInvoice.update({
          where: { id: payload.invoiceId },
          data: { status: 'PAID' },
        });
      }

      return txn;
    });

    return {
      success: targetStatus === TransactionStatus.CLEARED,
      transactionId: createdTransaction.id,
      reference: createdTransaction.reference,
      status: createdTransaction.status,
      verdict: isErrorFallback && aiVerdict === 'LEGITIMATE' ? 'SYSTEM_ERROR' : (aiVerdict as any),
      confidence: aiConfidence,
      explanation: aiExplanation,
    };
  } catch (error: any) {
    console.error('[FATAL LEDGER ERROR] Transaction processing failed:', error.message);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}