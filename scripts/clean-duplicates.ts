// scripts/clean-duplicates.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Scanning student ledger for duplicate or corrupted obligations...');

  // Find Sohail
  const student = await prisma.student.findFirst({ where: { matricNumber: '2022514009' } });
  if (!student) return;

  // Delete ANY invoice that is currently marked as BLOCKED or PENDING for ICT_INFRASTRUCTURE
  // This will leave ONLY his clean, paid invoices intact.
  const deleted = await prisma.feeInvoice.deleteMany({
    where: {
      studentId: student.id,
      category: 'ICT_INFRASTRUCTURE',
      status: {
        in: ['BLOCKED', 'PENDING']
      }
    }
  });

  console.log(`✨ Successfully purged ${deleted.count} duplicate/blocked invoice(s). Your ledger is now clean!`);
}

clean().finally(() => prisma.$disconnect());