/**
 * Notifications API
 * Handles getting and managing user notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/jwt-service';
import { 
  getUserNotifications, 
  markNotificationRead, 
  markNotificationsRead,
  getUnreadNotificationCount 
} from '@/lib/services/notification-service';

/**
 * GET - Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // 3. Get notifications
    const { notifications, total } = await getUserNotifications(user.userId, {
      limit,
      offset,
      type,
      unreadOnly,
    });

    // 4. Get unread count
    const unreadCount = await getUnreadNotificationCount(user.userId);

    return NextResponse.json({
      success: true,
      notifications,
      total,
      unreadCount,
    });

  } catch (error: any) {
    console.error('[NotificationsAPI] Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch notifications' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      const { notifications } = await getUserNotifications(user.userId, { limit: 1000 });
      const allIds = notifications.map((n: any) => n.id);
      
      if (allIds.length > 0) {
        await markNotificationsRead(allIds);
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid notificationIds array' },
        { status: 400 }
      );
    }

    // 3. Mark specific notifications as read
    await markNotificationsRead(notificationIds);

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });

  } catch (error: any) {
    console.error('[NotificationsAPI] Error marking notifications as read:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to mark notifications as read' 
      },
      { status: 500 }
    );
  }
}

