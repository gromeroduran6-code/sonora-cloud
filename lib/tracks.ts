import { head, put, del } from '@vercel/blob'
export type Track = { id:string; title:string; color:string; url:string; pathname:string; groupId?:string }
export type Group = { id:string; title:string; color:string }
export type Library = { tracks:Track[]; groups:Group[] }
const manifestPath = 'sonora/manifest.json'
export async function readLibrary(): Promise<Library> {
  try {
    const blob = await head(manifestPath); const data = await fetch(blob.url, { cache: 'no-store' }); const json = await data.json()
    if (Array.isArray(json)) return { tracks: json as Track[], groups: [] } // formato anterior (solo pistas)
    return { tracks: Array.isArray(json.tracks) ? json.tracks : [], groups: Array.isArray(json.groups) ? json.groups : [] }
  } catch { return { tracks: [], groups: [] } }
}
export async function writeLibrary(library: Library) { await put(manifestPath, JSON.stringify(library), { access:'public', addRandomSuffix:false, allowOverwrite:true, contentType:'application/json', cacheControlMaxAge:0 }) }
export async function deleteTrackFile(url: string) { await del(url) }
