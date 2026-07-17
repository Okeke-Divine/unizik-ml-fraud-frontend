// unizik-ml-fraud-frontend/src/app/api/admin/transactions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const whereClause: any = {};

    // 1. Status Filter
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // 2. Fee Category Filter
    if (category && category !== 'ALL') {
      whereClause.invoice = {
        category: category as any,
      };
    }

    // 3. Search Filter (Matriculation No, Name, or Payment Reference)
    if (search && search.trim() !== '') {
      whereClause.OR = [
        { reference: { contains: search } },
        { student: { matricNumber: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { firstName: { contains: search } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            matricNumber: true,
            firstName: true,
            lastName: true,
            department: true,
            level: true,
          },
        },
        invoice: {
          select: {
            category: true,
            session: true,
            amount: true,
          },
        },
        auditLog: true,
      },
    });

    return NextResponse.json({ success: true, transactions }, { status: 200 });
  } catch (error: any) {
    console.error("[ADMIN LEDGER ERROR]:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to load bursary transaction records." },
      { status: 500 }
    );
  }
}