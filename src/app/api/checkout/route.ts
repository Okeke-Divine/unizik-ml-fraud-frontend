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
});

/**
 * PRODUCTION NETWORK DETECTOR
 * Detects if the user is on a Nigerian Telco (MTN, Glo, Airtel, 9Mobile).
 * If not, flags as high risk (asnNumber = 1).
 */
async function getNetworkRiskScore(ip: string): Promise<number> {
  // 1. Localhost Handling
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) return 0; // Safe in dev

  try {
    // Using free, no-key API: ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,isp,query`);
    const data = await response.json();

    if (data.status !== "success") return 1; // Flag as risk if we can't resolve IP

    const ispName = data.isp.toUpperCase();
    const telcos = ["MTN", "GLOBACOM", "AIRTEL", "9MOBILE", "ETISALAT"];
    
    // Check if the ISP string includes any of our whitelisted Nigerian Telcos
    const isLocalTelco = telcos.some(telco => ispName.includes(telco));
    
    return isLocalTelco ? 0 : 1; // 0 = Safe (Local), 1 = Risky (VPN/Foreign/Other)
  } catch (e) {
    console.error("[NETWORK DETECTION ERROR]", e);
    return 1; // Default to risky if detection fails
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    // Get real IP from headers
    const rawIp = headersList.get('x-forwarded-for') || '127.0.0.1';
    const ipAddress = rawIp.split(',')[0]; // Handle proxy chains

    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation Failed", details: validation.error }, { status: 400 });
    }

    // Server-side network risk assessment
    const asnNumber = await getNetworkRiskScore(ipAddress);

    // Merge client telemetry with server-derived network metadata
    const payload = {
      ...validation.data,
      ipAddress,
      asnNumber, // ENFORCED: Server overrides client's asnNumber
    };

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

    if (engineResult.verdict === 'FRAUDULENT') {
      return NextResponse.json({ success: false, message: "Blocked", forensicReport: engineResult }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Authorized", data: engineResult }, { status: 200 });
  } catch (error: any) {
    console.error("[CHECKOUT ROUTE ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}