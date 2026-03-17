import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  RiCheckboxCircleLine,
  RiCarLine,
  RiParkingBoxLine,
  RiTimeLine,
  RiArrowLeftLine,
  RiCoinLine,
} from "@remixicon/react"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  const parts: string[] = []
  if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`)
  if (m > 0) parts.push(`${m} minute${m !== 1 ? "s" : ""}`)
  return parts.join(" ") || "< 1 minute"
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) redirect("/dashboard")

  const supabase = await createClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, parking_slots(slot_name)")
    .eq("id", id)
    .single()

  if (!booking) redirect("/dashboard")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotName = (booking as any).parking_slots?.slot_name || "—"
  const ref = booking.id.slice(0, 8).toUpperCase()

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center bg-green-500/10">
          <RiCheckboxCircleLine className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Booking Confirmed!</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your parking slot has been reserved
        </p>
      </div>

      {/* Ticket */}
      <div className="overflow-hidden border border-border shadow-lg">
        {/* Ticket header strip */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center justify-between text-primary-foreground">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-70">
                CarPark Management
              </p>
              <p className="text-lg font-bold">Parking Ticket</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] opacity-70">Ref No.</p>
              <p className="font-mono text-base font-bold">#{ref}</p>
            </div>
          </div>
        </div>

        {/* Ticket body */}
        <div className="bg-card px-6 py-5">
          {/* Vehicle + Slot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Vehicle
              </p>
              <div className="flex items-center gap-1.5">
                <RiCarLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="font-bold">{booking.vehicle_number}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Slot
              </p>
              <div className="flex items-center gap-1.5">
                <RiParkingBoxLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="font-bold">Slot {slotName}</p>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="relative my-5">
            <div className="absolute -left-10 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
            <div className="absolute -right-10 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
            <div className="border-t-2 border-dashed border-border" />
          </div>

          {/* Times */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-green-500/10">
                <RiTimeLine className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Entry
                </p>
                <p className="text-sm font-medium">{formatDate(booking.entry_time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-destructive/10">
                <RiTimeLine className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Exit
                </p>
                <p className="text-sm font-medium">{formatDate(booking.exit_time)}</p>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="relative my-5">
            <div className="absolute -left-10 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
            <div className="absolute -right-10 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background" />
            <div className="border-t-2 border-dashed border-border" />
          </div>

          {/* Duration + Cost */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Duration
              </p>
              <p className="font-semibold">{formatDuration(booking.duration_hours)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <RiCoinLine className="h-3 w-3" />
                Estimated Cost
              </div>
              <p className="text-3xl font-black text-primary">
                Rs.{" "}
                {booking.estimated_cost.toLocaleString("en-LK", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket footer */}
        <div className="border-t border-dashed border-border bg-muted/30 px-6 py-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Estimated cost at Rs. 200/hour · Final charges may vary
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
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
