# One-Off Notifications Example

This example demonstrates how to use VintaSend's one-off notification feature to send emails to prospects, guests, or external contacts without requiring them to have an account in your system.

## What are One-Off Notifications?

One-off notifications allow you to send transactional emails directly to an email address without creating a user account. This is useful for:

- **Welcome emails** for prospects who haven't signed up yet
- **Marketing campaigns** targeting external contacts
- **Event invitations** to guests
- **Newsletter subscriptions** for non-users
- **Contact form responses** to inquiries

## Key Features

- ✉️ Send directly to email addresses (no user account required)
- 👤 Include recipient's first name and last name
- 🎨 Use the same template system as regular notifications
- 🔄 Support for context generation and dynamic content
- 📊 Track notification status (pending, sent, failed)
- ⏰ Schedule for later delivery with `sendAfter`
- 🗄️ Stored in the same database table as regular notifications

## Architecture

### Database Schema

The implementation uses a **unified single-table approach**:

```prisma
model Notification {
  id                Int                @id @default(autoincrement())
  // For regular notifications (optional now)
  userId            Int?
  user              User?              @relation(fields: [userId], references: [id])
  // For one-off notifications (used when userId is null)
  emailOrPhone      String?
  firstName         String?
  lastName          String?
  // Common fields
  notificationType  NotificationType
  title             String?
  bodyTemplate      String
  contextName       String
  contextParameters Json               @default("{}")
  sendAfter         DateTime?
  subjectTemplate   String?
  status            NotificationStatus @default(PENDING_SEND)
  contextUsed       Json?
  adapterUsed       String?
  sentAt            DateTime?
  readAt            DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([status, sendAfter])
  @@index([userId])
  @@index([emailOrPhone])
}
```

**Key Points:**
- `userId` is now nullable - when null, it's a one-off notification
- `emailOrPhone`, `firstName`, `lastName` are populated for one-off notifications
- Single table means better performance and simpler queries
- Indexes on both `userId` and `emailOrPhone` for efficient lookups

### Tech Stack

- **Backend:** Prisma with PostgreSQL
- **Adapter:** Nodemailer for email delivery
- **Templates:** Pug template engine
- **Queue:** Temporal for reliable delivery (optional)
- **Framework:** Next.js 15 with App Router

## Demo Application

### Prerequisites

- **VintaSend v0.1.22 or later** (includes one-off notification support)
- Node.js 18+
- PostgreSQL
- SMTP server credentials

**For Development:**
If you're working in the vintasend-ts monorepo, you need to link the local packages:

```bash
# In the root of vintasend-ts
npm run build

# In the example project directory
cd src/examples/nextjs-prisma-nodemailer-pug-temporal
npm install
```

The example uses workspace references to the local vintasend packages. If you see TypeScript errors about `createOneOffNotification`, ensure the local packages are built.

### Running the Demo

1. **Set up the database:**
   ```bash
   npm run db:push
   ```

2. **Configure environment variables:**
   ```bash
   # .env
   DATABASE_URL="postgresql://user:password@localhost:5432/vintasend"
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-user"
   SMTP_PASSWORD="your-smtp-password"
   CONTACT_EMAIL="hello@example.com"
   APP_DOMAIN="http://localhost:3000"
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Visit the demo:**
   Navigate to [http://localhost:3000/demo/one-off-notifications](http://localhost:3000/demo/one-off-notifications)

### Demo Features

The demo includes:
- 📝 **Interactive form** to send one-off notifications
- 📧 **Welcome email template** for prospects
- 🎯 **Context generation** with company and product info
- ✅ **Success/error feedback** with notification ID
- 📖 **Documentation** explaining the feature

## Usage Examples

### Basic Example

```typescript
import { getNotificationService } from '@/lib/services/notifications';

const notificationService = getNotificationService();

const notification = await notificationService.createOneOffNotification({
  emailOrPhone: 'prospect@example.com',
  firstName: 'John',
  lastName: 'Doe',
  notificationType: 'EMAIL',
  title: 'Welcome!',
  bodyTemplate: '/templates/welcome.pug',
  subjectTemplate: '/templates/welcome-subject.pug',
  contextName: 'welcomeProspect',
  contextParameters: {
    companyName: 'Acme Corp',
    productName: 'Amazing Product',
  },
  sendAfter: null, // Send immediately
  extraParams: null,
});

console.log(`Notification ${notification.id} sent!`);
```

### Scheduled One-Off Notification

```typescript
// Send 24 hours from now
const tomorrow = new Date();
tomorrow.setHours(tomorrow.getHours() + 24);

