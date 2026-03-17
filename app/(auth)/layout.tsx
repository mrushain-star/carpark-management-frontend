import type { ReactNode } from "react"
import Image from "next/image"
import bgImage from "@/public/background.png"
import logoImage from "@/public/logo.png"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left side: Image/Brand area */}
      <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-10 text-white lg:flex relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt="Premium Parking Area"
            fill
            className="object-cover opacity-80"
            placeholder="blur"
            priority
          />
          {/* Elegant overlay gradient to match standard theme vibes */}
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/90 via-zinc-950/40 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
        </div>

        {/* Content over image */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 group cursor-pointer w-fit">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-transparent shadow-lg transition-transform group-hover:scale-105 border border-primary/20">
              <Image src={logoImage} alt="Logo" fill className="object-cover" placeholder="blur" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">
              CarPark Management
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight text-white drop-shadow-md">
            Seamless Parking, Premium Experience.
          </h2>
          <p className="text-lg text-white/80 drop-shadow">
            Book your parking slots in advance and ensure a stress-free arrival at your destination. Designed for efficiency and luxury.
          </p>
        </div>
      </div>

      {/* Right side: Form area */}
      <div className="relative flex w-full flex-col items-center justify-center p-8 lg:w-1/2 bg-gradient-to-br from-background via-primary/5 to-muted/20">
        {/* Decorative Grid Pattern for Form side */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
             style={{
               backgroundImage: `radial-gradient(circle at center, var(--primary) 1px, transparent 1px)`,
               backgroundSize: "24px 24px"
             }}
        />
        
        {/* Mobile Header (Hidden on LG) */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between lg:hidden z-10">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-transparent border border-primary/20">
              <Image src={logoImage} alt="Logo" fill className="object-cover" placeholder="blur" />
            </div>
            <span className="text-lg font-bold tracking-tight">CarPark</span>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
