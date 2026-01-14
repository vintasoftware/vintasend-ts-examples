# VintaSend Next.js Example Project

This is a comprehensive [Next.js](https://nextjs.org) example project demonstrating the full capabilities of VintaSend, a powerful notification service for transactional emails, SMS, push notifications, and more.

## Features

This example showcases:

- 📧 **Email Notifications** with Nodemailer
- 🎨 **Template Rendering** with Pug
- 🗄️ **Database Backend** with Prisma and PostgreSQL
- 🔄 **Queue Management** with Temporal
- 🚀 **One-Off Notifications** for prospects and guests (no user account required)
- 🔐 **Authentication** with email verification
- 📊 **Notification Tracking** and status management
- 📎 **File Attachments** with S3 (LocalStack for development)

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL
- SMTP server credentials (for sending emails)
- **VintaSend v0.1.22+** (for one-off notification support)

**Note for Development:** If working in the vintasend-ts monorepo, build the local packages first:
```bash
# From the root of vintasend-ts
npm run build
```

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/vintasend"
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-user"
   SMTP_PASSWORD="your-smtp-password"
   CONTACT_EMAIL="hello@example.com"
   APP_DOMAIN="http://localhost:3000"
   JWT_SECRET="your-secret-key"
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Visit the app:**
   Open [http://localhost:3000](http://localhost:3000)

## Features & Demos

### One-Off Notifications 🚀

Send emails to prospects without requiring user accounts!

**Demo:** [http://localhost:3000/demo/one-off-notifications](http://localhost:3000/demo/one-off-notifications)

**Documentation:** [ONE_OFF_NOTIFICATIONS_README.md](./ONE_OFF_NOTIFICATIONS_README.md)

**Use Cases:**
- Welcome emails for prospects
- Marketing campaign emails  
- Event invitations
- Newsletter subscriptions
- Contact form responses

**Quick Example:**
```typescript
const notification = await vintaSend.createOneOffNotification({
  emailOrPhone: 'prospect@example.com',
  firstName: 'John',
  lastName: 'Doe',
  notificationType: 'EMAIL',
  title: 'Welcome!',
  bodyTemplate: '/templates/welcome.pug',
  subjectTemplate: '/templates/welcome-subject.pug',
  contextName: 'welcomeProspect',
  contextParameters: { companyName: 'Acme Corp' },
  sendAfter: null,
  extraParams: null,
});
```

### User Authentication

- Email/password authentication
- Email verification workflow
- Password reset functionality
- JWT-based sessions

### Regular Notifications

Send notifications to registered users:
- Email verification emails
- Password reset emails
- Welcome emails for new users
- Custom transactional emails

## Project Structure

```
src/
├── app/                          # Next.js app router pages
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   └── notifications/      # Notification endpoints
│   │       └── one-off/        # One-off notification API
│   ├── auth/                   # Auth pages (login, signup)
│   └── demo/                   # Demo pages
│       └── one-off-notifications/  # One-off demo page
├── components/                  # React components
│   ├── OneOffNotificationForm.tsx
│   └── ui/                     # Shadcn UI components
├── email-templates/            # Pug email templates
│   ├── auth/                  # Auth-related templates
│   └── marketing/             # Marketing templates (one-off)
├── lib/                       # Utilities and services
│   ├── context-generators/   # Notification context generators
│   ├── services/             # Business logic
│   │   └── notifications.ts  # VintaSend configuration
│   └── utils.ts
└── workers/                   # Temporal workers
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint code with Biome
- `npm run format` - Format code with Biome
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run notifications-worker` - Start Temporal worker
- `npm run pending-notifications-client` - Start cron job for pending notifications

## Running with Docker

This example includes a complete Docker Compose setup with:
- Next.js app
- PostgreSQL database
- Temporal workflow engine
- Mailpit (email testing)
- **LocalStack (S3 emulation for attachments)**

### Quick Start with Docker

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Setup LocalStack S3 bucket:**
   ```bash
   ./scripts/setup-localstack.sh
   ```

3. **Access the services:**
   - App: http://localhost:3000
   - Mailpit UI: http://localhost:8025
   - Temporal UI: http://localhost:8088
   - LocalStack S3: http://localhost:4566

4. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

### LocalStack S3 Benefits

- ✅ No AWS account needed for development
- ✅ Test attachment features locally
- ✅ Fast and free
- ✅ S3-compatible API

See [ATTACHMENTS_GUIDE.md](./ATTACHMENTS_GUIDE.md) for detailed attachment documentation.

## Database Schema

The project uses a **unified single-table approach** for both regular and one-off notifications:

```prisma
model Notification {
  id                Int                @id @default(autoincrement())
  // For regular notifications (optional)
  userId            Int?
  user              User?              @relation(fields: [userId], references: [id])
  // For one-off notifications (used when userId is null)
  emailOrPhone      String?
  firstName         String?
  lastName          String?
  // Common fields
  notificationType  NotificationType
  status            NotificationStatus
  // ... more fields
}
```

This approach provides:
- ✅ Better performance (single query)
- ✅ Simpler maintenance
- ✅ Type safety
- ✅ Easy to extend

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Notifications:** VintaSend
- **Email Adapter:** Nodemailer  
- **Templates:** Pug
- **Queue:** Temporal (optional)
- **UI:** Tailwind CSS + Shadcn UI
- **Auth:** JWT + bcrypt
- **Validation:** Zod

## Learn More

### VintaSend Documentation

- [VintaSend GitHub](https://github.com/vintasoftware/vintasend-ts)
- [One-Off Notifications Guide](./ONE_OFF_NOTIFICATIONS_README.md)
- [Implementation Plan](../../ONE_OFF_NOTIFICATIONS_IMPLEMENTATION_PLAN.md)

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

### Other Technologies

- [Prisma Documentation](https://www.prisma.io/docs)
- [Temporal Documentation](https://docs.temporal.io/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Pug Template Engine](https://pugjs.org/)

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Configure environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration
- `JWT_SECRET` - Secret for JWT tokens
- `APP_DOMAIN` - Your production domain
- `CONTACT_EMAIL` - Support email address

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For questions or issues:
- Check the [One-Off Notifications documentation](./ONE_OFF_NOTIFICATIONS_README.md)
- Open an issue on [GitHub](https://github.com/vintasoftware/vintasend-ts/issues)
- Review the [implementation plan](../../ONE_OFF_NOTIFICATIONS_IMPLEMENTATION_PLAN.md)

## License

MIT
