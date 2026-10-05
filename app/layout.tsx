import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Metadata } from "next"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontLogo = Fraunces({
  subsets: ["latin"],
  variable: "--font-logo",
})

export const metadata: Metadata = {
  title: {
    default: "Sandbox : crée des jeux 3D avec l'IA",
    template: "%s | Sandbox",
  },
  description:
    "Décris un jeu et regarde-le prendre vie. Sandbox est un atelier de création de jeux 3D par IA : il pose les bonnes questions, écrit le code et fait naître des mondes jouables à partir de tes mots.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontLogo.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
