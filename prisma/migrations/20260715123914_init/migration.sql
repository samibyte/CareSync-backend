-- CreateIndex
CREATE INDEX "appointments_paymentStatus_createdAt_idx" ON "appointments"("paymentStatus", "createdAt");
