// unizik-ml-fraud-frontend/src/app/api/admin/forensics/[txId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: txId },
      include: {
        student: {
          select: {
            id: true,
            matricNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            level: true,
            loginDeviceId: true, // Baseline hardware fingerprint captured at login
          },
        },
        invoice: {
          select: {
            category: true,
            session: true,
            amount: true,
            status: true,
          },
        },
        auditLog: true,
        appeal: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Forensic record not found in university ledger." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, transaction }, { status: 200 });
  } catch (error: any) {
    console.error("[FORENSICS API ERROR]:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to query forensic telemetry database." },
      { status: 500 }
    );
  }
}