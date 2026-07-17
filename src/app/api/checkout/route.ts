// unizik-ml-fraud-frontend/src/app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { evaluatePaymentTransaction } from '@/lib/fraud-engine';

// Strict input validation schema to prevent malformed or injection payloads
const checkoutSchema = z.object({
  studentId: z.string().uuid("Invalid Student UUID format"),
  invoiceId: z.string().uuid("Invalid Invoice UUID format"),
  amount: z.number().positive("Amount must be greater than zero"),
  reference: z.string().min(6, "Payment reference must be at least 6 characters"),
  deviceId: z.string().min(8, "Hardware fingerprint ID required"),
  ipAddress: z.string().default("127.0.0.1"),
  asnNumber: z.number().int().min(0).max(1).default(0),
  pageDwellTime: z.number().positive("Page dwell time must be a positive number"),
  hardwareMismatch: z.number().int().min(0).max(1).default(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload Validation Failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const payload = validation.data;

    // 1. FINANCIAL INTEGRITY GUARDRAIL: Verify Invoice Exists & Match Amounts
    // Prevents attackers from modifying fee amounts via browser developer tools
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: payload.invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Target invoice not found in university ledger." },
        { status: 404 }
      );
    }

    if (invoice.studentId !== payload.studentId) {
      return NextResponse.json(
        { success: false, error: "Invoice does not belong to the specified student identity." },
        { status: 403 }
      );
    }

    if (invoice.amount !== payload.amount) {
      return NextResponse.json(
        {
          success: false,
          error: "TAMPER DETECTED: Payload amount does not match ledger invoice amount.",
          expectedAmount: invoice.amount,
          receivedAmount: payload.amount,
        },
        { status: 403 }
      );
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: "This invoice has already been cleared and marked as PAID." },
        { status: 400 }
      );
    }

    // 2. DISPATCH TO AGGREGATION & AI FRAUD ENGINE
    const engineResult = await evaluatePaymentTransaction(payload);

    // If blocked by AI or Heuristic, return HTTP 403 Forbidden with forensic explanation
    if (engineResult.verdict === 'FRAUDULENT') {
      return NextResponse.json(
        {
          success: false,
          message: "Payment intercepted and terminated by security engine.",
          forensicReport: engineResult,
        },
        { status: 403 }
      );
    }

    // 3. TRANSACTION CLEARED CLEANLY
    return NextResponse.json(
      {
        success: true,
        message: "Payment authorized. Invoice marked as PAID in ledger.",
        data: engineResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CHECKOUT ROUTE ERROR]:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during checkout processing." },
      { status: 500 }
    );
  }
}