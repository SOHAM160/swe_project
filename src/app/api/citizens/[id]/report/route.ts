import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { Bin } from '@/lib/bins';

const citizensDb = new Database('citizens');
const activitiesDb = new Database('activities');
const reportsDb = new Database('reports');
const binsDb = new Database('bins');

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { binId, issueType, description } = body;

    if (!binId || !issueType) {
      return NextResponse.json(
        { error: 'binId and issueType are required' },
        { status: 400 }
      );
    }

    const citizen = await citizensDb.findById<any>(id);
    if (!citizen) {
      return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
    }

    // Check if bin exists and still has the issue
    const bin = await binsDb.findById<Bin>(binId);
    if (!bin) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }

    // Only allow reporting if bin is in Hazard or Full status
    if (bin.status !== 'Hazard' && bin.status !== 'Full') {
      return NextResponse.json(
        { error: `Cannot report issue: Bin ${binId} is currently ${bin.status}. Only Hazard or Full bins can be reported.` },
        { status: 400 }
      );
    }

    // Check for duplicate reports - prevent reporting same bin by same citizen
    // Check if citizen has already reported this bin (regardless of status or time)
    const existingReports = await reportsDb.read();
    const citizenReportForBin = existingReports.find((r: any) => 
      r.citizenId === id && 
      r.binId === binId
    );

    if (citizenReportForBin) {
      // Check if the report was resolved
      if (citizenReportForBin.status === 'resolved') {
        // Only allow new report if bin still has the issue AND it's been at least 1 hour since resolution
        const resolvedTime = new Date(citizenReportForBin.resolvedAt || citizenReportForBin.createdAt).getTime();
        const hoursSinceResolution = (Date.now() - resolvedTime) / (60 * 60 * 1000);
        
        if (hoursSinceResolution < 1) {
          const minutesLeft = Math.ceil(60 - (hoursSinceResolution * 60));
          return NextResponse.json(
            { 
              error: `You have already reported this bin. Please wait ${minutesLeft} minute(s) before reporting again.`,
              existingReport: citizenReportForBin
            },
            { status: 400 }
          );
        }
        // If resolved more than 1 hour ago and bin still has issue, allow new report
      } else {
        // Report is still pending or investigating - don't allow duplicate
        const reportAge = Math.floor((Date.now() - new Date(citizenReportForBin.createdAt).getTime()) / (60 * 1000));
        return NextResponse.json(
          { 
            error: `You have already reported this bin ${reportAge} minute(s) ago. Please wait until the issue is resolved.`,
            existingReport: citizenReportForBin
          },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending report for this bin (by any citizen)
    // Only the FIRST reporter gets points
    const pendingReportForBin = existingReports.find((r: any) => 
      r.binId === binId && 
      (r.status === 'pending' || r.status === 'investigating')
    );

    if (pendingReportForBin && pendingReportForBin.citizenId !== id) {
      // Someone else already reported this bin - no points for duplicate reports
      const report = {
        id: `report-${Date.now()}`,
        citizenId: id,
        binId,
        issueType,
        description: description || '',
        status: 'pending',
        pointsAwarded: 0, // No points if already reported by someone else
        createdAt: new Date().toISOString(),
      };

      await reportsDb.create(report);

      // Log activity (no points awarded)
      await activitiesDb.create({
        id: `activity-${Date.now()}`,
        type: 'info',
        message: `Citizen ${citizen.name} also reported issue with ${binId} (already reported by another citizen).`,
        user: citizen.name,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        pointsAwarded: 0,
        newPointsTotal: citizen.points || 0,
        report,
        message: 'Issue already reported by another citizen. Your report has been logged but no points awarded.',
      });
    }

    // Create report and award points (first report for this bin)
    const report = {
      id: `report-${Date.now()}`,
      citizenId: id,
      binId,
      issueType,
      description: description || '',
      status: 'pending',
      pointsAwarded: 50,
      createdAt: new Date().toISOString(),
    };

    await reportsDb.create(report);

    // Award points
    const updatedPoints = (citizen.points || 0) + 50;
    const updatedReports = (citizen.reportsSubmitted || 0) + 1;
    await citizensDb.update(id, {
      points: updatedPoints,
      reportsSubmitted: updatedReports,
    });

    // Log activity
    await activitiesDb.create({
      id: `activity-${Date.now()}`,
      type: 'success',
      message: `Citizen ${citizen.name} reported issue with ${binId}. Awarded 50 points.`,
      user: citizen.name,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      pointsAwarded: 50,
      newPointsTotal: updatedPoints,
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

