-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matric_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "session" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fee_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "device_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "asn_number" INTEGER NOT NULL DEFAULT 0,
    "page_dwell_time" REAL NOT NULL,
    "is_off_peak" INTEGER NOT NULL DEFAULT 0,
    "hardware_mismatch" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "fee_invoices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fraud_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "prediction" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "verdict" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_audit_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fraud_audit_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "students_matric_number_key" ON "students"("matric_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "fee_invoices_student_id_status_idx" ON "fee_invoices"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_device_id_created_at_idx" ON "transactions"("device_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_student_id_status_created_at_idx" ON "transactions"("student_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "transactions_device_id_student_id_created_at_idx" ON "transactions"("device_id", "student_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_audit_logs_transaction_id_key" ON "fraud_audit_logs"("transaction_id");

-- CreateIndex
CREATE INDEX "fraud_audit_logs_verdict_created_at_idx" ON "fraud_audit_logs"("verdict", "created_at");
