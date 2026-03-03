import type { Client } from '@temporalio/client';
import type { BaseNotificationQueueService } from 'vintasend';
import { sendNotificationWorkflow } from '../../workers/notifications/workflows';
import type { NotificationTypeConfig } from './notifications';

export class TemporalQueueService implements BaseNotificationQueueService<NotificationTypeConfig> {
  constructor(
    private client: Client,
    private taskQueue: string,
  ) {}

  async enqueueNotification(
    notificationId: NotificationTypeConfig['NotificationIdType'],
  ): Promise<void> {
    await this.client.workflow.start(sendNotificationWorkflow, {
      taskQueue: this.taskQueue,
      workflowId: `sendNotification-${notificationId}`,
      args: [notificationId],
    });
  }
}
