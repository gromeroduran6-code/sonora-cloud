import { head, put, del } from '@vercel/blob'
export type Track = { id:string; title:string; color:string; url:string; pathname:string }
const manifestPath = 'sonora/manifest.json'
export async function readTracks(): Promise<Track[]> {
  try { const blob = await head(manifestPath); const data = await fetch(blob.url, { cache: 'no-store' }); return await data.json() as Track[] } catch { return [] }
}
export async function writeTracks(tracks: Track[]) { await put(manifestPath, JSON.stringify(tracks), { access:'public', addRandomSuffix:false, allowOverwrite:true, contentType:'application/json', cacheControlMaxAge:0 }) }
export async function deleteTrackFile(url: string) { await del(url) }
