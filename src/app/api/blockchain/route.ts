import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

const blockchainDb = new Database('blockchain');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    let transactions = await blockchainDb.read();
    
    // Sort by timestamp (newest first) and limit
    transactions = transactions
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { binId, action, contractorId } = body;

    if (!binId || !action) {
      return NextResponse.json(
        { error: 'binId and action are required' },
        { status: 400 }
      );
    }

    const tx = {
      id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      binId,
      action,
      contractorId: contractorId || 'system',
      timestamp: new Date().toISOString(),
    };

    const created = await blockchainDb.create(tx);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
