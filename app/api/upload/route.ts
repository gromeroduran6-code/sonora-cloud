import { handleUpload } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '../../../lib/auth'
export async function POST(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:'No autorizado.' }, { status:401 })
  const body = await request.json()
  try {
    const response = await handleUpload({ body, request, onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes:['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/x-m4a','audio/aac'], maximumPayloadSizeInBytes: 1024 * 1024 * 500,
      addRandomSuffix:true, tokenPayload: JSON.stringify({ pathname })
    }), onUploadCompleted: async () => {} })
    return NextResponse.json(response)
  } catch { return NextResponse.json({ error:'No se pudo preparar la carga.' }, { status:400 }) }
}
