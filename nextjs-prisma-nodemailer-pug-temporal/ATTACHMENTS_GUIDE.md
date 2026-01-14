# Notification Attachments Guide

This guide explains how to use file attachments with notifications in the Next.js example application.

## Overview

The attachment system allows you to:
- ✅ Upload files inline with notifications
- ✅ Pre-upload files for reuse across multiple notifications
- ✅ Automatically deduplicate identical files
- ✅ Store files in AWS S3 (or S3-compatible services)
- ✅ Generate secure presigned URLs for file access
- ✅ Clean up orphaned files automatically

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# Optional: For development with LocalStack
S3_ENDPOINT=http://localhost:4566

# Optional: AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 2. Database Migration

The Prisma schema already includes the attachment tables:
- `AttachmentFile` - Stores file metadata
- `NotificationAttachment` - Links files to notifications

Run the migration if you haven't already:

```bash
npx prisma migrate dev
```

### 3. S3 Bucket Setup

#### Option A: LocalStack (Development)

For local development, this example uses **LocalStack** to emulate S3 without needing AWS credentials.

**Setup Steps:**

1. Start the services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Run the LocalStack setup script:
   ```bash
   ./scripts/setup-localstack.sh
   ```

   This script will:
   - Create the S3 bucket `vintasend-attachments`
   - Enable versioning
   - Configure CORS for browser access

3. Verify the bucket was created:
   ```bash
   aws --endpoint-url=http://localhost:4566 s3 ls
   ```

**Environment Variables for LocalStack:**

```bash
# Already configured in docker-compose.yml
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localstack:4566
S3_BUCKET_NAME=vintasend-attachments
```

**Benefits:**
- ✅ No AWS account needed
- ✅ No internet access required
- ✅ Fast local development
- ✅ Free (no AWS costs)
- ✅ Can test S3 operations locally

#### Option B: AWS S3 (Production)

For production, use a real AWS S3 bucket:

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name --region us-east-1

# Set bucket encryption
aws s3api put-bucket-encryption \
  --bucket your-bucket-name \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

