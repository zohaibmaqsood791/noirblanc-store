import { NextRequest, NextResponse } from "next/server";

const WC_API = process.env.WC_API_URL || "https://noirblanc.store/wp-json/wc/v3";
const CK = process.env.WC_CONSUMER_KEY!;
const CS = process.env.WC_CONSUMER_SECRET!;

function wcAuth() {
  return "Basic " + Buffer.from(`${CK}:${CS}`).toString("base64");
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    completed:  "Delivered",
    processing: "Processing",
    "on-hold":  "On Hold",
    pending:    "Pending Payment",
    refunded:   "Refunded",
    cancelled:  "Cancelled",
    shipped:    "Shipped",
  };
  return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, email } = await req.json();

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Order number and email are required." }, { status: 400 });
    }

    const num = parseInt(String(orderNumber).replace(/[^0-9]/g, ""));
    if (!num) {
      return NextResponse.json({ error: "Invalid order number." }, { status: 400 });
    }

    // Since WC ID = Shopify order number after remap, query directly by ID
    const res = await fetch(`${WC_API}/orders/${num}`, {
      headers: { Authorization: wcAuth() },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Order not found. Please check your order number and email." }, { status: 404 });
    }

    const order = await res.json();

    // Verify billing email
    if (order.billing?.email?.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: "Order not found. Please check your order number and email." }, { status: 404 });
    }

    // Extract tracking from meta
    const trackingMeta = order.meta_data?.find((m: { key: string }) => m.key === "_wc_shipment_tracking_items");
    let tracking = null;

    if (trackingMeta?.value) {
      const val = trackingMeta.value;
      const item = Array.isArray(val) ? val[0] : (typeof val === "object" ? val : null);
      if (item) {
        tracking = {
          provider:    item.tracking_provider || item.custom_tracking_provider || "Carrier",
          number:      item.tracking_number || "",
          url:         item.custom_tracking_link || "",
          dateShipped: item.date_shipped ? new Date(item.date_shipped * 1000).toISOString() : null,
        };
      }
    }

    return NextResponse.json({
      orderNumber:  order.number,
      status:       mapStatus(order.status),
      rawStatus:    order.status,
      dateCreated:  order.date_created,
      total:        order.total,
      currency:     order.currency,
      items: order.line_items?.map((item: { name: string; quantity: number }) => ({
        name:     item.name,
        quantity: item.quantity,
      })),
      tracking,
      shipping: {
        name:     `${order.shipping?.first_name ?? ""} ${order.shipping?.last_name ?? ""}`.trim(),
        address1: order.shipping?.address_1 ?? "",
        address2: order.shipping?.address_2 ?? "",
        city:     order.shipping?.city ?? "",
        state:    order.shipping?.state ?? "",
        postcode: order.shipping?.postcode ?? "",
        country:  order.shipping?.country ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
