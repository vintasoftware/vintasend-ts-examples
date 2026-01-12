/**
 * One-Off Notification Example
 *
 * This example demonstrates how to send one-off notifications to recipients
 * who don't have user accounts in your system (e.g., prospects, guests, external contacts).
 */

import type { VintaSendFactory } from '../services/notification-service';
import type { JsonObject } from '../types/json-values';
import type { ContextGenerator } from '../types/notification-context-generators';
import type { BaseNotificationTypeConfig } from '../types/notification-type-config';

// Example context generator for a welcome email to prospects
class ProspectWelcomeContextGenerator implements ContextGenerator<{ companyName: string }> {
  async generate(params: { companyName: string }): Promise<JsonObject> {
    return {
      companyName: params.companyName,
      year: new Date().getFullYear(),
    };
  }
}

// Example context generator for event invitation
class EventInvitationContextGenerator
  implements ContextGenerator<{ eventName: string; eventDate: string; eventLocation: string }>
{
  async generate(params: {
    eventName: string;
    eventDate: string;
    eventLocation: string;
  }): Promise<JsonObject> {
    const eventDate = new Date(params.eventDate);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      eventName: params.eventName,
      eventDate: eventDate.toLocaleDateString(),
      eventLocation: params.eventLocation,
      daysUntilEvent,
    };
  }
}

// Context generators map
export const contextGeneratorsMap = {
  prospectWelcome: new ProspectWelcomeContextGenerator(),
  eventInvitation: new EventInvitationContextGenerator(),
} as const;

// Type configuration
export type NotificationTypeConfig = {
  ContextMap: typeof contextGeneratorsMap;
  NotificationIdType: number;
  UserIdType: number;
};

/**
 * Example 1: Send immediate welcome email to a prospect
 */
export async function sendWelcomeEmailToProspect(
  vintaSend: ReturnType<VintaSendFactory<NotificationTypeConfig>['create']>,
  prospectEmail: string,
  firstName: string,
  lastName: string,
  companyName: string,
) {
  const notification = await vintaSend.createOneOffNotification({
    emailOrPhone: prospectEmail,
    firstName,
    lastName,
    notificationType: 'EMAIL',
    title: 'Welcome to our platform!',
    bodyTemplate: './templates/prospect-welcome-body.html',
    subjectTemplate: 'Welcome to {{companyName}}!',
    contextName: 'prospectWelcome',
    contextParameters: { companyName },
    sendAfter: null, // Send immediately
    extraParams: null,
  });

  console.log(`One-off notification created with ID: ${notification.id}`);
  return notification;
}

/**
 * Example 2: Schedule an event invitation for future delivery
 */
export async function scheduleEventInvitation(
  vintaSend: ReturnType<VintaSendFactory<NotificationTypeConfig>['create']>,
  guestEmail: string,
  firstName: string,
  lastName: string,
  eventDetails: {
    name: string;
    date: Date;
    location: string;
  },
  sendDate: Date,
) {
  const notification = await vintaSend.createOneOffNotification({
    emailOrPhone: guestEmail,
    firstName,
    lastName,
    notificationType: 'EMAIL',
    title: `You're invited: ${eventDetails.name}`,
    bodyTemplate: './templates/event-invitation-body.html',
    subjectTemplate: 'Invitation: {{eventName}}',
    contextName: 'eventInvitation',
    contextParameters: {
      eventName: eventDetails.name,
      eventDate: eventDetails.date.toISOString(),
      eventLocation: eventDetails.location,
    },
    sendAfter: sendDate, // Schedule for later
    extraParams: { eventId: 123 }, // Optional metadata
  });

  console.log(`Event invitation scheduled for ${sendDate.toISOString()}`);
  return notification;
}

/**
 * Example 3: Update a scheduled one-off notification
 */
export async function updateScheduledNotification(
  vintaSend: ReturnType<VintaSendFactory<NotificationTypeConfig>['create']>,
  notificationId: number,
  newSendDate: Date,
) {
  const updatedNotification = await vintaSend.updateOneOffNotification(notificationId, {
    sendAfter: newSendDate,
  });

  console.log(`Notification ${notificationId} rescheduled to ${newSendDate.toISOString()}`);
  return updatedNotification;
}

/**
 * Example 4: Send one-off notifications to multiple recipients
 */
export async function sendBulkOneOffNotifications(
  vintaSend: ReturnType<VintaSendFactory<NotificationTypeConfig>['create']>,
  recipients: Array<{
    email: string;
    firstName: string;
    lastName: string;
  }>,
  companyName: string,
) {
  const notifications = await Promise.all(
    recipients.map((recipient) =>
      vintaSend.createOneOffNotification({
        emailOrPhone: recipient.email,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        notificationType: 'EMAIL',
        title: 'Welcome!',
        bodyTemplate: './templates/prospect-welcome-body.html',
        subjectTemplate: 'Welcome to {{companyName}}!',
        contextName: 'prospectWelcome',
        contextParameters: { companyName },
        sendAfter: null,
        extraParams: null,
      }),
    ),
  );

  console.log(`Sent ${notifications.length} one-off notifications`);
  return notifications;
}

/**
 * Example 5: Using with phone numbers (SMS - requires SMS adapter)
 */
export async function sendSMSToProspect(
  vintaSend: ReturnType<VintaSendFactory<NotificationTypeConfig>['create']>,
  phoneNumber: string,
  firstName: string,
  lastName: string,
  companyName: string,
) {
  const notification = await vintaSend.createOneOffNotification({
    emailOrPhone: phoneNumber, // E.164 format recommended: +15551234567
    firstName,
    lastName,
    notificationType: 'SMS',
    title: 'Welcome SMS',
    bodyTemplate: './templates/welcome-sms.txt',
    subjectTemplate: null, // SMS doesn't use subjects
    contextName: 'prospectWelcome',
    contextParameters: { companyName },
    sendAfter: null,
    extraParams: null,
  });

  console.log(`SMS notification created with ID: ${notification.id}`);
  return notification;
}

/**
 * Usage example - putting it all together
 */
export async function demonstrateOneOffNotifications() {
  // Initialize VintaSend (backend, adapter, logger setup omitted for brevity)
  // const vintaSend = getNotificationService();
  // Example: Send welcome email to prospect
  // await sendWelcomeEmailToProspect(
  //   vintaSend,
  //   'prospect@example.com',
  //   'John',
  //   'Doe',
  //   'Acme Corp'
  // );
  // Example: Schedule event invitation
  // const sendDate = new Date();
  // sendDate.setDate(sendDate.getDate() + 7); // Send in 7 days
  // await scheduleEventInvitation(
  //   vintaSend,
  //   'guest@example.com',
  //   'Jane',
  //   'Smith',
  //   {
  //     name: 'Annual Conference 2025',
  //     date: new Date('2025-06-15'),
  //     location: 'San Francisco, CA',
  //   },
  //   sendDate
  // );
  // Example: Send to multiple recipients
  // await sendBulkOneOffNotifications(
  //   vintaSend,
  //   [
  //     { email: 'user1@example.com', firstName: 'Alice', lastName: 'Johnson' },
  //     { email: 'user2@example.com', firstName: 'Bob', lastName: 'Williams' },
  //   ],
  //   'Acme Corp'
  // );
}
