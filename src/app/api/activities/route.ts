import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

const activitiesDb = new Database('activities');

export interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  user: string;
  timestamp: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');

    let activities = await activitiesDb.read<Activity>();
    
    // Filter by type if provided
    if (type) {
      activities = activities.filter(a => a.type === type);
    }

    // Sort by timestamp (newest first) and limit
    activities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, message, user } = body;

    if (!type || !message || !user) {
      return NextResponse.json(
        { error: 'type, message, and user are required' },
        { status: 400 }
      );
    }

    const activity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      user,
      timestamp: new Date().toISOString(),
    };

    const created = await activitiesDb.create(activity);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

