-- AlterTable
ALTER TABLE "users" ADD COLUMN "student_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_student_code_key" ON "users"("student_code");
