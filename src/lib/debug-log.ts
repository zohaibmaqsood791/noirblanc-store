export async function logDebug(event: string, email?: string, data?: any) {
  const logData = {
    event,
    email,
    data,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : '',
  };

  // Log to console
  console.log(`[DEBUG] ${event}:`, logData);

  // Send to WordPress (noirblanc.store)
  try {
    await fetch('https://noirblanc.store/wp-json/custom/v1/debug-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...logData,
        store: 'headless-checkout',
      }),
    });
  } catch (e) {
    console.error('Failed to send log to WordPress:', e);
  }
}
