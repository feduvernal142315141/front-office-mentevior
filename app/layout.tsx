import type React from "react"
import type {Metadata} from "next"
import "./globals.css"
import {AlertProvider} from "@/lib/contexts/alert-context"
import {InterceptorsInitializer} from "@/components/interceptors-initializer"
import { InterceptorProvider } from "@/lib/contexts/interceptor-context"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthInitializer } from "@/components/auth-initializer"

export const metadata: Metadata = {
    title: "MenteVior Front Office",
    description: "Enterprise front office platform for mental health clinics",
    generator: "kodeWave.app",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="" suppressHydrationWarning>
          <body className={`font-sans antialiased`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}  
            >
              <AlertProvider>
                <InterceptorProvider>
                  <AuthInitializer />
                  <InterceptorsInitializer />
                  {children}
                </InterceptorProvider>
              </AlertProvider>
            </ThemeProvider>
          </body>
        </html>
    )
}
