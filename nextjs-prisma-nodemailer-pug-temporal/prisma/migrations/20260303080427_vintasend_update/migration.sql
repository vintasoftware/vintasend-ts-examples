-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "emailOrPhone" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gitCommitSha" TEXT,
ADD COLUMN     "lastName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AttachmentFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storageMetadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttachmentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttachment" (
    "id" TEXT NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentFile_checksum_key" ON "AttachmentFile"("checksum");

-- CreateIndex
CREATE INDEX "AttachmentFile_checksum_idx" ON "AttachmentFile"("checksum");

-- CreateIndex
CREATE INDEX "NotificationAttachment_notificationId_idx" ON "NotificationAttachment"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationAttachment_fileId_idx" ON "NotificationAttachment"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAttachment_notificationId_fileId_key" ON "NotificationAttachment"("notificationId", "fileId");

-- CreateIndex
CREATE INDEX "Notification_status_sendAfter_idx" ON "Notification"("status", "sendAfter");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_emailOrPhone_idx" ON "Notification"("emailOrPhone");

-- CreateIndex
CREATE INDEX "Notification_gitCommitSha_idx" ON "Notification"("gitCommitSha");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttachment" ADD CONSTRAINT "NotificationAttachment_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttachment" ADD CONSTRAINT "NotificationAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "AttachmentFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
