// unizik-ml-fraud-frontend/src/app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { evaluatePaymentTransaction } from '@/lib/fraud-engine';

// Payload schema: Client reports what it can measure (timing, fingerprinting).
// Server detects what it can prove (IP, ASN/Telco, Location).
const checkoutSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  reference: z.string().min(6),
  deviceId: z.string().min(8),
  pageDwellTime: z.number().positive(),
  hardwareMismatch: z.number().int().min(0).max(1),
  simMode: z.enum(["NORMAL", "BOT", "SPOOF"]).optional().default("NORMAL"),
  // Optional client-side diagnostics overrides (when panel is edited)
  overrideFeatures: z.object({
    device_student_count_24h: z.number().int().min(0).optional(),
    page_dwell_time_seconds: z.number().optional(),
    is_high_risk_asn: z.number().int().min(0).max(1).optional(),
    failed_attempts_1h: z.number().int().min(0).optional(),
    session_hardware_mismatch: z.number().int().min(0).max(1).optional(),
    is_off_peak_hour: z.number().int().min(0).max(1).optional(),
  }).optional(),
  telemetry_source: z.enum(['SIMULATED','LIVE']).optional(),
});

/**
 * PRODUCTION NETWORK DETECTOR
 * Detects if the user is on a Nigerian Telco (MTN, Glo, Airtel, 9Mobile).
 * If not, flags as high risk (asnNumber = 1).
 */
async function getNetworkRiskScore(ip: string): Promise<number> {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) return 0;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,isp,query`);
    const data = await response.json();

      // Debug: log ip-api response so we can see the ISP string returned for this IP
      try {
        console.log('[NETWORK DETECTION] ip-api response for', ip, JSON.stringify(data));
      } catch (e) {}

    if (data.status !== "success") return 1;

    const ispName = data.isp.toUpperCase();
    const telcos = ["MTN", "GLOBACOM", "AIRTEL", "9MOBILE", "ETISALAT"];
    const isLocalTelco = telcos.some(telco => ispName.includes(telco));

    return isLocalTelco ? 0 : 1;
  } catch (e) {
    console.error("[NETWORK DETECTION ERROR]", e);
    return 1;
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const rawIp = headersList.get('x-forwarded-for') || '127.0.0.1';
    const ipAddress = rawIp.split(',')[0];

    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation Failed", details: validation.error }, { status: 400 });
    }

    const asnNumber = await getNetworkRiskScore(ipAddress);

    const payload = {
      ...validation.data,
      ipAddress,
      asnNumber,
    };

    // Debugging aids: log incoming payload and whether overrideFeatures were included
    try {
      console.log('--- [CHECKOUT DEBUG] Incoming checkout payload ---');
      console.log(JSON.stringify(payload, null, 2));
      console.log('--- [CHECKOUT DEBUG] overrideFeatures present:', !!(payload as any).overrideFeatures);
    } catch (e) {}

    // If the client requested a simulated hardware mismatch, synthesize a different deviceId
    try {
      if ((payload as any).overrideFeatures && (payload as any).overrideFeatures.session_hardware_mismatch === 1) {
        const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
        (payload as any).deviceId = `UNIZIK_FP_${rand}`;
        console.log('[CHECKOUT DEBUG] Synthesized deviceId for simulated mismatch:', (payload as any).deviceId);
      }
    } catch (e) {}

    // 1. FINANCIAL INTEGRITY GUARDRAIL
    const invoice = await prisma.feeInvoice.findUnique({ where: { id: payload.invoiceId } });
    if (!invoice || invoice.studentId !== payload.studentId || invoice.amount !== payload.amount) {
      return NextResponse.json({ success: false, error: "Invalid or Tampered Invoice" }, { status: 403 });
    }
    if (invoice.status === 'PAID') {
      return NextResponse.json({ success: false, error: "This fee invoice has already been cleared and marked as PAID in the university records." }, { status: 400 });
    }

    // 2. DISPATCH TO ML ENGINE
    const engineResult = await evaluatePaymentTransaction(payload);

    const tx = await prisma.transaction.upsert({
      where: { reference: payload.reference },
      update: {},
      create: {
        invoiceId: payload.invoiceId,
        studentId: payload.studentId,
        amount: payload.amount,
        reference: payload.reference,
        deviceId: payload.deviceId,
        ipAddress: payload.ipAddress,
        asnNumber: payload.asnNumber,
        pageDwellTime: payload.pageDwellTime,
        hardwareMismatch: payload.hardwareMismatch,
        status: engineResult.verdict === 'FRAUDULENT' ? 'BLOCKED' : 'CLEARED'
      }
    });

    if (engineResult.verdict === 'FRAUDULENT') {
      await prisma.feeInvoice.update({
        where: { id: payload.invoiceId },
        data: { status: 'BLOCKED' as any }
      });

      return NextResponse.json({ success: false, message: "Blocked", forensicReport: engineResult }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Authorized", data: { id: tx.id } }, { status: 200 });
  } catch (error: any) {
    console.error("[CHECKOUT ROUTE ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}