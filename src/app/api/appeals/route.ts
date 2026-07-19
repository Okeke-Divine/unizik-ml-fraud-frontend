// unizik-ml-fraud-frontend/src/app/api/appeals/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch appeals for Admin or specific Student
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const whereClause: any = {};
    if (studentId) whereClause.studentId = studentId;

    const appeals = await prisma.appeal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { matricNumber: true, firstName: true, lastName: true, department: true } },
        transaction: {
          include: {
            invoice: { select: { category: true, session: true, amount: true, id: true } },
            auditLog: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, appeals }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Student submits a dispute (Hardened against duplicate @unique collisions)
export async function POST(req: Request) {
  try {
    const { studentId, invoiceId, reason } = await req.json();

    if (!studentId || !invoiceId || !reason) {
      return NextResponse.json({ success: false, error: "Missing required dispute parameters." }, { status: 400 });
    }

    // 1. Find the latest blocked transaction associated with this invoice
    const tx = await prisma.transaction.findFirst({
      where: { invoiceId, studentId, status: 'BLOCKED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!tx) {
      return NextResponse.json({ success: false, error: "No blocked transaction record found for this obligation." }, { status: 404 });
    }

    // 2. CRITICAL PRE-FLIGHT CHECK: Query if an appeal record already exists for this transaction
    const existingAppeal = await prisma.appeal.findUnique({
      where: { transactionId: tx.id }
    });

    if (existingAppeal) {
      // If it is already sitting in Dr. Ekeh's queue, forbid duplicate submissions
      if (existingAppeal.status === 'PENDING') {
        return NextResponse.json({ 
          success: false, 
          error: "A verification appeal has already been submitted for this security hold and is currently active in the Chief Bursar's review queue." 
        }, { status: 400 });
      }

      // If it was previously REJECTED, update the existing record with the new excuse instead of crashing!
      const resubmittedAppeal = await prisma.appeal.update({
        where: { transactionId: tx.id },
        data: {
          reason,
          status: 'PENDING',
          adminNotes: null // Clear out old admin rejection notes
        }
      });

      return NextResponse.json({ success: true, appeal: resubmittedAppeal, message: "Appeal resubmitted successfully." }, { status: 200 });
    }

    // 3. Create fresh appeal ONLY if no prior record exists for this transaction ID
    const appeal = await prisma.appeal.create({
      data: {
        transactionId: tx.id,
        studentId,
        reason,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, appeal }, { status: 201 });
  } catch (error: any) {
    console.error("[APPEAL SUBMISSION ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Failed to transmit appeal to administrative ledger." }, { status: 500 });
  }
}

// PATCH: Admin approves override and resets Invoice to PENDING
export async function PATCH(req: Request) {
  try {
    const { appealId, status, adminNotes } = await req.json(); // status: 'APPROVED' | 'REJECTED'

    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
      include: { transaction: true }
    });

    if (!appeal) {
      return NextResponse.json({ success: false, error: "Dispute record not found." }, { status: 404 });
    }

    // Execute atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Update Appeal state
      await tx.appeal.update({
        where: { id: appealId },
        data: { status, adminNotes }
      });

      // 2. If approved, unlock the parent Invoice so student can pay again!
      if (status === 'APPROVED' && appeal.transaction?.invoiceId) {
        await tx.feeInvoice.update({
          where: { id: appeal.transaction.invoiceId },
          data: { status: 'PENDING' as any }
        });
      }
    });

    return NextResponse.json({ success: true, message: `Dispute successfully ${status.toLowerCase()}.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}