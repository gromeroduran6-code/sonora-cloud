import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '../../../lib/auth'
import { deleteTrackFile, Group, Library, readLibrary, Track, writeLibrary } from '../../../lib/tracks'
const denied = () => NextResponse.json({ error:'No autorizado.' }, { status:401 })
export async function GET() { return NextResponse.json(await readLibrary(), { headers:{ 'Cache-Control':'no-store' } }) }
export async function POST(request: NextRequest) {
  if (!await isAdmin()) return denied(); const item = await request.json() as Track
  if (!item.id || !item.url || !item.pathname || !item.title) return NextResponse.json({ error:'Datos inválidos.' }, { status:400 })
  const library = await readLibrary(); const { id, title, color, url, pathname, groupId } = item
  const clean: Track = { id, title, color, url, pathname, ...(groupId && library.groups.some(g => g.id === groupId) ? { groupId } : {}) }
  library.tracks.push(clean); await writeLibrary(library); return NextResponse.json(clean)
}
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) return denied(); const incoming = await request.json() as Partial<Library>
  if (!Array.isArray(incoming.tracks) || !Array.isArray(incoming.groups)) return NextResponse.json({ error:'Datos inválidos.' }, { status:400 })
  const groups: Group[] = incoming.groups.map(({id,title,color}) => ({id,title,color})); const ids = new Set(groups.map(g => g.id))
  const tracks: Track[] = incoming.tracks.map(({id,title,color,url,pathname,groupId}) => ({id,title,color,url,pathname, ...(groupId && ids.has(groupId) ? { groupId } : {})}))
  const library = { tracks, groups }; await writeLibrary(library); return NextResponse.json(library)
}
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) return denied(); const { id } = await request.json(); const library = await readLibrary(); const found = library.tracks.find(t => t.id === id)
  if (found) await deleteTrackFile(found.url); const next = { ...library, tracks: library.tracks.filter(t => t.id !== id) }; await writeLibrary(next); return NextResponse.json(next)
}
