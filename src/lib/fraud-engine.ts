// unizik-ml-fraud-frontend/src/lib/fraud-engine.ts

import { prisma } from './prisma';
import { TransactionStatus } from '@prisma/client';

export interface PaymentInitiationRequest {
  studentId: string;
  invoiceId: string;
  amount: number;
  reference: string;
  deviceId: string;
  ipAddress: string;
  asnNumber: number; 
  pageDwellTime: number; 
  hardwareMismatch: number;
  simMode?: "NORMAL" | "BOT" | "SPOOF";
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

function isOffPeakHourWAT(): number {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  
  let watHours = utcHours + 1;
  if (watHours >= 24) watHours -= 24;

  if (watHours >= 1 && watHours < 4) return 1;
  if (watHours === 4 && utcMinutes <= 30) return 1;
  return 0;
}

export async function evaluatePaymentTransaction(
  payload: PaymentInitiationRequest
): Promise<FraudEngineResponse> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // 1. STANDARD DATABASE AGGREGATION (Dynamic / Normal Mode)
    const distinctStudentsOnDevice = await prisma.transaction.findMany({
      where: {
        deviceId: payload.deviceId,
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    const hasCurrentStudent = distinctStudentsOnDevice.some(
      (record) => record.studentId === payload.studentId
    );
    let deviceStudentCount24h = distinctStudentsOnDevice.length + (hasCurrentStudent ? 0 : 1);

    let failedAttempts1h = await prisma.transaction.count({
      where: {
        OR: [{ studentId: payload.studentId }, { deviceId: payload.deviceId }],
        status: { in: [TransactionStatus.BLOCKED, TransactionStatus.FAILED] },
        createdAt: { gte: oneHourAgo },
      },
    });

    let targetDwellTime = payload.pageDwellTime;
    let targetAsn = payload.asnNumber;
    let targetMismatch = payload.hardwareMismatch;
    let offPeakFlag = isOffPeakHourWAT();

    // If caller provided explicit feature overrides (diagnostics panel edited fields), honor them
    if ((payload as any).overrideFeatures) {
      const o = (payload as any).overrideFeatures;
      deviceStudentCount24h = o.device_student_count_24h ?? deviceStudentCount24h;
      targetDwellTime = o.page_dwell_time_seconds ?? targetDwellTime;
      targetAsn = o.is_high_risk_asn ?? targetAsn;
      failedAttempts1h = o.failed_attempts_1h ?? failedAttempts1h;
      targetMismatch = o.session_hardware_mismatch ?? targetMismatch;
      offPeakFlag = o.is_off_peak_hour ?? offPeakFlag;
    }

    // -------------------------------------------------------------------------
    // 2. AGGRESSIVE DEFENSE SIMULATION OVERRIDE (Forced Under-The-Hood Spoofing)
    // Why: When presenting, we cannot rely on a clean demo DB. We forcibly inject
    // extreme multi-variable vectors so Python & SQLite record unmistakable fraud.
    // -------------------------------------------------------------------------
    // Backwards-compatible: small simMode presets still accepted but treated as input modifiers
    if (payload.simMode === 'BOT') {
      deviceStudentCount24h = deviceStudentCount24h || 65;
      failedAttempts1h = failedAttempts1h || 14;
      targetDwellTime = targetDwellTime || 0.12;
      targetAsn = targetAsn || 1;
      offPeakFlag = offPeakFlag || 1;
    } else if (payload.simMode === 'SPOOF') {
      deviceStudentCount24h = deviceStudentCount24h || 24;
      failedAttempts1h = failedAttempts1h || 6;
      targetMismatch = targetMismatch || 1;
      targetAsn = targetAsn || 1;
    }

    // 3. CONSTRUCT THE ML FEATURE VECTOR
    const mlPayload: any = {
      device_student_count_24h: deviceStudentCount24h,
      page_dwell_time_seconds: targetDwellTime,
      is_high_risk_asn: targetAsn,
      failed_attempts_1h: failedAttempts1h,
      session_hardware_mismatch: targetMismatch,
      is_off_peak_hour: offPeakFlag,
    };

    if ((payload as any).telemetry_source) {
      mlPayload.telemetry_source = (payload as any).telemetry_source;
    }

    console.log("--------------------------------------------------");
    console.log(`[TELEMETRY (${(payload as any).simMode || 'NORMAL'})] Sending 6-param vector to Python AI:`);
    console.log(JSON.stringify(mlPayload, null, 2));
    console.log("--- [FRAUD-ENGINE DEBUG] payload.overrideFeatures present:", !!(payload as any).overrideFeatures);
    console.log("--------------------------------------------------");

    // 4. DISPATCH TO PYTHON FLASK MICROSERVICE
    const mlEndpoint = process.env.ML_ENGINE_URL || 'http://127.0.0.1:5000/api/predict';
    let aiVerdict = 'LEGITIMATE';
    let aiConfidence = 1.0;
    let aiExplanation = 'Transaction parameters align with normal campus student behavioral distributions.';
    let isErrorFallback = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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
      console.error('[FRAUD ENGINE WARNING] AI Microservice unreachable. Engaging heuristic safety net:', mlError.message);
      isErrorFallback = true;
      
      if (failedAttempts1h >= 9 || (targetMismatch === 1 && targetAsn === 1)) {
        aiVerdict = 'FRAUDULENT';
        aiConfidence = 0.9999;
        aiExplanation = 'BLOCKED BY FALLBACK HEURISTIC: High failure rate or session hijack detected while AI service was offline.';
      }
    }
    // NOTE: Removed forced-override guardrail to ensure ML verdicts remain authoritative.

    // 6. ATOMIC LEDGER EXECUTION
    const targetStatus: TransactionStatus =
      aiVerdict === 'FRAUDULENT' ? TransactionStatus.BLOCKED : TransactionStatus.CLEARED;

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
          asnNumber: targetAsn,
          pageDwellTime: targetDwellTime,
          isOffPeak: offPeakFlag,
          hardwareMismatch: targetMismatch,
        },
      });

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