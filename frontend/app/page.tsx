import Link from "next/link"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#11111b] text-[#cdd6f4]">
      <div className="text-center space-y-6 max-w-lg px-6">
        <h1 className="text-5xl font-bold text-[#cba6f7]">λ HaskellStudy</h1>
        <p className="text-lg text-[#a6adc8]">
          Изучай Haskell с AI-ассистентом. Читай лекции, решай задачи,
          получай мгновенную обратную связь.
        </p>
        <SignedOut>
          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-[#cba6f7] text-[#11111b] hover:bg-[#b4a0f5]">
              <Link href="/sign-up">Начать бесплатно</Link>
            </Button>
            <Button asChild variant="outline" className="border-[#45475a] text-[#cdd6f4]">
              <Link href="/sign-in">Войти</Link>
            </Button>
          </div>
        </SignedOut>
        <SignedIn>
          <Button asChild className="bg-[#cba6f7] text-[#11111b] hover:bg-[#b4a0f5]">
            <Link href="/dashboard">Открыть лекции</Link>
          </Button>
        </SignedIn>
      </div>
    </div>
  )
}
