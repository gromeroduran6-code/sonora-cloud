import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export const sessionValue = () => hash(process.env.SONORA_AUTH_SECRET || 'missing-secret')
export const passwordMatches = (password: string) => {
  const expected = Buffer.from(hash(process.env.SONORA_ADMIN_PASSWORD || ''))
  const received = Buffer.from(hash(password))
  return expected.length === received.length && timingSafeEqual(expected, received)
}
export async function isAdmin() { return (await cookies()).get('sonora_admin')?.value === sessionValue() }
