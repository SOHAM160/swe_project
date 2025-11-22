import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { Bin } from '@/lib/bins';

const contractorsDb = new Database('contractors');
const binsDb = new Database('bins');
const activitiesDb = new Database('activities');
const blockchainDb = new Database('blockchain');

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractorId } = await params;
    const body = await req.json();
    const { binId, action = 'Collected' } = body;

    if (!binId) {
      return NextResponse.json(
        { error: 'binId is required' },
        { status: 400 }
      );
    }

    const contractor = await contractorsDb.findById<any>(contractorId);
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const bin = await binsDb.findById<Bin>(binId);
    if (!bin) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }

    // Update bin status
    const newStatus = action === 'Collected' ? 'Empty' : 
                     action === 'Hazard_Resolved' ? 'Normal' : bin.status;
    
    await binsDb.update<Bin>(binId, {
      status: newStatus,
      fillLevel: action === 'Collected' ? 0 : bin.fillLevel,
      lastUpdated: new Date().toISOString(),
    });

    // Auto-resolve reports when bin is fixed
    if (newStatus === 'Empty' || newStatus === 'Normal') {
      const reportsDb = new Database('reports');
      const reports = await reportsDb.read();
      const pendingReports = reports.filter((r: any) => 
        r.binId === binId && 
        (r.status === 'pending' || r.status === 'investigating')
      );
      
      for (const report of pendingReports) {
        await reportsDb.update(report.id, {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        });
      }
    }

    // Update contractor earnings and stats
    const earningsPerPickup = 25.00;
    const newEarnings = (contractor.todaysEarnings || 0) + earningsPerPickup;
    const newPickups = (contractor.completedPickups || 0) + 1;
    const newWeeklyPickups = (contractor.weeklyStats?.pickupsCompleted || 0) + 1;
    const newWeeklyEarnings = (contractor.weeklyStats?.totalEarnings || 0) + earningsPerPickup;

    await contractorsDb.update(contractorId, {
      todaysEarnings: newEarnings,
      completedPickups: newPickups,
      weeklyStats: {
        ...contractor.weeklyStats,
        pickupsCompleted: newWeeklyPickups,
        totalEarnings: newWeeklyEarnings,
      },
    });

    // Log blockchain transaction
    const tx = {
      id: `TX-${Date.now()}`,
      binId,
      action,
      contractorId,
      timestamp: new Date().toISOString(),
      earnings: earningsPerPickup,
    };
    await blockchainDb.create(tx);

    // Log activity
    await activitiesDb.create({
      id: `activity-${Date.now()}`,
      type: 'success',
      message: `Contractor ${contractor.name} ${action.toLowerCase()} ${binId}. Earned $${earningsPerPickup.toFixed(2)}`,
      user: contractor.name,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      bin: await binsDb.findById<Bin>(binId),
      earnings: earningsPerPickup,
      totalEarnings: newEarnings,
      transaction: tx,
    });
  } catch (error) {
    console.error('Error processing pickup:', error);
    return NextResponse.json({ error: 'Failed to process pickup' }, { status: 500 });
  }
}

