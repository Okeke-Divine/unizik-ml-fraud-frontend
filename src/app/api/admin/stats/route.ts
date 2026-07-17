// unizik-ml-fraud-frontend/src/app/api/admin/stats/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { student: true, auditLog: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = transactions
      .filter(t => t.status === 'CLEARED')
      .reduce((sum, t) => sum + t.amount, 0);

    const fraudCount = await prisma.transaction.count({ where: { status: 'BLOCKED' } });

    return NextResponse.json({ 
      success: true, 
      stats: { totalRevenue, fraudCount, transactions } 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch admin stats" }, { status: 500 });
  }
}