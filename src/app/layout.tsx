import type { Metadata } from 'next'
import { Rajdhani, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import Script from 'next/script'
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
        {children}
        {/* Яндекс.Метрика — заменить 109730760 на ID счётчика */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(109730760, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
          `}
        </Script>
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/109730760" style={{ position: 'absolute', left: '-9999px' }} alt="" /></div>
        </noscript>
      </body>
    </html>
  )
}
