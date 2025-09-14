import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'MNUDA API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

