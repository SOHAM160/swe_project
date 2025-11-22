import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

const reportsDb = new Database('reports');

export interface Report {
  id: string;
  citizenId: string;
  binId: string;
  issueType: string;
  description: string;
  status: 'pending' | 'resolved' | 'investigating';
  pointsAwarded: number;
  createdAt: string;
  resolvedAt?: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const citizenId = searchParams.get('citizenId');

    let reports = await reportsDb.read<Report>();
    
    if (status) {
      reports = reports.filter(r => r.status === status);
    }
    
    if (citizenId) {
      reports = reports.filter(r => r.citizenId === citizenId);
    }

    // Sort by date (newest first)
    reports = reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

