// unizik-ml-fraud-frontend/src/app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { matricNumber, email, password, firstName, lastName, department, level, deviceId } = await req.json();

    if (!matricNumber || !email || !password || !firstName || !lastName || !department || !level) {
      return NextResponse.json({ success: false, error: "All student registration fields are mandatory." }, { status: 400 });
    }

    const existing = await prisma.student.findFirst({
      where: { OR: [{ matricNumber }, { email }] },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Matriculation Number or Email already registered in UNIZIK database." }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newStudent = await prisma.student.create({
      data: {
        matricNumber,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        department,
        level: Number(level),
        loginDeviceId: deviceId || "UNIZIK_FP_REGISTRATION_BASELINE",
      },
    });

    return NextResponse.json({ success: true, message: "Student account created successfully.", studentId: newStudent.id }, { status: 201 });
  } catch (error: any) {
    console.error("[REGISTRATION ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Database creation failure." }, { status: 500 });
  }
}