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

  // Send to API
  try {
    await fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
  } catch (e) {
    console.error('Failed to send debug log:', e);
  }
}
