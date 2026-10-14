import './styles.css'
export const metadata = { title: 'Sonora', description: 'Tus pistas, en cualquier dispositivo.', icons: { icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icon.png', sizes: '512x512', type: 'image/png' }], apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] } }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html> }
