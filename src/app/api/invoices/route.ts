// unizik-ml-fraud-frontend/src/app/api/invoices/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FeeCategory, InvoiceStatus } from '@prisma/client';

// Official UNIZIK Fee Schedule (Server-Enforced to prevent client-side price tampering)
const OFFICIAL_FEE_SCHEDULE: Record<FeeCategory, number> = {
  TUITION: 85500.00,
  ACCEPTANCE: 45000.00,
  ICT_INFRASTRUCTURE: 15000.00,
  LIBRARY: 5000.00,
  EXAM_CLEARANCE: 10000.00,
};

// GET: Fetch all invoices for a specific student UUID
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Student UUID is required." }, { status: 400 });
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Include the most recent transaction attempt for status indicator
        }
      }
    });

    return NextResponse.json({ success: true, invoices }, { status: 200 });
  } catch (error: any) {
    console.error("[FETCH INVOICES ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Failed to load student ledger." }, { status: 500 });
  }
}

// POST: Generate a new tamper-proof invoice
export async function POST(req: Request) {
  try {
    const { studentId, category, session } = await req.json();

    if (!studentId || !category || !session) {
      return NextResponse.json({ success: false, error: "Student ID, Fee Category, and Session are required." }, { status: 400 });
    }

    if (!(category in OFFICIAL_FEE_SCHEDULE)) {
      return NextResponse.json({ success: false, error: "Invalid university fee category selected." }, { status: 400 });
    }

    const amount = OFFICIAL_FEE_SCHEDULE[category as FeeCategory];

    // Check if an unpaid invoice already exists for this exact fee and session
    const existingPending = await prisma.feeInvoice.findFirst({
      where: {
        studentId,
        category: category as FeeCategory,
        session,
        status: InvoiceStatus.PENDING,
      },
    });

    if (existingPending) {
      return NextResponse.json({
        success: true,
        message: "Existing pending invoice retrieved.",
        invoice: existingPending,
        isExisting: true,
      }, { status: 200 });
    }

    // Create new invoice in SQLite ledger
    const newInvoice = await prisma.feeInvoice.create({
      data: {
        studentId,
        category: category as FeeCategory,
        amount,
        session,
        status: InvoiceStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New invoice generated successfully.",
      invoice: newInvoice,
      isExisting: false,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[CREATE INVOICE ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Failed to generate billing invoice." }, { status: 500 });
  }
}