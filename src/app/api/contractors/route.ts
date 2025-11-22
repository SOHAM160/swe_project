import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

const contractorsDb = new Database('contractors');

export interface Contractor {
  id: string;
  name: string;
  email: string;
  todaysEarnings: number;
  completedPickups: number;
  weeklyStats: {
    pickupsCompleted: number;
    totalEarnings: number;
    efficiencyRating: number;
    onTimeRate: number;
  };
  createdAt: string;
}

export async function GET() {
  try {
    const contractors = await contractorsDb.read<Contractor>();
    return NextResponse.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const contractor: Contractor = {
      id: `contractor-${Date.now()}`,
      name,
      email,
      todaysEarnings: 0,
      completedPickups: 0,
      weeklyStats: {
        pickupsCompleted: 0,
        totalEarnings: 0,
        efficiencyRating: 5.0,
        onTimeRate: 100,
      },
      createdAt: new Date().toISOString(),
    };

    const created = await contractorsDb.create(contractor);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating contractor:', error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}

