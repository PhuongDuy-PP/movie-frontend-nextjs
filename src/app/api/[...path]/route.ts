import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:3001';

// For Next.js App Router - increase body size limit
export const runtime = 'nodejs';
export const maxDuration = 60;

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const pathString = resolvedParams.path?.join('/') || '';
    const queryString = new URL(request.url).search;
    const backendUrl = `${BACKEND_URL}/${pathString}${queryString}`;

    const contentType = request.headers.get('content-type') || '';
    const isMultipartForm = contentType.includes('multipart/form-data');

    const headers: HeadersInit = {};

    // Don't set Content-Type for multipart/form-data, let browser set it with boundary
    if (!isMultipartForm) {
      headers['Content-Type'] = 'application/json';
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method: request.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (isMultipartForm) {
        // Forward FormData as-is
        const formData = await request.formData();
        options.body = formData;
      } else {
        try {
          options.body = JSON.stringify(await request.json());
        } catch {
          // No body or invalid JSON
        }
      }
    }

    const response = await fetch(backendUrl, options);
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
