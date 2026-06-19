/**
 * 17TRACK API (v2.2) helper.
 *
 * We use it to get the REAL shipment carrier + status for a tracking number,
 * instead of trusting the (sometimes wrong) imported `tracking_provider` meta
 * or the misleading WooCommerce order status.
 *
 * Flow on the current plan (RealTime endpoint is locked):
 *   1. gettrackinfo — read the latest crawled status for a registered number.
 *   2. If the number isn't tracked yet, register it so 17track starts crawling
 *      (data becomes available on its next poll).
 */

const API = "https://api.17track.net/track/v2.2";
const KEY = process.env.SEVENTEEN_TRACK_API_KEY;

export interface TrackEvent {
  description: string;
  location: string | null;
  time: string | null; // ISO timestamp
}

export interface LiveTracking {
  carrier: string | null;       // human-readable carrier name (auto-detected)
  status: string | null;        // mapped display status (e.g. "In Transit")
  rawStatus: string | null;     // raw 17track status (e.g. "InTransit")
  lastEvent: string | null;     // latest scan description
  lastEventTime: string | null; // ISO timestamp of latest scan
  events: TrackEvent[];         // full scan history, newest first
}

// 17track main status → our display label
function mapStatus(s: string): string {
  const map: Record<string, string> = {
    Delivered:          "Delivered",
    InTransit:          "In Transit",
    OutForDelivery:     "Out for Delivery",
    InfoReceived:       "Shipped",
    AvailableForPickup: "Available for Pickup",
    DeliveryFailure:    "Delivery Issue",
    Exception:          "Exception",
    Expired:            "Expired",
    NotFound:           "Pending",
  };
  return map[s] ?? s;
}

async function call(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "17token": KEY ?? "",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return res.json();
}

/**
 * Returns live carrier + status for a tracking number, or null if 17track has
 * no data yet (in which case we register it so future lookups work).
 */
export async function getLiveTracking(number: string): Promise<LiveTracking | null> {
  if (!KEY || !number) return null;
  try {
    const info = await call("/gettrackinfo", [{ number }]);
    const accepted = info?.data?.accepted?.[0];
    const ti = accepted?.track_info;
    const rawStatus: string | undefined = ti?.latest_status?.status;

    if (rawStatus && rawStatus !== "NotFound") {
      const providerNode = ti?.tracking?.providers?.[0];
      const provider = providerNode?.provider;
      const latestEvent = ti?.latest_event;
      const events: TrackEvent[] = (providerNode?.events ?? []).map((e: any) => ({
        description: e?.description ?? e?.stage ?? "",
        location:    e?.location || null,
        time:        e?.time_iso ?? e?.time_utc ?? null,
      })).filter((e: TrackEvent) => e.description);

      return {
        carrier:       provider?.name ?? null,
        status:        mapStatus(rawStatus),
        rawStatus,
        lastEvent:     latestEvent?.description ?? events[0]?.description ?? null,
        lastEventTime: latestEvent?.time_iso ?? latestEvent?.time_utc ?? events[0]?.time ?? null,
        events,
      };
    }

    // Not tracked yet → register so 17track begins crawling it.
    await call("/register", [{ number }]);
    return null;
  } catch (e) {
    console.error("17track getLiveTracking error:", e);
    return null;
  }
}
