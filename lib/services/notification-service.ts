/**
 * Notification Service
 * Handles creating and managing in-app notifications
 */

import { db } from '@/lib/db';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    console.log('[NotificationService] Created notification:', notification.id);
    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error);
    throw error;
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    console.log('[NotificationService] Marked notification as read:', notificationId);
    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to mark notification as read:', error);
    throw error;
  }
}

export async function markNotificationsRead(notificationIds: string[]) {
  try {
    const result = await db.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { readAt: new Date() },
    });

    console.log('[NotificationService] Marked notifications as read:', result.count);
    return result;
  } catch (error) {
    console.error('[NotificationService] Failed to mark notifications as read:', error);
    throw error;
  }
}

export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
  }
) {
  try {
    const { limit = 50, offset = 0, type, unreadOnly } = options || {};

    const where: any = { userId };
    if (type) {
      where.type = type;
    }
    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.notification.count({ where });

    return { notifications, total };
  } catch (error) {
    console.error('[NotificationService] Failed to get user notifications:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return count;
  } catch (error) {
    console.error('[NotificationService] Failed to get unread count:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await db.notification.delete({
      where: { id: notificationId },
    });

    console.log('[NotificationService] Deleted notification:', notificationId);
  } catch (error) {
    console.error('[NotificationService] Failed to delete notification:', error);
    throw error;
  }
}
