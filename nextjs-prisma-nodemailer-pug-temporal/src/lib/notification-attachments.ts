/**
 * Notification Attachments Library
 *
 * This module provides utilities for managing file attachments in notifications.
 * It includes functions for:
 * - Uploading files for later reuse
 * - Creating notifications with inline attachments
 * - Reusing previously uploaded files
 * - Managing common assets (logos, legal documents)
 *
 * IMPORTANT: Before using this module, ensure you have:
 * 1. Added AttachmentFile and NotificationAttachment models to your schema.prisma
 * 2. Run: npx prisma migrate dev --name add-attachments
 * 3. Configured S3 environment variables (see ATTACHMENTS_GUIDE.md)
 */

import { PrismaClient } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { S3AttachmentManager } from 'vintasend-aws-s3-attachments';
import type { NotificationAttachment } from 'vintasend/dist/types/attachment';
import type { AttachmentFileRecord } from 'vintasend/dist/types/attachment';
import type { FileAttachment } from 'vintasend/dist/types/attachment';

// Create a singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Initialize S3 AttachmentManager
 * Configure this based on your environment variables
 */
export function createAttachmentManager() {
  return new S3AttachmentManager({
    bucket: process.env.S3_BUCKET_NAME || 'vintasend-attachments',
    region: process.env.AWS_REGION || 'us-east-1',
    keyPrefix: 'attachments/',
    // Optional: For S3-compatible services in development (e.g., LocalStack)
    ...(process.env.S3_ENDPOINT && {
      endpoint: process.env.S3_ENDPOINT,
    }),
    // Optional: Custom credentials (otherwise uses AWS SDK default chain)
    ...(process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }),
  });
}

/**
 * Upload a file and store its metadata in the database
 * This file can then be reused across multiple notifications
 *
 * @param file - File content (Buffer, stream, or path)
 * @param filename - Name of the file
 * @param contentType - MIME type (optional, will be auto-detected)
 * @returns The created AttachmentFileRecord
 */
export async function uploadReusableFile(
  file: FileAttachment,
  filename: string,
  contentType?: string,
): Promise<AttachmentFileRecord> {
  const attachmentManager = createAttachmentManager();

  // Auto-detect content type if not provided
  const finalContentType =
    contentType || attachmentManager.detectContentType(filename);

  // Calculate checksum for deduplication
  const fileBuffer = await attachmentManager.fileToBuffer(file);
  const checksum = await attachmentManager.calculateChecksum(fileBuffer);

  // Check if file already exists
  const existingFile = await prisma.attachmentFile.findFirst({
    where: { checksum },
  });

  if (existingFile) {
    console.log(`File already exists: ${filename} (ID: ${existingFile.id})`);
    return {
      id: existingFile.id,
      filename: existingFile.filename,
      contentType: existingFile.contentType,
      size: existingFile.size,
      checksum: existingFile.checksum,
      storageMetadata: existingFile.storageMetadata as Record<string, unknown>,
      createdAt: existingFile.createdAt,
      updatedAt: existingFile.updatedAt,
    };
  }

  // Upload to S3
  const uploadResult = await attachmentManager.uploadFile(
    fileBuffer,
    filename,
    finalContentType,
  );

  // Save to database
  const fileRecord = await prisma.attachmentFile.create({
    data: {
      id: uploadResult.id,
      filename: uploadResult.filename,
      contentType: uploadResult.contentType,
      size: uploadResult.size,
      checksum: uploadResult.checksum,
      storageMetadata: uploadResult.storageMetadata as InputJsonValue,
    },
  });

  console.log(`Uploaded file: ${filename} (ID: ${fileRecord.id})`);

  return {
    id: fileRecord.id,
    filename: fileRecord.filename,
    contentType: fileRecord.contentType,
    size: fileRecord.size,
    checksum: fileRecord.checksum,
    storageMetadata: fileRecord.storageMetadata as Record<string, unknown>,
    createdAt: fileRecord.createdAt,
    updatedAt: fileRecord.updatedAt,
  };
}

/**
 * Pre-upload common assets that will be reused across many notifications
 * Examples: company logo, legal documents, user guides
 *
 * @param assets - Array of assets to upload
 * @returns Array of uploaded file records
 */
export async function uploadCommonAssets(
  assets: Array<{
    file: FileAttachment;
    filename: string;
    contentType?: string;
    category?: string; // Optional categorization (e.g., 'logo', 'legal', 'guide')
  }>,
): Promise<AttachmentFileRecord[]> {
  const uploadedAssets: AttachmentFileRecord[] = [];

  for (const asset of assets) {
    try {
      const fileRecord = await uploadReusableFile(
        asset.file,
        asset.filename,
        asset.contentType,
      );
      uploadedAssets.push(fileRecord);
    } catch (error) {
      console.error(`Failed to upload ${asset.filename}:`, error);
      // Continue with other files even if one fails
    }
  }

  return uploadedAssets;
}

