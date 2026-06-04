import type { Metadata } from 'next'
import { Rajdhani, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ibm-plex-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: 'ElectroPlan — Инженерный калькулятор электрики',
  description:
    'Профессиональный расчёт автоматики, УЗО, щитков и схем расключения для жилых помещений. ПУЭ, ГОСТ, СП.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      className={`${rajdhani.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