const notification = await notificationService.createOneOffNotification({
  emailOrPhone: 'prospect@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  notificationType: 'EMAIL',
  title: 'Follow-up',
  bodyTemplate: '/templates/follow-up.pug',
  subjectTemplate: '/templates/follow-up-subject.pug',
  contextName: 'followUp',
  contextParameters: { meetingDate: '2025-12-15' },
  sendAfter: tomorrow, // Schedule for later
  extraParams: null,
});
```

### API Endpoint Example

```typescript
// app/api/notifications/one-off/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNotificationService } from '@/lib/services/notifications';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const notificationService = getNotificationService();
  
  const notification = await notificationService.createOneOffNotification({
    emailOrPhone: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    notificationType: 'EMAIL',
    title: 'Welcome',
    bodyTemplate: '/templates/welcome.pug',
    subjectTemplate: '/templates/welcome-subject.pug',
    contextName: 'welcomeProspect',
    contextParameters: {
      companyName: body.companyName,
    },
    sendAfter: null,
    extraParams: null,
  });

  return NextResponse.json({
    success: true,
    notificationId: notification.id,
  });
}
```

## Context Generators

Context generators provide dynamic data to your templates:

```typescript
// lib/context-generators/welcome-prospect-context.ts
import type { ContextGenerator } from 'vintasend/dist/services/notification-context-registry';

export class WelcomeProspectContextGenerator implements ContextGenerator {
  async generate(params: { 
    companyName: string;
    productName?: string;
  }) {
    return {
      companyName: params.companyName,
      productName: params.productName || 'Our Product',
      contactEmail: process.env.CONTACT_EMAIL || 'hello@example.com',
      currentYear: new Date().getFullYear(),
    };
  }
}

// Register in notifications.ts
export const contextGeneratorsMap = {
  welcomeProspect: new WelcomeProspectContextGenerator(),
  // ... other generators
} as const;
```

## Email Templates

Create Pug templates for your emails:

```pug
// email-templates/marketing/welcome-prospect-body.html.pug
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    title Welcome to #{companyName}
  body
    .container
      h1 Welcome to #{companyName}!
      p Hello #{firstName},
      p Thank you for your interest in #{productName}.
      p We're excited to have you here!
      p
        | Questions? Email us at 
        a(href=`mailto:${contactEmail}`) #{contactEmail}
      .footer
        p © #{currentYear} #{companyName}
```

```pug
// email-templates/marketing/welcome-prospect-subject.txt.pug
Welcome to #{companyName} - Get Started with #{productName}
```

## Migration from Previous Versions

If you're upgrading from a version without one-off notifications:

1. **Update your Prisma schema:**
   - Make `userId` nullable
   - Add `emailOrPhone`, `firstName`, `lastName` fields
   - Add index on `emailOrPhone`

2. **Run migration:**
   ```bash
   npm run prisma migrate dev --name add-one-off-notifications
   ```

3. **No code changes needed** - existing notifications continue to work!

## Benefits of Single-Table Approach

Unlike a two-table approach (separate tables for regular and one-off notifications), this implementation uses a single table with nullable fields:

✅ **Simpler queries** - No need to query multiple tables  
✅ **Better performance** - Single index scan instead of two  
✅ **Easier maintenance** - One schema, one set of migrations  
✅ **Type safety** - Unified serialization with smart type detection  
✅ **Flexible** - Easy to add new notification types in the future  

## Testing

Test your one-off notifications:

```typescript
// Example test
describe('One-Off Notifications', () => {
  it('should send welcome email to prospect', async () => {
    const service = getNotificationService();
    
    const notification = await service.createOneOffNotification({
      emailOrPhone: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      notificationType: 'EMAIL',
      title: 'Welcome',
      bodyTemplate: '/templates/welcome.pug',
      subjectTemplate: '/templates/welcome-subject.pug',
      contextName: 'welcomeProspect',
      contextParameters: { companyName: 'Test Co' },
      sendAfter: null,
      extraParams: null,
    });

    expect(notification.id).toBeDefined();
    expect(notification.status).toBe('SENT');
  });
});
```

## Troubleshooting

### Email not sending

1. Check SMTP configuration in `.env`
2. Verify template paths are correct
3. Check logs for errors: `docker-compose logs -f app`

### Validation errors

- Ensure email format is valid
- `firstName` and `lastName` are required
- `contextName` must match a registered context generator

### Database errors

- Run `npm run db:push` to apply schema changes
- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct

## Learn More

- [VintaSend Documentation](https://github.com/vintasoftware/vintasend-ts)
- [Implementation Plan](../../../ONE_OFF_NOTIFICATIONS_IMPLEMENTATION_PLAN.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Pug Template Engine](https://pugjs.org/)

## Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/vintasoftware/vintasend-ts/issues)
- Check existing documentation
- Review the implementation plan

## License

MIT
