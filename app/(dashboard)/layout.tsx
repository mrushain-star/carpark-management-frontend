import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"
import logoImage from "@/public/logo.png"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { RiLogoutBoxRLine, RiUserLine } from "@remixicon/react"
import { ModeToggle } from "@/components/ModeToggle"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-primary-foreground shadow-sm overflow-hidden border border-primary/20">
              <Image src={logoImage} alt="Logo" fill className="object-cover" placeholder="blur" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold tracking-tight">CarPark</p>
              <p className="text-[11px] text-muted-foreground">Management</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <ModeToggle />
            
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex h-6 w-6 items-center justify-center bg-muted">
                <RiUserLine className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm text-foreground">{profile?.name || user.email}</span>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>
      </nav>
      <main>{children}</main>
    </div>
  )
}
