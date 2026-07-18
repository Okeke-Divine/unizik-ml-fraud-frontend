// unizik-ml-fraud-frontend/src/app/api/admin/transactions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const whereClause: any = {};

    if (status && status !== 'ALL') {
      // Ensure we map the frontend dropdown strings to the exact DB Enums
      if (status === 'CLEARED') {
        whereClause.status = 'CLEARED';
      } else if (status === 'BLOCKED') {
        whereClause.status = 'BLOCKED';
      } else if (status === 'PENDING') {
        whereClause.status = 'PENDING';
      } else if (status === 'FAILED') {
        whereClause.status = 'FAILED';
      }
    }

    if (category && category !== 'ALL') {
      whereClause.invoice = { category: category as any };
    }

    if (search && search.trim() !== '') {
      whereClause.OR = [
        { reference: { contains: search } },
        { student: { matricNumber: { contains: search } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          student: { select: { matricNumber: true, firstName: true, lastName: true } },
          invoice: { select: { category: true } },
          auditLog: true,
        },
      }),
      prisma.transaction.count({ where: whereClause })
    ]);

    return NextResponse.json({ success: true, transactions, total, pages: Math.ceil(total / limit) }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
