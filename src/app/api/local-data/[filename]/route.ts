import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  // Ensure params is resolved before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { filename } = resolvedParams;
  
  // Only allow access to three specific files
  const allowedFiles = ['users.json', 'sleep-entries.json', 'test-results.json'];
  
  if (!allowedFiles.includes(filename)) {
    return new NextResponse(JSON.stringify({ error: 'File not allowed' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error reading local data file ${filename}:`, error);
    
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 