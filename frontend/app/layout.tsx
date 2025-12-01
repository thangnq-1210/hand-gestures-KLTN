import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import MainLayout from "@/components/main-layout"

import { AuthProvider } from "@/lib/auth-context";

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "V - HAND",
  description: "Real-time hand gesture recognition with text-to-speech for people with disabilities",
  icons: {
    icon: [
      {
        url: "/logo_v_hand.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo_v_hand.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo_v_hand.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo_v_hand.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <MainLayout>{children}</MainLayout>
          </ThemeProvider>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
