import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : req.socket.remoteAddress;

    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    if (data.error) {
      throw new Error('Failed to get location data');
    }

    return NextResponse.json({
      country_code: data.country_code,
      country_name: data.country_name,
      city: data.city,
      region: data.region,
      ip: ip
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}