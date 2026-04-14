"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { createBooking } from "@/app/actions/bookings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  RiCarLine,
  RiParkingBoxLine,
  RiTimeLine,
  RiAddCircleLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCoinLine,
  RiLoader4Line,
  RiBankCardLine,
} from "@remixicon/react"

type Vehicle = {
  id: string
  vehicle_number: string
}

type SlotStatus = {
  id: number
  slot_name: string
  available: boolean
}

const ALL_SLOTS = [
  { id: 1, slot_name: "A1" },
  { id: 2, slot_name: "A2" },
  { id: 3, slot_name: "A3" },
]

function roundToNext15(date: Date): Date {
  const ms = 1000 * 60 * 15
  return new Date(Math.ceil(date.getTime() / ms) * ms)
}

function toTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getDatetimeFromTimeStr(timeStr: string, isExit: boolean, entryDate?: Date): Date {
  const now = new Date()
  if (!timeStr) return now
  const [hours, minutes] = timeStr.split(":").map(Number)
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  
  if (isExit && entryDate && d <= entryDate) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

function formatDuration(entry: string, exit: string): string {
  if (!entry || !exit) return ""
  const ms = new Date(exit).getTime() - new Date(entry).getTime()
  if (ms <= 0) return ""
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`)
  if (minutes > 0) parts.push(`${minutes} min`)
  return parts.join(" ")
}

function calcCost(entry: string, exit: string): number {
  if (!entry || !exit) return 0
  const ms = new Date(exit).getTime() - new Date(entry).getTime()
  if (ms <= 0) return 0
  return Math.round((ms / (1000 * 60 * 60)) * 200 * 100) / 100
}

export default function BookingForm({
  vehicles,
}: {
  vehicles: Vehicle[]
  userId: string
}) {
  const now = roundToNext15(new Date())
  const defaultEntry = toTimeLocal(now)
  const defaultExit = toTimeLocal(new Date(now.getTime() + 60 * 60 * 1000))

  // Vehicle state
  const [vehicleMode, setVehicleMode] = useState<"existing" | "new">(
    vehicles.length === 0 ? "new" : "existing"
  )
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    vehicles.length === 1 ? vehicles[0].id : ""
  )
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState(
    vehicles.length === 1 ? vehicles[0].vehicle_number : ""
  )
  const [newVehicleNumber, setNewVehicleNumber] = useState("")

  // Time state
  const [entryTime, setEntryTime] = useState(defaultEntry)
  const [exitTime, setExitTime] = useState(defaultExit)
  const [timeError, setTimeError] = useState<string | null>(null)

  // Slot state
  const [slots, setSlots] = useState<SlotStatus[]>(
    ALL_SLOTS.map((s) => ({ ...s, available: true }))
  )
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [checkingSlots, setCheckingSlots] = useState(false)

  // Form
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check slot availability whenever times change
  useEffect(() => {
    if (!entryTime || !exitTime) return
    const entry = getDatetimeFromTimeStr(entryTime, false)
    const exit = getDatetimeFromTimeStr(exitTime, true, entry)
    if (exit <= entry) return

    let isMounted = true

    async function checkAvailability() {
      setCheckingSlots(true)
      setSelectedSlotId(null)

      const supabase = createClient()
      const { data } = await supabase.rpc("get_available_slots", {
        p_entry_time: entry.toISOString(),
        p_exit_time: exit.toISOString(),
      })

      if (isMounted) {
        const availableIds = new Set((data || []).map((s: { id: number }) => s.id))
        setSlots(ALL_SLOTS.map((s) => ({ ...s, available: availableIds.has(s.id) })))
        setCheckingSlots(false)
      }
    }

    checkAvailability()

    return () => {
      isMounted = false
    }
  }, [entryTime, exitTime])

  function handleEntryChange(value: string) {
    setEntryTime(value)
    setTimeError(null)
  }

  function handleExitChange(value: string) {
    setExitTime(value)
    setTimeError(null)
    const entry = getDatetimeFromTimeStr(entryTime, false)
    const exit = getDatetimeFromTimeStr(value, true, entry)
    const ms = exit.getTime() - entry.getTime()
    if (ms <= 0) setTimeError("Exit time must be after entry time")
    else if (ms < 30 * 60 * 1000) setTimeError("Minimum duration is 30 minutes")
    else if (ms > 24 * 60 * 60 * 1000) setTimeError("Maximum duration is 24 hours")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const vehicleNumber =
      vehicleMode === "new" ? newVehicleNumber.trim() : selectedVehicleNumber
    if (!vehicleNumber) {
      setError("Please select or enter a vehicle number")
      return
    }
    if (!selectedSlotId) {
      setError("Please select a parking slot")
      return
    }
    if (timeError) return

    setIsSubmitting(true)

    try {
      // Step 1: Create booking with pending_payment status
      const formData = new FormData()
      formData.set("vehicle_number", vehicleNumber.toUpperCase())
      formData.set("vehicle_id", vehicleMode === "existing" ? selectedVehicleId : "")
      formData.set("slot_id", String(selectedSlotId))

      const actualEntry = getDatetimeFromTimeStr(entryTime, false)
      const actualExit = getDatetimeFromTimeStr(exitTime, true, actualEntry)
      formData.set("entry_time", actualEntry.toISOString())
      formData.set("exit_time", actualExit.toISOString())

      const result = await createBooking(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      if (!result.bookingId) {
        setError("Failed to create booking")
        setIsSubmitting(false)
        return
      }

      // Step 2: Create Stripe Checkout Session and redirect
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: result.bookingId }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok || !checkoutData.url) {
        setError(checkoutData.error || "Failed to initiate payment")
        setIsSubmitting(false)
        return
      }

      // Step 3: Redirect to Stripe Checkout
      window.location.href = checkoutData.url
    } catch {
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  const actualEntry = entryTime ? getDatetimeFromTimeStr(entryTime, false) : undefined
  const actualExit = (entryTime && exitTime) ? getDatetimeFromTimeStr(exitTime, true, actualEntry) : undefined
  
  const duration = actualEntry && actualExit ? formatDuration(actualEntry.toISOString(), actualExit.toISOString()) : ""
  const cost = actualEntry && actualExit ? calcCost(actualEntry.toISOString(), actualExit.toISOString()) : 0

  const activeVehicleNumber =
    vehicleMode === "new" ? newVehicleNumber : selectedVehicleNumber

  const vehicleNumber =
    vehicleMode === "new" ? newVehicleNumber.trim() : selectedVehicleNumber
  const isDisabled = isSubmitting || !!timeError || !selectedSlotId || !vehicleNumber || checkingSlots

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left: Form sections */}
        <div className="space-y-5">
          {/* ── Vehicle ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <RiCarLine className="h-4 w-4 text-primary" />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="new-vehicle">Vehicle Number</Label>
                  <Input
                    id="new-vehicle"
                    placeholder="e.g. ABC-1234"
                    value={newVehicleNumber}
                    onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                    className="uppercase"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your vehicle registration number
                  </p>
                </div>
              )}

              {vehicles.length === 1 && (
                <div className="space-y-3">
                  {vehicleMode === "existing" ? (
                    <div className="flex items-center justify-between border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center bg-primary/10">
                          <RiCarLine className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold">{vehicles[0].vehicle_number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleMode("new")
                          setSelectedVehicleId("")
                          setSelectedVehicleNumber("")
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Use different
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="new-vehicle-1">New Vehicle Number</Label>
                      <Input
                        id="new-vehicle-1"
                        placeholder="e.g. ABC-1234"
                        value={newVehicleNumber}
                        onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleMode("existing")
                          setSelectedVehicleId(vehicles[0].id)
                          setSelectedVehicleNumber(vehicles[0].vehicle_number)
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        ← Use {vehicles[0].vehicle_number}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {vehicles.length >= 2 && (
                <div className="space-y-3">
                  {vehicleMode === "existing" ? (
                    <div className="space-y-1.5">
                      <Label>Select Vehicle</Label>
                      <Select
                        value={selectedVehicleId || ""}
                        onValueChange={(val) => {
                          if (val === "__new__") {
                            setVehicleMode("new")
                            setSelectedVehicleId("")
                            setSelectedVehicleNumber("")
                          } else {
                            const v = vehicles.find((v) => v.id === val)
                            setSelectedVehicleId(val)
                            setSelectedVehicleNumber(v?.vehicle_number || "")
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a vehicle…" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.vehicle_number}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__">
                            <span className="flex items-center gap-1.5">
                              <RiAddCircleLine className="h-3.5 w-3.5" />
                              Add new vehicle
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="new-vehicle-multi">New Vehicle Number</Label>
                      <Input
                        id="new-vehicle-multi"
                        placeholder="e.g. ABC-1234"
                        value={newVehicleNumber}
                        onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => setVehicleMode("existing")}
                        className="text-xs text-primary hover:underline"
                      >
                        ← Back to my vehicles
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Time ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <RiTimeLine className="h-4 w-4 text-primary" />
                Booking Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="entry-time">Entry Time</Label>
                  <Input
                    id="entry-time"
                    type="time"
                    value={entryTime}
                    onChange={(e) => handleEntryChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exit-time">Exit Time</Label>
                  <Input
                    id="exit-time"
                    type="time"
                    value={exitTime}
                    onChange={(e) => handleExitChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              {timeError ? (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <RiAlertLine className="h-4 w-4 shrink-0" />
                  {timeError}
                </div>
              ) : duration ? (
                <div className="flex items-center justify-between border border-primary/25 bg-primary/5 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <RiCheckboxCircleLine className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{duration}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Max 24 hours</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── Slots ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <RiParkingBoxLine className="h-4 w-4 text-primary" />
                Parking Slot
                {checkingSlots && (
                  <RiLoader4Line className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Select
                  value={selectedSlotId ? String(selectedSlotId) : ""}
                  onValueChange={(val) => setSelectedSlotId(Number(val))}
                  disabled={checkingSlots}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an available slot…" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((slot) => (
                      <SelectItem 
                        key={slot.id} 
                        value={String(slot.id)}
                        disabled={!slot.available}
                      >
                        {slot.slot_name} {!slot.available && "(Booked)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!checkingSlots && entryTime && exitTime && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Availability shown for your selected time range
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">
                    {activeVehicleNumber || <span className="text-muted-foreground/50">—</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Slot</span>
                  <span className="font-medium">
                    {selectedSlotId
                      ? slots.find((s) => s.id === selectedSlotId)?.slot_name
                      : <span className="text-muted-foreground/50">—</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {duration || <span className="text-muted-foreground/50">—</span>}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <RiCoinLine className="h-4 w-4" />
                  Est. Cost
                </div>
                <span className="text-2xl font-bold text-primary">
                  {cost > 0 ? `Rs. ${cost.toLocaleString("en-LK", { maximumFractionDigits: 0 })}` : "—"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rate: Rs. 200/hour · Estimated only
              </p>

              {error && (
                <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/8 px-3 py-2 text-xs text-destructive">
                  <RiAlertLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isDisabled}>
                {isSubmitting ? (
                  <>
                    <RiLoader4Line className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <RiBankCardLine className="h-4 w-4" />
                    Confirm & Pay
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                You will be redirected to Stripe for secure payment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
