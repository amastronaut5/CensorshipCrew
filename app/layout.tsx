import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Keep It Alive: Flappy Bird | NodeForSpeed 1.0 Hackathon",
  description:
    "An innovative twist on Flappy Bird where your bird needs constant care to survive. Feed, pet, and nurture your bird while avoiding obstacles. Built for NodeForSpeed 1.0 'Keep It Alive' theme.",
  keywords: [
    "flappy bird",
    "keep it alive",
    "hackathon",
    "game",
    "interactive",
    "care",
    "pet",
    "survival",
    "nodeforspeed",
    "next.js",
  ],
  authors: [{ name: "NodeForSpeed 1.0 Participant" }],
  creator: "NodeForSpeed 1.0 Participant",
  publisher: "NodeForSpeed 1.0",
  robots: "index, follow",
  openGraph: {
    title: "Keep It Alive: Flappy Bird",
    description:
      "Your bird needs constant love and care to survive! An innovative game for NodeForSpeed 1.0 hackathon.",
    type: "website",
    locale: "en_US",
    siteName: "Keep It Alive: Flappy Bird",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Keep It Alive: Flappy Bird Game Screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keep It Alive: Flappy Bird",
    description: "Your bird needs constant love and care to survive! Built for NodeForSpeed 1.0 hackathon.",
    images: ["/og-image.png"],
  },
  themeColor: "#3B82F6",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  generator: "v0.dev",
  // Move viewport to metadata instead of separate export
  viewport: {
    width: "device-width",
    initialScale: 1,
    themeColor: "#3B82F6",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  )
}
