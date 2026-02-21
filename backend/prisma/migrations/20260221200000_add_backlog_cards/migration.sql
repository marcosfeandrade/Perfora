-- Add workspaceId to Card (nullable first)
ALTER TABLE "Card" ADD COLUMN "workspaceId" TEXT;

-- Populate workspaceId from column -> board -> workspace for existing cards
UPDATE "Card" c
SET "workspaceId" = b."workspaceId"
FROM "Column" col
JOIN "Board" b ON col."boardId" = b."id"
WHERE c."columnId" = col."id";

-- Make workspaceId NOT NULL
ALTER TABLE "Card" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Add foreign key
ALTER TABLE "Card" ADD CONSTRAINT "Card_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make columnId nullable (cards can exist without column = backlog)
ALTER TABLE "Card" ALTER COLUMN "columnId" DROP NOT NULL;
