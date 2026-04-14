import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

// Use the service-level Supabase client for webhook (no user auth context)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    const bookingId = session.metadata?.booking_id

    if (bookingId) {
      const supabase = getSupabaseAdmin()

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "upcoming",
          payment_status: "paid",
          stripe_session_id: session.id,
        })
        .eq("id", bookingId)

      if (error) {
        console.error("Failed to update booking:", error)
        return NextResponse.json({ error: "Database update failed" }, { status: 500 })
      }

      console.log(`Payment confirmed for booking ${bookingId}`)
    }
  }

  return NextResponse.json({ received: true })
}
