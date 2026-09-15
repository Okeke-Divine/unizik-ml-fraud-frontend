// unizik-ml-fraud-frontend/src/app/api/receipt/[txId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await params;

    if (!txId) {
      return NextResponse.json(
        { success: false, error: "Transaction or Invoice reference is required." },
        { status: 400 }
      );
    }

    // Search SQLite ledger by Invoice ID, Transaction ID, or Payment Reference
    const invoice = await prisma.feeInvoice.findFirst({
      where: {
        OR: [
          { id: txId },
          { transactions: { some: { id: txId } } },
          { transactions: { some: { reference: txId } } },
        ],
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        student: true,
      },
    });
    console.log(invoice)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "No matching payment record found in university bursary records." },
        { status: 404 }
      );
    }

    if (invoice.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: "This invoice has not been marked as PAID. Official receipt cannot be generated." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, invoice }, { status: 200 });
  } catch (error: any) {
    console.error("[RECEIPT API ERROR]:", error.message);
    return NextResponse.json(
      { success: false, error: "Internal server error while retrieving receipt data." },
      { status: 500 }
    );
  }
}