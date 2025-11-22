import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { Bin } from '@/lib/bins';

const binsDb = new Database('bins');

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bin = await binsDb.findById<Bin>(id);
    
    if (!bin) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }
    
    return NextResponse.json(bin);
  } catch (error) {
    console.error('Error fetching bin:', error);
    return NextResponse.json({ error: 'Failed to fetch bin' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    
    const bin = await binsDb.findById<Bin>(id);
    if (!bin) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }

    const updatedBin = await binsDb.update<Bin>(id, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });

    // Auto-resolve reports if bin status is fixed (Empty or Normal)
    if (updates.status === 'Empty' || updates.status === 'Normal') {
      const reportsDb = new Database('reports');
      const reports = await reportsDb.read();
      const pendingReports = reports.filter((r: any) => 
        r.binId === id && 
        (r.status === 'pending' || r.status === 'investigating')
      );
      
      for (const report of pendingReports) {
        await reportsDb.update(report.id, {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        });
      }
    }

    // Log activity
    const activitiesDb = new Database('activities');
    await activitiesDb.create({
      id: `activity-${Date.now()}`,
      type: 'info',
      message: `Bin ${id} updated: ${JSON.stringify(updates)}`,
      user: 'System',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedBin);
  } catch (error) {
    console.error('Error updating bin:', error);
    return NextResponse.json({ error: 'Failed to update bin' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await binsDb.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }

    // Log activity
    const activitiesDb = new Database('activities');
    await activitiesDb.create({
      id: `activity-${Date.now()}`,
      type: 'warning',
      message: `Bin ${id} deleted from system`,
      user: 'Admin',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bin:', error);
    return NextResponse.json({ error: 'Failed to delete bin' }, { status: 500 });
  }
}

