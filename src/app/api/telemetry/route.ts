import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const deviceId = url.searchParams.get('deviceId');
    const studentId = url.searchParams.get('studentId');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (!deviceId && !studentId) {
      return NextResponse.json({ error: 'deviceId or studentId required' }, { status: 400 });
    }

    const distinctStudentsOnDevice = deviceId ? await prisma.transaction.findMany({
      where: { deviceId, createdAt: { gte: twentyFourHoursAgo } },
      select: { studentId: true },
      distinct: ['studentId'],
    }) : [];

    const deviceStudentCount24h = distinctStudentsOnDevice.length + (studentId && !distinctStudentsOnDevice.some(r => r.studentId === studentId) ? 1 : 0);

    const failedAttempts1h = await prisma.transaction.count({
      where: {
        OR: [{ studentId: studentId || undefined }, { deviceId: deviceId || undefined }],
        status: { in: ['BLOCKED', 'FAILED'] },
        createdAt: { gte: oneHourAgo },
      },
    });

    // Simple ASN detection: reuse ip-based heuristic if available in transaction table
    const lastTxn = await prisma.transaction.findFirst({ where: deviceId ? { deviceId } : (studentId ? { studentId } : {}), orderBy: { createdAt: 'desc' } });
    const isHighRiskAsn = lastTxn?.asnNumber === 1 ? 1 : 0;

    return NextResponse.json({
      device_student_count_24h: deviceStudentCount24h,
      failed_attempts_1h: failedAttempts1h,
      is_high_risk_asn: isHighRiskAsn,
    });
  } catch (e: any) {
    console.error('[TELEMETRY API ERROR]', e.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
