import type { Metadata } from "next"
import { BrandSection } from "./BrandSection"
import { LoginForm } from "./LoginForm"

export const metadata: Metadata = {
  title: "Sign In - MenteVior",
  description: "Secure access to your personalized mental health workflow",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen login-background flex relative overflow-hidden">
      <BrandSection />

      <div className="
        w-full lg:w-[40%] 2xl:w-[45%]
        flex items-center justify-center
        p-6 lg:p-12 2xl:p-20
        relative z-10
        bg-white/70 backdrop-blur-xl
      ">
        <LoginForm />
      </div>
    </div>
  )
}
