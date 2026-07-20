// unizik-ml-fraud-frontend/src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs'; // CRITICAL FIX: Use bcryptjs to match your login and seed scripts!

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matricNumber, email, password, firstName, lastName, department, level, deviceId } = body;

    // 1. Strict Institutional Validation
    if (!matricNumber || !email || !password || !firstName || !lastName || !department || !level) {
      return NextResponse.json({ 
        success: false, 
        error: "All academic profile fields are strictly required for onboarding." 
      }, { status: 400 });
    }

    // 2. Format Enforcement
    const cleanMatric = matricNumber.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // 3. Duplicate Account Prevention
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { matricNumber: cleanMatric },
          { email: cleanEmail }
        ]
      }
    });

    if (existingStudent) {
      const field = existingStudent.matricNumber === cleanMatric ? "Matriculation Number" : "Email Address";
      return NextResponse.json({ 
        success: false, 
        error: `A student profile with this ${field} is already registered in the central database.` 
      }, { status: 409 });
    }

    // 4. Create Student Profile & Hash Password with BCRYPT (10 salt rounds)
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newStudent = await prisma.student.create({
      data: {
        matricNumber: cleanMatric,
        email: cleanEmail,
        password: hashedPassword, // Perfectly encrypted for login compatibility!
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim(),
        level: Number(level),
        loginDeviceId: deviceId || "UNKNOWN_BASELINE"
      }
    });

    // 5. Return sanitized profile (excluding password hash)
    const { password: _, ...sanitizedStudent } = newStudent;

    return NextResponse.json({ 
      success: true, 
      message: "Undergraduate profile registered successfully.",
      user: sanitizedStudent 
    }, { status: 201 });

  } catch (error: any) {
    console.error("[STUDENT REGISTRATION ERROR]:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "An internal database error occurred while creating your student profile." 
    }, { status: 500 });
  }
}