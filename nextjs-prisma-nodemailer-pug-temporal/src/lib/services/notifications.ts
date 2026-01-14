import { PrismaClient } from '@prisma/client';
import type { Notification, User } from '@prisma/client';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { VintaSendFactory } from 'vintasend';
import { NodemailerNotificationAdapterFactory } from 'vintasend-nodemailer';
import { PrismaNotificationBackendFactory } from 'vintasend-prisma';
import { PugEmailTemplateRendererFactory } from 'vintasend-pug';
import { WinstonLogger } from 'vintasend-winston';
import { createAttachmentManager } from '../notification-attachments';
import { ForgotPasswordContextGenerator } from '../../app/api/auth/forgot-password/forgot-password-notification-context';
import { EmailVerificationNotificationContextGenerator } from '../../app/api/auth/signup/email-verification-notification-context';
import { FirstDayotificationContextGenerator } from '../../app/api/auth/signup/first-day-notification-context';
import { WelcomeProspectContextGenerator } from '../context-generators/welcome-prospect-context';
import { loggerOptions } from '../logger';

export const contextGeneratorsMap = {
  forgotPassword: new ForgotPasswordContextGenerator(),
  emailVerification: new EmailVerificationNotificationContextGenerator(),
  firstDay: new FirstDayotificationContextGenerator(),
  welcomeProspect: new WelcomeProspectContextGenerator(),
} as const;

export type NotificationTypeConfig = {
  ContextMap: typeof contextGeneratorsMap;
  NotificationIdType: Notification['id'];
  UserIdType: User['id'];
};

// Create a singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function getNotificationService() {
  // Create the attachment manager (optional, can be undefined if S3 not configured)
  const attachmentManager = process.env.S3_BUCKET_NAME
    ? createAttachmentManager()
    : undefined;

  const notificationBackend = new PrismaNotificationBackendFactory<NotificationTypeConfig>().create(
    prisma,
    attachmentManager,
  );
  const pugEmailTemplateRenderer =
    new PugEmailTemplateRendererFactory<NotificationTypeConfig>().create({});
  const nodemailerNotificationAdapter =
    new NodemailerNotificationAdapterFactory<NotificationTypeConfig>().create(
      pugEmailTemplateRenderer,
      true,
      {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for port 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      } as SMTPTransport.Options,
    );
  return new VintaSendFactory<NotificationTypeConfig>().create(
    [nodemailerNotificationAdapter],
    notificationBackend,
    new WinstonLogger(loggerOptions),
    contextGeneratorsMap,
    undefined,
    attachmentManager,
  );
}
