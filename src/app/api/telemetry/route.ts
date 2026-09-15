import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type NetworkProbe = { isHighRiskAsn: number; resolvedIp: string; isp: string; source: 'header-ip' | 'egress-ip' | 'fallback' };

function isPrivateOrLocalIp(ip: string): boolean {
  const octets = ip.split('.').map((part) => Number(part));
  const isPrivateIpv4 =
    octets.length === 4 &&
    octets.every((n) => Number.isFinite(n) && n >= 0 && n <= 255) &&
    (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );

  return ip === '127.0.0.1' || ip === '::1' || isPrivateIpv4;
}

async function getNetworkProbe(ip: string, fallback: number): Promise<NetworkProbe> {
  const target = isPrivateOrLocalIp(ip) ? '' : `/${ip}`;
  const source: NetworkProbe['source'] = target ? 'header-ip' : 'egress-ip';

  try {
    const response = await fetch(`http://ip-api.com/json${target}?fields=status,isp,query`);
    const data = await response.json();
    if (data.status !== 'success') {
      return { isHighRiskAsn: fallback, resolvedIp: ip, isp: 'UNKNOWN', source: 'fallback' };
    }

    const ispName = (data.isp || '').toUpperCase();
    const telcos = ['MTN', 'GLOBACOM', 'AIRTEL', '9MOBILE', 'ETISALAT'];
    const isLocalTelco = telcos.some((telco) => ispName.includes(telco));
    return {
      isHighRiskAsn: isLocalTelco ? 0 : 1,
      resolvedIp: data.query || ip,
      isp: data.isp || 'UNKNOWN',
      source,
    };
  } catch (e) {
    return { isHighRiskAsn: fallback, resolvedIp: ip, isp: 'UNKNOWN', source: 'fallback' };
  }
}

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

    const distinctStudentsOnDevice = deviceId
      ? await prisma.transaction.findMany({
          where: { deviceId, createdAt: { gte: twentyFourHoursAgo } },
          select: { studentId: true },
          distinct: ['studentId'],
        })
      : [];

    const studentsLoggedOnDevice24h = deviceId
      ? await prisma.student.findMany({
          where: {
            loginDeviceId: deviceId,
            updatedAt: { gte: twentyFourHoursAgo },
          },
          select: { id: true },
        })
      : [];

    const distinctStudentIds = new Set<string>();
    distinctStudentsOnDevice.forEach((r) => distinctStudentIds.add(r.studentId));
    studentsLoggedOnDevice24h.forEach((r) => distinctStudentIds.add(r.id));
    if (studentId) distinctStudentIds.add(studentId);
    const deviceStudentCount24h = distinctStudentIds.size || 1;

    const failedAttempts1h = await prisma.transaction.count({
      where: {
        OR: [{ studentId: studentId || undefined }, { deviceId: deviceId || undefined }],
        status: { in: ['BLOCKED', 'FAILED'] },
        createdAt: { gte: oneHourAgo },
      },
    });

    const lastTxn = await prisma.transaction.findFirst({
      where: deviceId ? { deviceId } : studentId ? { studentId } : {},
      orderBy: { createdAt: 'desc' },
    });
    const fallbackAsn = lastTxn?.asnNumber === 1 ? 1 : 0;

    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipAddress = rawIp.split(',')[0].trim();
    const networkProbe = await getNetworkProbe(ipAddress, fallbackAsn);

    return NextResponse.json(
      {
        device_student_count_24h: deviceStudentCount24h,
        failed_attempts_1h: failedAttempts1h,
        is_high_risk_asn: networkProbe.isHighRiskAsn,
        asn_debug: {
          ip: networkProbe.resolvedIp,
          isp: networkProbe.isp,
          source: networkProbe.source,
        },
        telemetry_source: 'LIVE',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (e: any) {
    console.error('[TELEMETRY API ERROR]', e.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
