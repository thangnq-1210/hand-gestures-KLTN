import type React from "react"
import type { Metadata } from "next"
// import { GeistSans } from "geist/font/sans"
// import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import MainLayout from "@/components/main-layout"

import { AuthProvider } from "@/lib/auth-context";

import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
})

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
      <body className={`${inter.className} antialiased`}>
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
