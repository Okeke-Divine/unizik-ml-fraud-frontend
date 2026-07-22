// unizik-ml-fraud-frontend/src/app/api/auth/register-admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, username, role, password } = body;

    // 1. Strict Executive Field Validation
    if (!fullName || !username || !role || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "All executive identification and clearance fields are required." 
      }, { status: 400 });
    }

    // 2. Format Enforcement
    const cleanUsername = username.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    // 3. Duplicate Account Prevention
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: cleanUsername }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: `An administrative officer with the username '${cleanUsername}' is already registered in the central system.` 
      }, { status: 409 });
    }

    // 4. Hash Executive Password with BCRYPT (10 salt rounds)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 5. Create Administrative Record
    const newAdmin = await prisma.admin.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        fullName: cleanFullName,
        role: role.trim().toUpperCase()
      }
    });

    // 6. Return sanitized profile (excluding password hash)
    const { password: _, ...sanitizedAdmin } = newAdmin;

    return NextResponse.json({ 
      success: true, 
      message: "Executive administration profile registered successfully.",
      user: sanitizedAdmin 
    }, { status: 201 });

  } catch (error: any) {
    console.error("[ADMIN REGISTRATION ERROR]:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "An internal database error occurred while authorizing the executive account." 
    }, { status: 500 });
  }
}