// unizik-ml-fraud-frontend/src/app/api/admin/transactions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FeeCategory, TransactionStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '15', 10));
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    // Filter by transaction clearance status if valid enum
    if (status !== 'ALL' && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
      andConditions.push({ status: status as TransactionStatus });
    }

    // Filter by fee category if valid enum
    if (category !== 'ALL' && Object.values(FeeCategory).includes(category as FeeCategory)) {
      andConditions.push({ invoice: { category: category as FeeCategory } });
    }

    // Multi-token search safe for PostgreSQL text fields and Enums
    if (search && search.trim() !== '') {
      const searchWords = search.trim().split(/\s+/);

      for (const word of searchWords) {
        const normalizedWord = word.toUpperCase().replace(/\s+/g, '_');
        const isMatchingEnum = Object.values(FeeCategory).includes(normalizedWord as FeeCategory);

        const orConditions: any[] = [
          { reference: { contains: word, mode: 'insensitive' } },
          { student: { matricNumber: { contains: word, mode: 'insensitive' } } },
          { student: { firstName: { contains: word, mode: 'insensitive' } } },
          { student: { lastName: { contains: word, mode: 'insensitive' } } },
        ];

        // PostgreSQL enums accept equals, not contains
        if (isMatchingEnum) {
          orConditions.push({
            invoice: { category: { equals: normalizedWord as FeeCategory } },
          });
        }

        andConditions.push({ OR: orConditions });
      }
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const [totalRecords, transactions] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    return NextResponse.json(
      {
        success: true,
        transactions,
        total: totalRecords,
        pages: totalPages,
        page,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[ADMIN TRANSACTIONS ERROR]:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve global transaction ledger.' },
      { status: 500 }
    );
  }
}