import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Fetch the booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, parking_slots(slot_name)")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slotName = (booking as any).parking_slots?.slot_name || "Unknown"

    // Create Stripe Checkout Session with dynamic price_data (no pre-created product needed)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "lkr",
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `Parking - Slot ${slotName}`,
              description: `Vehicle: ${booking.vehicle_number} | Duration: ${booking.duration_hours} hours`,
            },
            // Stripe expects amount in smallest currency unit.
            // LKR is a zero-decimal-like currency but Stripe treats it as having cents,
            // so we multiply by 100.
            unit_amount: Math.round(booking.estimated_cost * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
      },
      success_url: `${req.nextUrl.origin}/dashboard/booking/confirmation?id=${bookingId}`,
      cancel_url: `${req.nextUrl.origin}/dashboard/booking/cancelled?id=${bookingId}`,
    })

    // Store the session ID on the booking
    await supabase
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", bookingId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout session error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
