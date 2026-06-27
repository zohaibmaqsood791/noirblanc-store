export const LOCALE_CURRENCY: Record<string, string> = {
  gb: "GBP",
  au: "AUD",
  ca: "CAD",
  eu: "EUR",
  nz: "NZD",
  ae: "AED",
};

// Countries → locale prefix (US has no prefix)
export const COUNTRY_LOCALE: Record<string, string> = {
  GB: "gb",
  AU: "au",
  CA: "ca",
  FR: "eu",
  ES: "eu",
  FI: "eu",
  IE: "eu",
  DE: "eu",
  IT: "eu",
  NL: "eu",
  NZ: "nz",
  AE: "ae",
};

export type Rates = Record<string, number>;

let cached: { rates: Rates; ts: number } | null = null;
const TTL = 60 * 60 * 1000; // 1 hour

export async function fetchRates(): Promise<Rates> {
  if (cached && Date.now() - cached.ts < TTL) return cached.rates;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    cached = { rates: json.rates as Rates, ts: Date.now() };
    return cached.rates;
  } catch {
    return cached?.rates ?? {};
  }
}

export function convertPrice(usdStr: string | null | undefined, rates: Rates, currency: string): string {
  if (!usdStr) return "";
  const cleaned = usdStr.replace(/<[^>]*>/g, "").trim();
  if (currency === "USD" || !rates[currency]) return cleaned;

  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return cleaned;

  const converted = num * rates[currency];
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
