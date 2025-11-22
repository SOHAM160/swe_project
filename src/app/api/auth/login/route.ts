import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

const citizensDb = new Database('citizens');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, email, role } = body;

    if (role === 'citizen') {
      // For citizens, we check by email or create new account
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for citizen login' },
          { status: 400 }
        );
      }

      // Check if citizen exists
      const citizens = await citizensDb.read();
      let citizen = citizens.find((c: any) => c.email === email);

      if (!citizen) {
        // Create new citizen account
        citizen = {
          id: `citizen-${Date.now()}`,
          name: username || email.split('@')[0],
          email,
          points: 0,
          reportsSubmitted: 0,
          environmentalImpact: {
            co2Saved: 0,
            wasteDisposed: 0,
            recyclingRate: 0,
          },
          createdAt: new Date().toISOString(),
        };
        await citizensDb.create(citizen);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: citizen.id,
          username: citizen.name,
          email: citizen.email,
          role: 'citizen',
          name: citizen.name,
        },
      });
    }

    // For admin and contractor, check hardcoded credentials
    if (username === 'sde' && password === '123') {
      return NextResponse.json({
        success: true,
        user: {
          id: role === 'admin' ? 'admin-1' : 'contractor-1',
          username: 'sde',
          role,
          name: role === 'admin' ? 'Admin User' : 'Contractor User',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

