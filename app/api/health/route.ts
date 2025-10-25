import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET /api/health - Check database and API health
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic stats
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      stats: {
        users: userCount,
        organizations: orgCount,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Health] Database check failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
