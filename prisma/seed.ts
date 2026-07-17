// unizik-ml-fraud-frontend/prisma/seed.ts

import { PrismaClient, FeeCategory, InvoiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initiating UNIZIK Ledger Seeding Protocol...');

  // 1. Clean existing tables to prevent unique constraint collisions during re-seeding
  await prisma.fraudAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.student.deleteMany();

  // 2. Create Student 1: Normal Undergraduate Profile
  const student1 = await prisma.student.create({
    data: {
      matricNumber: '2022/184042',
      email: 'c.okafor@unizik.edu.ng',
      firstName: 'Chinedu',
      lastName: 'Okafor',
      department: 'Computer Science',
      level: 400,
    },
  });

  // Create Tuition Invoice for Student 1
  const invoice1 = await prisma.feeInvoice.create({
    data: {
      studentId: student1.id,
      category: FeeCategory.TUITION,
      amount: 85500.00,
      session: '2025/2026',
      status: InvoiceStatus.PENDING,
    },
  });

  // 3. Create Student 2: High-Risk / Test Target Profile
  const student2 = await prisma.student.create({
    data: {
      matricNumber: '2022/184099',
      email: 'sohail.sec@unizik.edu.ng',
      firstName: 'Sohail',
      lastName: 'Abdel',
      department: 'Computer Science',
      level: 400,
    },
  });

  // Create Acceptance Fee Invoice for Student 2
  const invoice2 = await prisma.feeInvoice.create({
    data: {
      studentId: student2.id,
      category: FeeCategory.ACCEPTANCE,
      amount: 45000.00,
      session: '2025/2026',
      status: InvoiceStatus.PENDING,
    },
  });

  console.log('✅ Seeding Complete! Ground-truth UUIDs generated for testing:');
  console.log('----------------------------------------------------------------');
  console.log(`[NORMAL STUDENT] ID:  ${student1.id}`);
  console.log(`[NORMAL INVOICE] ID:  ${invoice1.id} (Amount: N85,500)`);
  console.log('----------------------------------------------------------------');
  console.log(`[TARGET STUDENT] ID:  ${student2.id}`);
  console.log(`[TARGET INVOICE] ID:  ${invoice2.id} (Amount: N45,000)`);
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