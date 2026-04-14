import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import BookingForm from "@/components/booking/BookingForm"
import {
  RiAddCircleLine,
  RiHistoryLine,
  RiCarLine,
  RiParkingBoxLine,
  RiTimeLine,
  RiCoinLine,
  RiBankCardLine,
} from "@remixicon/react"

type BookingWithSlot = {
  id: string
  vehicle_number: string
  entry_time: string
  exit_time: string
  duration_hours: number
  estimated_cost: number
  status: "pending_payment" | "upcoming" | "active" | "completed" | "cancelled"
  payment_status: string
  parking_slots: { slot_name: string } | null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
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
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  return parts.join(" ") || "<1m"
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  upcoming: "bg-primary/10 text-primary",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: vehicles }, { data: bookings }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("*, parking_slots(slot_name)")
      .eq("user_id", user.id)
      .order("entry_time", { ascending: false }),
  ])

  const upcomingCount = (bookings || []).filter(
    (b) => b.status === "upcoming" || b.status === "active"
  ).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Book and manage your parking slots</p>
      </div>

      <Tabs defaultValue="new-booking">
        <TabsList className="mb-6">
          <TabsTrigger value="new-booking" className="gap-2">
            <RiAddCircleLine className="h-4 w-4" />
            New Booking
          </TabsTrigger>
          <TabsTrigger value="my-bookings" className="gap-2">
            <RiHistoryLine className="h-4 w-4" />
            My Bookings
            {upcomingCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {upcomingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-booking">
          <BookingForm vehicles={vehicles || []} userId={user.id} />
        </TabsContent>

        <TabsContent value="my-bookings">
          {!bookings || bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center bg-muted">
                <RiHistoryLine className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No bookings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your parking history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(bookings as BookingWithSlot[]).map((booking) => (
                <Card key={booking.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-muted">
                          <RiCarLine className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="font-semibold">{booking.vehicle_number}</p>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <RiParkingBoxLine className="h-3.5 w-3.5" />
                              Slot {booking.parking_slots?.slot_name}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RiTimeLine className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {formatDateTime(booking.entry_time)} →{" "}
                              {formatDateTime(booking.exit_time)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">
                              {formatDuration(booking.duration_hours)}
                            </span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="flex items-center gap-1 font-medium">
                              <RiCoinLine className="h-3 w-3" />
                              Rs.{" "}
                              {booking.estimated_cost.toLocaleString("en-LK", {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            {booking.payment_status === "paid" && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <RiBankCardLine className="h-3 w-3" />
                                  Paid
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={[
                            "shrink-0 px-2 py-0.5 text-xs font-medium",
                            STATUS_STYLES[booking.status] || STATUS_STYLES.completed,
                          ].join(" ")}
                        >
                          {booking.status === "pending_payment"
                            ? "Awaiting Payment"
                            : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {booking.status === "pending_payment" && (
                          <a
                            href={`/api/checkout/retry?id=${booking.id}`}
                            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            <RiBankCardLine className="h-3 w-3" />
                            Pay Now
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