**IAM Policy** (attach to your EC2/ECS/Lambda role):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/attachments/*"
    }
  ]
}
```

**Environment Variables for AWS S3:**

```bash
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
# AWS_ENDPOINT_URL is not set (uses real AWS)

# Option 1: Use IAM roles (recommended for EC2/ECS/Lambda)
# No credentials needed

# Option 2: Use access keys (for local development)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Usage Examples

### Example 1: Send Notification with Inline Attachment

Upload a file as part of the notification:

```typescript
import { vintaSend } from '@/lib/services/vintasend';
import { createInlineAttachment } from '@/lib/notification-attachments';
import * as fs from 'fs';

const pdfBuffer = fs.readFileSync('./invoice.pdf');

await vintaSend.send({
  userId: 'user-123',
  notificationType: 'invoice-email',
  context: {
    invoiceNumber: 'INV-2024-001',
    amount: 99.99,
  },
  attachments: [
    createInlineAttachment(
      pdfBuffer,
      'invoice-INV-2024-001.pdf',
      'application/pdf',
      'Invoice Document'
    ),
  ],
});
```

### Example 2: Pre-upload Reusable Files

Upload files once and reuse them across many notifications:

```typescript
import { uploadReusableFile, createAttachmentReference } from '@/lib/notification-attachments';

// 1. Upload the file once
const logoFile = await uploadReusableFile(
  fs.readFileSync('./company-logo.png'),
  'company-logo.png',
  'image/png'
);

// 2. Reuse in multiple notifications
const users = ['user-1', 'user-2', 'user-3'];

for (const userId of users) {
  await vintaSend.send({
    userId,
    notificationType: 'welcome-email',
    context: { userName: 'John' },
    attachments: [
      createAttachmentReference(logoFile.id, 'Company Logo'),
    ],
  });
}
```

### Example 3: Upload Common Assets on Startup

Pre-upload common files during application initialization:

```typescript
import { setupCommonAssets } from '@/lib/notification-attachments';

// Call this in your app initialization
async function initializeApp() {
  const commonAssets = await setupCommonAssets();
  console.log(`Uploaded ${commonAssets.length} common assets`);
}
```

### Example 4: Clean Up Orphaned Files

Automatically remove files not attached to any notification:

```typescript
import { cleanupOrphanedFiles } from '@/lib/notification-attachments';

// Clean up files older than 30 days
const deletedCount = await cleanupOrphanedFiles(30);
console.log(`Deleted ${deletedCount} orphaned files`);
```

### Example 5: Get Storage Statistics

Monitor your attachment storage usage:

```typescript
import { getAttachmentStats } from '@/lib/notification-attachments';

const stats = await getAttachmentStats();

console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total size: ${stats.totalSizeMB.toFixed(2)} MB`);
console.log(`Orphaned files: ${stats.orphanedFiles}`);
console.log('By content type:', stats.byContentType);
console.log('Most used files:', stats.mostUsedFiles);
```

## API Routes Examples

### Upload Attachment API

```typescript
// app/api/attachments/upload/route.ts
import { uploadReusableFile } from '@/lib/notification-attachments';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const fileRecord = await uploadReusableFile(
      buffer,
      file.name,
      file.type
    );

    return NextResponse.json({
      success: true,
      file: fileRecord,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Send Notification with Attachment API

```typescript
// app/api/notifications/send-with-attachment/route.ts
import { vintaSend } from '@/lib/services/vintasend';
import { createAttachmentReference } from '@/lib/notification-attachments';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, attachmentFileId } = await request.json();

    await vintaSend.send({
      userId,
      notificationType: 'document-ready',
      context: {
        documentName: 'Your Document',
      },
      attachments: [
        createAttachmentReference(attachmentFileId),
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent with attachment',
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
```

## Development with LocalStack

For local development, you can use LocalStack to emulate S3:

### 1. Start LocalStack

Add to your `docker-compose.yml`:

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - "./localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

Start the service:

```bash
docker-compose up -d localstack
```

### 2. Create Local Bucket

```bash
# Create bucket in LocalStack
aws --endpoint-url=http://localhost:4566 s3 mb s3://vintasend-attachments

# Verify bucket was created
aws --endpoint-url=http://localhost:4566 s3 ls
```

### 3. Update Environment Variables

```bash
S3_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=vintasend-attachments
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Best Practices

### 1. File Size Limits

Set appropriate limits for file uploads:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

if (buffer.length > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

### 2. Content Type Validation

Validate file types before upload:

```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

if (!ALLOWED_TYPES.includes(contentType)) {
  throw new Error('Invalid file type');
}
```

### 3. Automatic Cleanup

Schedule a cron job to clean up orphaned files:

```typescript
// Add to your cron tasks
import { cleanupOrphanedFiles } from '@/lib/notification-attachments';

// Run daily at 2 AM
export async function dailyCleanup() {
  const deletedCount = await cleanupOrphanedFiles(30);
  console.log(`Cleaned up ${deletedCount} orphaned files`);
}
```

### 4. Monitor Storage Usage

Set up alerts for storage usage:

```typescript
import { getAttachmentStats } from '@/lib/notification-attachments';

export async function checkStorageUsage() {
  const stats = await getAttachmentStats();
  
  // Alert if over 80% of quota
  const quotaMB = 10000; // 10 GB
  const usagePercent = (stats.totalSizeMB / quotaMB) * 100;
  
  if (usagePercent > 80) {
    // Send alert notification
    console.warn(`Storage usage at ${usagePercent.toFixed(1)}%`);
  }
}
```

### 5. Use S3 Lifecycle Policies

Configure S3 to automatically archive or delete old files:

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldAttachments",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

## Troubleshooting

### LocalStack Issues

#### Issue: LocalStack not starting

**Solution:** Check Docker logs and ensure ports are not in use:

```bash
docker-compose logs localstack
lsof -i :4566  # Check if port is already in use
```

#### Issue: Bucket creation fails

**Solution:** Manually create the bucket:

```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://vintasend-attachments
```

#### Issue: Files not uploading to LocalStack

**Solution:** 
1. Ensure LocalStack is running:
   ```bash
   docker-compose ps
   curl http://localhost:4566/_localstack/health
   ```

2. Check the environment variables are correct:
   ```bash
   docker-compose exec app env | grep AWS
   ```

3. Verify bucket exists:
   ```bash
   aws --endpoint-url=http://localhost:4566 s3 ls
   ```

#### Issue: Cannot access files from LocalStack

**Solution:** Make sure you're using the correct endpoint URL in your S3AttachmentManager configuration.

### General Issues

### Issue: "Access Denied" errors

**Solution:** Check your IAM policy and S3 bucket permissions.

### Issue: Files not uploading to LocalStack

**Solution:** Ensure LocalStack is running and endpoint URL is correct:

```bash
docker-compose ps
curl http://localhost:4566/_localstack/health
```

### Issue: Orphaned files not being deleted

**Solution:** Check that the cleanup cron job is running and files are older than the threshold.

### Issue: Large files timing out

**Solution:** Consider implementing multipart uploads for files > 5MB (will be added in Phase 11).

## Security Considerations

1. **Presigned URLs:** Default expiration is 1 hour - adjust based on your needs
2. **Encryption:** Enable S3 server-side encryption (SSE-S3 or SSE-KMS)
3. **Access Control:** Use IAM roles instead of access keys in production
4. **File Validation:** Always validate file types and sizes before upload
5. **Virus Scanning:** Consider integrating antivirus scanning for user-uploaded files

## Performance Tips

1. **Reuse files:** Pre-upload common assets instead of uploading with each notification
2. **Deduplication:** The system automatically deduplicates files by checksum
3. **Streaming:** Use streams for large files to reduce memory usage
4. **CDN:** Consider using CloudFront for frequently accessed files
5. **Cleanup:** Regularly remove orphaned files to reduce storage costs

## Further Reading

- [Main Attachment Documentation](../../ATTACHMENTS.md) (coming in Phase 10)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [LocalStack Documentation](https://docs.localstack.cloud/user-guide/aws/s3/)
