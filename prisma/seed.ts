// unizik-ml-fraud-frontend/prisma/seed.ts

import { PrismaClient, FeeCategory, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initiating UNIZIK Ledger Seeding Protocol...');

  // 1. Wipe old records
  await prisma.appeal.deleteMany();
  await prisma.fraudAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  // 2. Create Admin Account
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: adminPasswordHash,
      fullName: 'Dr. Prof. B.O. Ekeh (Chief Bursary Officer)',
      role: 'BURSARY_DIRECTOR',
    },
  });

  // 3. Create Student 1: Normal Undergraduate Profile (Chinedu)
  const student1 = await prisma.student.create({
    data: {
      matricNumber: '2022514001',
      email: 'c.okafor@unizik.edu.ng',
      password: defaultPasswordHash,
      firstName: 'Chinedu',
      lastName: 'Okafor',
      department: 'Computer Science',
      level: 400,
      loginDeviceId: 'UNIZIK_FP_CLEAN_BASELINE_CHINEDU',
    },
  });

  await prisma.feeInvoice.create({
    data: {
      studentId: student1.id,
      category: FeeCategory.TUITION,
      amount: 85500.00,
      session: '2025/2026',
      status: InvoiceStatus.PENDING,
    },
  });

  // 4. Create Student 2: High-Risk Attack Target Profile (Sohail)
  const student2 = await prisma.student.create({
    data: {
      matricNumber: '2022514009',
      email: 'sohail.sec@unizik.edu.ng',
      password: defaultPasswordHash,
      firstName: 'Sohail',
      lastName: 'Abdel',
      department: 'Computer Science',
      level: 400,
      loginDeviceId: 'UNIZIK_FP_ORIGINAL_SOHAIL_LAPTOP',
    },
  });

  await prisma.feeInvoice.create({
    data: {
      studentId: student2.id,
      category: FeeCategory.ACCEPTANCE,
      amount: 45000.00,
      session: '2025/2026',
      status: InvoiceStatus.PENDING,
    },
  });

  console.log('✅ Seeding Complete! Demo Login Credentials Established:');
  console.log('----------------------------------------------------------------');
  console.log('[NORMAL STUDENT] Matric: 2022/184042  | Pass: password123');
  console.log('[ATTACK TARGET]  Matric: 2022/184099  | Pass: password123');
  console.log('[ADMIN COMMAND]  User:   admin        | Pass: admin123');
  console.log('----------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });