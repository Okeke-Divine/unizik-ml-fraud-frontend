// unizik-ml-fraud-frontend/src/app/api/admin/transactions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';

    const whereClause: any = {};

    // Filter by transaction clearance status if selected
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    // Multi-word tokenized search (Supports "fname lname", "lname fname", or matric number)
    if (search && search.trim() !== '') {
      const searchWords = search.trim().toLowerCase().split(/\s+/);

      whereClause.AND = searchWords.map((word) => ({
        OR: [
          { reference: { contains: word } },
          { student: { matricNumber: { contains: word } } },
          { student: { firstName: { contains: word } } },
          { student: { lastName: { contains: word } } },
          { invoice: { category: { contains: word } } },
        ],
      }));
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
        appeal: true,
      },
    });

    return NextResponse.json({ success: true, transactions }, { status: 200 });
  } catch (error: any) {
    console.error('[ADMIN TRANSACTIONS ERROR]:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to retrieve global transaction ledger.' }, { status: 500 });
  }
}
