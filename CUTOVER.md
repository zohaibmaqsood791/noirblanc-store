# Switch-Day Cutover Checklist

**Goal:** Move ad traffic to the headless store (Square checkout, normal payouts) and off Shopify (payment hold until 2026-07-28).

- **Headless store** → `noirblancnyc.com` (main store, ads point here, Square checkout)
- **Shopify** → `noirblancny.com` (demoted, off ads)

---

## Phase 0 — Before switch day (prep, no downtime)

- [ ] Confirm headless checkout works on staging (`noirblanc-store.vercel.app`): card + Apple Pay + Google Pay all complete a real order
- [ ] Confirm the feed is live: `https://noirblanc-store.vercel.app/merchant-feed.xml` shows products
- [ ] Add `KLAVIYO_PRIVATE_KEY` to Vercel (if using Klaviyo purchase flow)
- [ ] Buy/own `noirblancny.com` and have DNS access for both domains

## Phase 1 — Move Shopify to its new domain

- [ ] Shopify admin → Settings → Domains → add `noirblancny.com`
- [ ] Set `noirblancny.com` as Shopify's **primary domain**
- [ ] Confirm the Shopify store loads on `noirblancny.com`

## Phase 2 — Point the main domain at the headless store

- [ ] In **Vercel → Settings → Domains**, add `noirblancnyc.com` (+ `www`)
- [ ] At the registrar, change `noirblancnyc.com` DNS to Vercel's records
- [ ] Wait for DNS to propagate; confirm `https://noirblancnyc.com` loads the **headless** store
- [ ] Confirm `https://noirblancnyc.com/merchant-feed.xml` returns products

## Phase 3 — Register payments on the live domain

- [ ] Apple Pay: visit `https://noirblancnyc.com/api/square/register-apple-pay?domain=noirblancnyc.com` → expect `status: 200`
- [ ] Place ONE real test order on `noirblancnyc.com` (card + Apple Pay + Google Pay) → confirm it lands in WooCommerce and pays out via Square

## Phase 4 — Point Google Shopping / PMax at the headless feed

- [ ] Merchant Center → Settings → **Data sources** → remove/disable the **Shopify auto-feed**
- [ ] Add product source → **scheduled fetch** → `https://noirblancnyc.com/merchant-feed.xml` → daily
- [ ] Settings → Business info → **Website** still shows `noirblancnyc.com` Verified/Claimed (no change needed — headless serves it now)
- [ ] Products → **Diagnostics**: watch for approvals (a few hours – ~3 days). Product IDs change (Shopify → WooCommerce), so they re-review.
- [ ] PMax/Shopping campaigns: leave as-is (same Merchant Center + Google Ads account). They re-serve once the new feed is approved. Expect a short re-learning period.

## Phase 5 — Conversion tracking (protect PMax)

- [ ] Confirm the Google Ads conversion tag `AW-17089443241` fires on a headless purchase (it's in the headless code)
- [ ] Place a test order and confirm the conversion shows in Google Ads (Tools → Conversions)

## Phase 6 — Meta (Facebook/Instagram shop), if used

- [ ] Meta Business Settings → verify domain `noirblancnyc.com`
- [ ] Commerce Manager → Catalog → Data Sources → add `https://noirblancnyc.com/merchant-feed.xml` (scheduled)
- [ ] Reconnect the Meta Pixel `724894499822999` to the catalog; confirm `content_ids` match feed IDs

## Phase 7 — Post-cutover hygiene

- [ ] Re-scrape the link preview (Facebook Sharing Debugger) so WhatsApp/social show `noirblancnyc.com`
- [ ] Google Search Console → submit `https://noirblancnyc.com/sitemap.xml`
- [ ] Restrict the Google Maps API key to "Places API (New)" + set a billing alert
- [ ] Monitor Merchant Center disapprovals + Google Ads delivery for the first week

---

### Rollback note
If the headless feed gets disapproved or checkout fails after switch, you can temporarily repoint `noirblancnyc.com` DNS back to Shopify (or move Shopify's primary domain back) to keep Shopping alive while fixing — but the payment hold returns on Shopify sales.
