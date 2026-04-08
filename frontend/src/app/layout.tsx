import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans as PlusJakartaSans } from 'next/font/google'
import '../globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakartaSans = PlusJakartaSans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mercado Franquias',
    template: '%s | Mercado Franquias',
  },
  description:
    'O maior portal de ranking de franquias do Brasil. Compare, avalie e encontre a franquia ideal.',
  metadataBase:
    typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-br"
      className={`${inter.variable} ${plusJakartaSans.variable}`}
    >
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
