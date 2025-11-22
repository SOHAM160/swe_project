import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { Citizen } from '../route';

const citizensDb = new Database('citizens');

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const citizen = await citizensDb.findById<Citizen>(id);
    
    if (!citizen) {
      return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
    }
    
    return NextResponse.json(citizen);
  } catch (error) {
    console.error('Error fetching citizen:', error);
    return NextResponse.json({ error: 'Failed to fetch citizen' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    
    const citizen = await citizensDb.findById<Citizen>(id);
    if (!citizen) {
      return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
    }

    const updated = await citizensDb.update<Citizen>(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating citizen:', error);
    return NextResponse.json({ error: 'Failed to update citizen' }, { status: 500 });
  }
}

