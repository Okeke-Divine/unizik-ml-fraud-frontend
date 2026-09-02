import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deviceId: string | undefined = body.deviceId;
    const studentId: string | undefined = body.studentId;

    if (!deviceId && !studentId) {
      return NextResponse.json({ error: 'deviceId or studentId required' }, { status: 400 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const older = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Move simulated transactions outside the 24h / 1h window by setting createdAt older.
    const whereClause: any = {
      AND: [
        { createdAt: { gte: twentyFourHoursAgo } },
        { status: { in: ['BLOCKED', 'FAILED'] } },
      ]
    };
    if (deviceId) whereClause.AND.push({ deviceId });
    if (studentId) whereClause.AND.push({ studentId });

    await prisma.transaction.updateMany({
      where: whereClause,
      data: { createdAt: older },
    });

    // Insert audit log entry recording the reset (omit transactionId when none)
    // const auditData: any = {
    //   studentId: studentId ?? undefined,
    //   prediction: 0,
    //   confidence: 0,
    //   verdict: 'SYSTEM',
    //   explanation: `Demo reset executed for deviceId=${deviceId} studentId=${studentId}`,
    // };

    // await prisma.fraudAuditLog.create({ data: auditData });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[DEMO RESET ERROR]', e.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
