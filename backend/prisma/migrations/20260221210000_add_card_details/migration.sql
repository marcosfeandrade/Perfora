-- Add labels to Workspace
ALTER TABLE "Workspace" ADD COLUMN "labels" JSONB;

-- Add new columns to Card
ALTER TABLE "Card" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Card" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "Card" ADD COLUMN "labels" JSONB;
ALTER TABLE "Card" ADD COLUMN "createdById" TEXT;

-- Add foreign key for createdBy
ALTER TABLE "Card" ADD CONSTRAINT "Card_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
