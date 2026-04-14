"use server"

import { createClient } from "@/lib/supabase/server"

const RATE_PER_HOUR = 200

export async function createBooking(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const vehicleNumber = formData.get("vehicle_number") as string
  const vehicleId = formData.get("vehicle_id") as string | null
  const slotId = parseInt(formData.get("slot_id") as string)
  const entryTime = formData.get("entry_time") as string
  const exitTime = formData.get("exit_time") as string

  if (!vehicleNumber || !slotId || !entryTime || !exitTime) {
    return { error: "All fields are required" }
  }

  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  const durationMs = exit.getTime() - entry.getTime()
  const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100
  const estimatedCost = Math.round(durationHours * RATE_PER_HOUR * 100) / 100

  // Save vehicle if new
  let finalVehicleId = vehicleId || null
  if (!vehicleId && vehicleNumber) {
    const { data: existing } = await supabase
      .from("vehicles")
      .select("id")
      .eq("user_id", user.id)
      .eq("vehicle_number", vehicleNumber.toUpperCase())
      .single()

    if (existing) {
      finalVehicleId = existing.id
    } else {
      const { data: newVehicle } = await supabase
        .from("vehicles")
        .insert({ user_id: user.id, vehicle_number: vehicleNumber.toUpperCase() })
        .select("id")
        .single()
      finalVehicleId = newVehicle?.id ?? null
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      vehicle_id: finalVehicleId,
      vehicle_number: vehicleNumber.toUpperCase(),
      slot_id: slotId,
      entry_time: entryTime,
      exit_time: exitTime,
      duration_hours: durationHours,
      estimated_cost: estimatedCost,
      status: "pending_payment",
      payment_status: "unpaid",
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes("no_overlapping_bookings")) {
      return { error: "This slot is already booked for the selected time. Please choose another slot or time." }
    }
    return { error: error.message }
  }

  return { bookingId: booking.id }
}
