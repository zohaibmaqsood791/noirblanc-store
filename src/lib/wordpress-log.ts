// Send logs to WordPress at noirblanc.store
const WORDPRESS_API = "https://noirblanc.store/wp-json/custom/v1/debug-logs";

export async function sendLogToWordPress(event: string, email?: string, data?: any) {
  try {
    await fetch(WORDPRESS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        email: email || "unknown",
        data,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.pathname : "",
        store: "headless-checkout",
      }),
    });
  } catch (e) {
    console.error("Failed to send log to WordPress:", e);
  }
}
