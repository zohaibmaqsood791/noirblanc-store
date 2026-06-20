import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), '.debug-logs.jsonl');

export async function POST(req: NextRequest) {
  try {
    const { event, email, data, timestamp } = await req.json();

    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      event,
      email: email || 'unknown',
      data,
    };

    // Append to log file (JSONL format)
    await fs.appendFile(
      LOG_FILE,
      JSON.stringify(logEntry) + '\n'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Debug log error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}

// GET to view logs
export async function GET() {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    const logs = content.split('\n').filter(Boolean).map(line => JSON.parse(line));
    return NextResponse.json({ logs: logs.slice(-50) }); // Last 50 entries
  } catch (error) {
    return NextResponse.json({ logs: [] });
  }
}
