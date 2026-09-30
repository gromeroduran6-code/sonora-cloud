import { handleUpload } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '../../../lib/auth'
export async function POST(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:'No autorizado.' }, { status:401 })
  const body = await request.json()
  try {
    const response = await handleUpload({ body, request, onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes:['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/ogg','audio/mp4','audio/x-m4a','audio/aac','audio/flac','audio/x-flac','audio/webm','audio/3gpp','audio/octet-stream'], maximumPayloadSizeInBytes: 1024 * 1024 * 500,
      addRandomSuffix:true, tokenPayload: JSON.stringify({ pathname })
    }), onUploadCompleted: async () => {} })
    return NextResponse.json(response)
  } catch (error) {
  console.error('Blob handleUpload error:', error)

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : 'Error desconocido',
    },
    { status: 500 }
  )
}
}
