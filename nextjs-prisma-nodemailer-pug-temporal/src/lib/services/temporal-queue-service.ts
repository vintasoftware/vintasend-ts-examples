import type { Client } from '@temporalio/client';
import type { BaseNotificationQueueService } from "vintasend/dist/services/notification-queue-service/base-notification-queue-service";
import type { getNotificationService } from './notifications';
import { sendNotificationWorkflow } from "../../workers/notifications/workflows";

type NotificationIdType = Parameters<ReturnType<typeof getNotificationService>['getNotification']>[0];

export class TemporalQueueService implements BaseNotificationQueueService<NotificationIdType> {
  constructor(private client: Client, private taskQueue: string, ) {}

  async enqueueNotification(notificationId: NotificationIdType): Promise<void> {
    await this.client.workflow.start(sendNotificationWorkflow, {
      taskQueue: this.taskQueue,
      workflowId: `sendNotification-${notificationId}`,
      args: [notificationId],
    })
    await this.client.connection.close();
  }
}
