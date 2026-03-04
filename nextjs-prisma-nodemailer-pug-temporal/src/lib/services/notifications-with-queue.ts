import { NOTIFICATIONS_QUEUE } from '../../workers/notifications/constants';
import { logger } from '../logger';
import { getTemporalClient } from '../temporal';
import { getNotificationService } from './notifications';
import { TemporalQueueService } from './temporal-queue-service';

export async function getNotificationServiceWithQueue() {
  const notificationService = getNotificationService();

  try {
    const temporalClient = await getTemporalClient();

    notificationService.registerQueueService(
      new TemporalQueueService(temporalClient, NOTIFICATIONS_QUEUE),
    );
  } catch (error) {
    logger.warn('Temporal is unavailable. Continuing without queue service.', {
      error: String(error),
    });
    throw error;
  }

  return notificationService;
}
