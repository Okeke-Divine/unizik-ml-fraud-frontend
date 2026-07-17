// unizik-ml-fraud-frontend/src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { matricNumber, password, deviceId, isAdmin } = await req.json();

    if (!password || (!matricNumber && !isAdmin)) {
      return NextResponse.json(
        { success: false, error: "Username/Matriculation Number and password are required." },
        { status: 400 }
      );
    }

    // --- ADMIN AUTHENTICATION PATH ---
    if (isAdmin) {
      const admin = await prisma.admin.findUnique({ where: { username: matricNumber } });
      if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return NextResponse.json({ success: false, error: "Invalid Admin credentials." }, { status: 401 });
      }

      const response = NextResponse.json({ success: true, role: 'ADMIN', user: { id: admin.id, name: admin.fullName } });
      response.cookies.set('unizik_session', JSON.stringify({ id: admin.id, role: 'ADMIN', name: admin.fullName }), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 86400,
      });
      return response;
    }

    // --- STUDENT AUTHENTICATION PATH ---
    const student = await prisma.student.findUnique({ where: { matricNumber } });
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return NextResponse.json({ success: false, error: "Invalid Matriculation Number or Password." }, { status: 401 });
    }

    // SECURITY ACTION: Update stored loginDeviceId baseline if provided by frontend
    if (deviceId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { loginDeviceId: deviceId },
      });
    }

    const response = NextResponse.json({
      success: true,
      role: 'STUDENT',
      user: {
        id: student.id,
        matricNumber: student.matricNumber,
        name: `${student.firstName} ${student.lastName}`,
        department: student.department,
        level: student.level,
        loginDeviceId: deviceId || student.loginDeviceId,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set('unizik_session', JSON.stringify({
      id: student.id,
      matricNumber: student.matricNumber,
      role: 'STUDENT',
      loginDeviceId: deviceId || student.loginDeviceId,
    }), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Authentication system error." }, { status: 500 });
  }
}