import type React from "react"
import type {Metadata} from "next"
import "./globals.css"
import {AuthProvider} from "@/lib/hooks/use-auth"
import {AlertProvider} from "@/lib/contexts/alert-context"
import {Toaster} from "sonner"
import {InterceptorsInitializer} from "@/components/interceptors-initializer";
import { InterceptorProvider } from "@/lib/contexts/interceptor-context"
import { GlobalAlertDialog } from "@/components/global-alert-dialog"

export const metadata: Metadata = {
    title: "MenteVior Back Office",
    description: "Enterprise back office platform for mental health clinics",
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
        <InterceptorProvider>
            <AuthProvider>
                <AlertProvider>
                    <InterceptorsInitializer></InterceptorsInitializer>
                    <GlobalAlertDialog />
                    {children}
                </AlertProvider>
            </AuthProvider>
        </InterceptorProvider>
        <Toaster position="top-right" richColors closeButton/>

        </body>
        </html>
    )
}
