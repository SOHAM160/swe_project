import { NextResponse } from 'next/server';
import { simulateIoTData, startIoTSimulation, stopIoTSimulation } from '@/lib/iot-simulator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, interval } = body;

    if (action === 'start') {
      startIoTSimulation(interval || 30000);
      return NextResponse.json({ 
        success: true, 
        message: `IoT simulation started (updates every ${(interval || 30000) / 1000} seconds)` 
      });
    } else if (action === 'stop') {
      stopIoTSimulation();
      return NextResponse.json({ 
        success: true, 
        message: 'IoT simulation stopped' 
      });
    } else if (action === 'run-once') {
      await simulateIoTData();
      return NextResponse.json({ 
        success: true, 
        message: 'IoT simulation run completed' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start", "stop", or "run-once"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in IoT simulation API:', error);
    return NextResponse.json(
      { error: 'Failed to control IoT simulation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Run simulation once
    await simulateIoTData();
    return NextResponse.json({ 
      success: true, 
      message: 'IoT simulation run completed' 
    });
  } catch (error) {
    console.error('Error running IoT simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run IoT simulation' },
      { status: 500 }
    );
  }
}

