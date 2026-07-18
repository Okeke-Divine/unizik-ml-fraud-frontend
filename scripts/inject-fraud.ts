// scripts/inject-fraud.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inject() {
  // 1. Find Sohail by his updated matric number
  const student = await prisma.student.findFirst({ where: { matricNumber: '2022514009' } });
  if (!student) return console.error('❌ Student Sohail not found. Seed the database first.');

  // 2. Find his pending fee invoice
  const invoice = await prisma.feeInvoice.findFirst({ where: { studentId: student.id, status: 'PENDING' } });
  if (!invoice) return console.error('❌ No pending invoice found for this student.');
  
  // 3. Inject the blocked transaction and link it to the white-box fraud audit log
  await prisma.transaction.create({
    data: {
      invoiceId: invoice.id,
      studentId: student.id,
      amount: invoice.amount,
      reference: `PAY_FRAUD_${Date.now()}`,
      status: 'BLOCKED',
      deviceId: 'UNIZIK_FP_MALICIOUS_BOT_001',
      ipAddress: '192.0.2.1', // Non-whitelisted foreign subnet
      asnNumber: 1, // Flags network variance risk
      pageDwellTime: 0.1, // Bot-like lightning speed
      hardwareMismatch: 1, // Hardware mismatch flag active
      isOffPeak: 0,
      auditLog: {
        create: {
          studentId: student.id,
          prediction: 1, // 1 = Fraudulent per schema specifications
          confidence: 0.985,
          verdict: 'FRAUDULENT',
          explanation: 'Automated Fraud Engine: Detected device hardware fingerprint mismatch alongside anomalous low-dwell page telemetry from an unverified ASN route.'
        }
      }
    }
  });
  console.log('💀 Fraudulent transaction and forensic audit logs injected successfully.');
}

inject()
  .catch((e) => {
    console.error('❌ Fatal error during injection:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });