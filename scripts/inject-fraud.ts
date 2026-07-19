// scripts/inject-fraud.ts

import { PrismaClient, FeeCategory, InvoiceStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function inject() {
  console.log('🌱 Initiating Standalone Fraud Injection Protocol...');

  // 1. Find Sohail by his matric number
  const student = await prisma.student.findFirst({ where: { matricNumber: '2022514009' } });
  if (!student) {
    return console.error('❌ Student Sohail not found. Please run your initial seed script first.');
  }

  // 2. PATH B ENFORCEMENT: Create a BRAND-NEW standalone invoice specifically for this fraud attempt
  // This avoids corrupting or appending to his regular pending/paid obligations.
  const blockedInvoice = await prisma.feeInvoice.create({
    data: {
      studentId: student.id,
      category: FeeCategory.ICT_INFRASTRUCTURE, // Distinct category so you can spot it immediately on UI
      amount: 15000.00,
      session: '2025/2026',
      status: InvoiceStatus.BLOCKED, // CRITICAL: Freezes the obligation immediately
    }
  });

  console.log(`🔒 Generated standalone frozen obligation: [INVOICE-${blockedInvoice.id.substring(0, 8).toUpperCase()}]`);

  // 3. Inject the blocked transaction and link it to the white-box fraud audit log
  const tx = await prisma.transaction.create({
    data: {
      invoiceId: blockedInvoice.id,
      studentId: student.id,
      amount: blockedInvoice.amount,
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
  console.log('----------------------------------------------------------------');
  console.log(`[STUDENT UI]: Invoice will display as "SECURITY HOLD" with "Request Review" button.`);
  console.log(`[ADMIN UI]: Transaction ${tx.reference} logged in Forensics Drawer.`);
  console.log('----------------------------------------------------------------');
}

inject()
  .catch((e) => {
    console.error('❌ Fatal error during injection:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });