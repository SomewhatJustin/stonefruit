import type { Metadata } from "next"
import localFont from "next/font/local"
import { Geist_Mono } from "next/font/google"
import "./globals.css"
import { TrpcProvider } from "@/lib/trpcClient"
import { Toaster } from "sonner"

const atkinson = localFont({
  src: [
    {
      path: "../public/fonts/AtkinsonHyperlegibleNext-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/AtkinsonHyperlegibleNext-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/AtkinsonHyperlegibleNext-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/AtkinsonHyperlegibleNext-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-atkinson",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Stonefruit",
  description: "Work chat.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${atkinson.variable} ${geistMono.variable} antialiased`}
      >
        <TrpcProvider>
          {children}
          <Toaster richColors />
        </TrpcProvider>
      </body>
    </html>
  )
}
