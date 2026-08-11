import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, passwordMatches, sessionValue } from '../../../lib/auth'
export async function GET() { return NextResponse.json({ authenticated: await isAdmin() }) }
export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (!passwordMatches(String(password))) return NextResponse.json({ error:'Contraseña incorrecta.' }, { status:401 })
  const response = NextResponse.json({ authenticated:true })
  response.cookies.set('sonora_admin', sessionValue(), { httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV === 'production', path:'/', maxAge:60 * 60 * 24 * 30 })
  return response
}
export async function DELETE() { const response = NextResponse.json({ authenticated:false }); response.cookies.set('sonora_admin', '', { path:'/', maxAge:0 }); return response }
