import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '../../../lib/auth'
import { deleteTrackFile, readTracks, Track, writeTracks } from '../../../lib/tracks'
const denied = () => NextResponse.json({ error:'No autorizado.' }, { status:401 })
export async function GET() { return NextResponse.json(await readTracks(), { headers:{ 'Cache-Control':'no-store' } }) }
export async function POST(request: NextRequest) {
  if (!await isAdmin()) return denied(); const item = await request.json() as Track
  if (!item.id || !item.url || !item.pathname || !item.title) return NextResponse.json({ error:'Datos inválidos.' }, { status:400 })
  const tracks = await readTracks(); tracks.push(item); await writeTracks(tracks); return NextResponse.json(item)
}
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) return denied(); const incoming = await request.json() as Track[]
  if (!Array.isArray(incoming)) return NextResponse.json({ error:'Datos inválidos.' }, { status:400 })
  const tracks = incoming.map(({id,title,color,url,pathname}) => ({id,title,color,url,pathname})); await writeTracks(tracks); return NextResponse.json(tracks)
}
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) return denied(); const { id } = await request.json(); const tracks = await readTracks(); const found = tracks.find(t => t.id === id)
  if (found) await deleteTrackFile(found.url); const next = tracks.filter(t => t.id !== id); await writeTracks(next); return NextResponse.json(next)
}
