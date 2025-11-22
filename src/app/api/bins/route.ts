import { NextResponse } from 'next/server';
import { Database, initializeDefaultData } from '@/lib/db';
import { Bin } from '@/lib/bins';

const binsDb = new Database('bins');

// Ensure initialization happens
let initPromise: Promise<void> | null = null;
let iotStarted = false;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDefaultData();
  }
  await initPromise;
  
  // Start IoT simulation after initialization (only once)
  if (!iotStarted && typeof window === 'undefined') {
    iotStarted = true;
    try {
      const { startIoTSimulation } = await import('@/lib/iot-simulator');
      startIoTSimulation(30000); // Update every 30 seconds
    } catch (error) {
      console.error('Failed to start IoT simulation:', error);
    }
  }
}

export async function GET() {
  try {
    await ensureInitialized();
    const bins = await binsDb.read<Bin>();
    return NextResponse.json(bins);
  } catch (error) {
    console.error('Error fetching bins:', error);
    return NextResponse.json({ error: 'Failed to fetch bins' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureInitialized();
    const body = await req.json();
    const { location, fillLevel = 0, gasLevel = 0, status = 'Empty' } = body;
    
    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Generate new bin ID
    const existingBins = await binsDb.read<Bin>();
    const binNumber = existingBins.length + 1;
    const binId = `BIN${binNumber.toString().padStart(3, '0')}`;

    const newBin: Bin = {
      id: binId,
      location,
      fillLevel,
      gasLevel,
      status,
      lastUpdated: new Date().toISOString(),
    };

    const created = await binsDb.create(newBin);
    
    // Log activity
    const activitiesDb = new Database('activities');
    await activitiesDb.create({
      id: `activity-${Date.now()}`,
      type: 'info',
      message: `New bin ${binId} added at ${location}`,
      user: 'Admin',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating bin:', error);
    return NextResponse.json({ error: 'Failed to create bin' }, { status: 500 });
  }
}
