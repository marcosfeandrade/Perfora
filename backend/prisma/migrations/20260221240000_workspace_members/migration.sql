CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

ALTER TABLE "Workspace" ADD COLUMN "ownerId" TEXT;

UPDATE "Workspace" SET "ownerId" = "userId" WHERE "userId" IS NOT NULL;

DELETE FROM "Workspace" WHERE "userId" IS NULL;

ALTER TABLE "Workspace" DROP COLUMN "userId";

ALTER TABLE "Workspace" ALTER COLUMN "ownerId" SET NOT NULL;

ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role")
SELECT gen_random_uuid()::text, w.id, w."ownerId", 'OWNER'
FROM "Workspace" w;