/**
 * Get a reusable attachment file by ID
 *
 * @param fileId - The attachment file ID
 * @returns The attachment file record or null if not found
 */
export async function getAttachmentFile(
  fileId: string,
): Promise<AttachmentFileRecord | null> {
  const file = await prisma.attachmentFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return null;
  }

  return {
    id: file.id,
    filename: file.filename,
    contentType: file.contentType,
    size: file.size,
    checksum: file.checksum,
    storageMetadata: file.storageMetadata as Record<string, unknown>,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

/**
 * Create an attachment reference for a notification
 * Use this to reference a previously uploaded file
 *
 * @param fileId - ID of the uploaded file
 * @param description - Optional description
 * @returns NotificationAttachment reference
 */
export function createAttachmentReference(
  fileId: string,
  description?: string,
): NotificationAttachment {
  return {
    fileId,
    ...(description && { description }),
  };
}

/**
 * Create an inline attachment for a notification
 * The file will be uploaded when the notification is created
 *
 * @param file - File content
 * @param filename - Name of the file
 * @param contentType - MIME type (optional)
 * @param description - Optional description
 * @returns NotificationAttachment upload
 */
export function createInlineAttachment(
  file: FileAttachment,
  filename: string,
  contentType?: string,
  description?: string,
): NotificationAttachment {
  return {
    file,
    filename,
    ...(contentType && { contentType }),
    ...(description && { description }),
  };
}

/**
 * Find and clean up orphaned attachment files
 * Orphaned files are those not linked to any notification
 *
 * @param olderThanDays - Only clean up files older than this many days (default: 30)
 * @returns Number of files deleted
 */
export async function cleanupOrphanedFiles(
  olderThanDays: number = 30,
): Promise<number> {
  const attachmentManager = createAttachmentManager();
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  // Find orphaned files
  const orphanedFiles = await prisma.attachmentFile.findMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      notificationAttachments: {
        none: {},
      },
    },
  });

  let deletedCount = 0;

  for (const file of orphanedFiles) {
    try {
      // Delete from S3
      const attachmentFile = await attachmentManager.reconstructAttachmentFile(
        file.storageMetadata as Record<string, unknown>,
      );
      await attachmentFile.delete();

      // Delete from database
      await prisma.attachmentFile.delete({
        where: { id: file.id },
      });

      deletedCount++;
      console.log(`Deleted orphaned file: ${file.filename} (${file.id})`);
    } catch (error) {
      console.error(`Failed to delete orphaned file ${file.id}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Get storage statistics for attachments
 *
 * @returns Statistics about attachment storage
 */
export async function getAttachmentStats() {
  const files = await prisma.attachmentFile.findMany({
    include: {
      _count: {
        select: {
          notificationAttachments: true,
        },
      },
    },
  });

  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum: number, file: any) => sum + file.size, 0),
    totalSizeMB: 0,
    orphanedFiles: files.filter((f: any) => f._count.notificationAttachments === 0)
      .length,
    byContentType: {} as Record<string, { count: number; size: number }>,
    mostUsedFiles: [] as Array<{
      id: string;
      filename: string;
      usageCount: number;
    }>,
  };

  stats.totalSizeMB = stats.totalSize / 1024 / 1024;

  // Group by content type
  for (const file of files) {
    if (!stats.byContentType[file.contentType]) {
      stats.byContentType[file.contentType] = { count: 0, size: 0 };
    }
    stats.byContentType[file.contentType].count++;
    stats.byContentType[file.contentType].size += file.size;
  }

  // Find most used files
  stats.mostUsedFiles = files
    .map((f: any) => ({
      id: f.id,
      filename: f.filename,
      usageCount: f._count.notificationAttachments,
    }))
    .sort((a: any, b: any) => b.usageCount - a.usageCount)
    .slice(0, 10);

  return stats;
}

/**
 * Example: Pre-upload common company assets
 * Call this during application initialization or as a setup task
 */
export async function setupCommonAssets() {
  const fs = await import('fs');
  const path = await import('path');

  const assetsDir = path.join(process.cwd(), 'public', 'assets');

  const commonAssets = [
    {
      file: fs.readFileSync(path.join(assetsDir, 'company-logo.png')),
      filename: 'company-logo.png',
      contentType: 'image/png',
      category: 'logo',
    },
    {
      file: fs.readFileSync(path.join(assetsDir, 'terms-and-conditions.pdf')),
      filename: 'terms-and-conditions.pdf',
      contentType: 'application/pdf',
      category: 'legal',
    },
    {
      file: fs.readFileSync(path.join(assetsDir, 'privacy-policy.pdf')),
      filename: 'privacy-policy.pdf',
      contentType: 'application/pdf',
      category: 'legal',
    },
  ];

  return await uploadCommonAssets(commonAssets);
}

/**
 * Example usage can be found in the ATTACHMENTS_GUIDE.md
 * These helper functions can be used with the notification service
 * imported from './services/notifications'
 */
