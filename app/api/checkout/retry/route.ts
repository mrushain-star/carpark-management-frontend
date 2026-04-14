import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin))
    }

    const bookingId = req.nextUrl.searchParams.get("id")

    if (!bookingId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
    }

    const { data: booking } = await supabase
      .from("bookings")
      .select("*, parking_slots(slot_name)")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single()

    if (!booking || booking.payment_status === "paid") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slotName = (booking as any).parking_slots?.slot_name || "Unknown"

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

    await supabase
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", bookingId)

    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error("Retry checkout error:", error)
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }
}
