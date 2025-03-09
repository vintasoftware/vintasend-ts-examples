import { PrismaClient } from '@prisma/client';
import { NotificationService, NotificationContextRegistry } from 'vintasend/dist/index.js';
import { PrismaNotificationBackend } from 'vintasend-prisma/dist/index.js';
import { PugEmailTemplateRenderer } from 'vintasend-pug/dist/index.js';
import { NodemailerNotificationAdapter } from 'vintasend-nodemailer/dist/index.js';
import { WinstonLogger } from 'vintasend-winston/dist/index.js';
import { ForgotPasswordContextGenerator } from '../../app/api/auth/forgot-password/forgot-password-notification-context';
import { EmailVerificationNotificationContextGenerator } from '../../app/api/auth/signup/email-verification-notification-context';
import { loggerOptions } from '../logger';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { FirstDayotificationContextGenerator } from '../../app/api/auth/signup/first-day-notification-context';

export const contextGeneratorsMap = {
  forgotPassword: new ForgotPasswordContextGenerator(),
  emailVerification: new EmailVerificationNotificationContextGenerator(),
  firstDay: new FirstDayotificationContextGenerator(),
} as const;

export type ContextMap = typeof contextGeneratorsMap;

export function getNotificationService() {
  const prisma = new PrismaClient();
  const notificationBackend = new PrismaNotificationBackend<
    PrismaClient,
    ContextMap,
    number,
    number
  >(prisma);
  const pugEmailTemplateRenderer = new PugEmailTemplateRenderer<ContextMap>();
  const nodemailerNotificationAdapter = new NodemailerNotificationAdapter<
    PugEmailTemplateRenderer<ContextMap>,
    ContextMap,
    number,
    number
  >(pugEmailTemplateRenderer, true, {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  } as SMTPTransport.Options)
  return new NotificationService<ContextMap, number, number>(
    [nodemailerNotificationAdapter],
    notificationBackend,
    new WinstonLogger(loggerOptions),
  );
}

NotificationContextRegistry.initialize<ContextMap>(contextGeneratorsMap);
