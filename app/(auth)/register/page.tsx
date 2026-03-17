"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { signUp } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  RiParkingBoxLine,
  RiUserLine,
  RiMailLine,
  RiLockPasswordLine,
  RiLoader4Line,
  RiAlertLine,
} from "@remixicon/react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
          Creating account…
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(signUp, null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setFieldError(null)
    const data = new FormData(e.currentTarget)
    const password = data.get("password") as string
    const confirm = data.get("confirm_password") as string
    if (password.length < 6) {
      e.preventDefault()
      setFieldError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      e.preventDefault()
      setFieldError("Passwords do not match")
      return
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand */}
      {/* Brand - Mobile Only */}
      <div className="flex flex-col items-center gap-3 text-center lg:hidden">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <RiParkingBoxLine className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CarPark Management</h1>
          <p className="text-sm text-foreground/60">Smart Parking Management</p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">Register to book your parking slot</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            {state?.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <RiAlertLine className="mt-0.5 h-4 w-4 shrink-0" />
                {state.error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-9 text-foreground placeholder:text-muted-foreground"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">Email address</Label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9 text-foreground placeholder:text-muted-foreground"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-9 text-foreground"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Repeat your password"
                  className="pl-9 text-foreground"
                  required
                  autoComplete="new-password"
                />
              </div>
              {fieldError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <RiAlertLine className="h-3.5 w-3.5" />
                  {fieldError}
                </p>
              )}
            </div>
            <SubmitButton />
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
