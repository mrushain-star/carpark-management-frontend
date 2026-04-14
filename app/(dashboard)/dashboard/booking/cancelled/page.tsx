import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  RiCloseCircleLine,
  RiArrowLeftLine,
  RiRefreshLine,
} from "@remixicon/react"

export default async function CancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) redirect("/dashboard")

  const supabase = await createClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, vehicle_number, estimated_cost")
    .eq("id", id)
    .single()

  if (!booking) redirect("/dashboard")

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center bg-destructive/10">
          <RiCloseCircleLine className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Cancelled</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your payment was not completed. Your booking is on hold.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Vehicle: <span className="font-semibold text-foreground">{booking.vehicle_number}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Amount: <span className="font-semibold text-foreground">
            Rs. {booking.estimated_cost.toLocaleString("en-LK", { maximumFractionDigits: 0 })}
          </span>
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          You can retry payment or go back to create a new booking.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="gap-2">
          <Link href={`/api/checkout/retry?id=${booking.id}`}>
            <RiRefreshLine className="h-4 w-4" />
            Retry Payment
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard">
            <RiArrowLeftLine className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
