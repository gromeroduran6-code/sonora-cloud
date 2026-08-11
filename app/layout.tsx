import './styles.css'
export const metadata = { title: 'Sonora', description: 'Tus pistas, en cualquier dispositivo.' }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html> }
