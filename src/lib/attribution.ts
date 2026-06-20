// Track traffic source and UTM parameters for order attribution

export interface AttributionData {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  referrer?: string;
  timestamp: string;
}

export function captureAttribution(): AttributionData {
  if (typeof window === 'undefined') {
    return { source: 'direct', timestamp: new Date().toISOString() };
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  // Get UTM parameters
  const utm_source = params.get('utm_source') || '';
  const utm_medium = params.get('utm_medium') || '';
  const utm_campaign = params.get('utm_campaign') || '';
  const utm_content = params.get('utm_content') || '';

  // Determine source from UTM or referrer
  let source = 'direct';

  if (utm_source) {
    // If utm_source is provided, use it
    source = utm_source.toLowerCase();
  } else if (referrer) {
    // Infer from referrer
    if (referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
      source = 'facebook';
    } else if (referrer.includes('google.com')) {
      source = 'google-organic';
    } else if (referrer.includes('klaviyo.com')) {
      source = 'klaviyo';
    } else if (referrer.includes('pinterest.com')) {
      source = 'pinterest';
    } else if (referrer.includes('tiktok.com')) {
      source = 'tiktok';
    } else {
      source = 'referral';
    }
  }

  const attribution: AttributionData = {
    source,
    medium: utm_medium || undefined,
    campaign: utm_campaign || undefined,
    content: utm_content || undefined,
    referrer: referrer || undefined,
    timestamp: new Date().toISOString(),
  };

  // Save to localStorage for later retrieval
  try {
    localStorage.setItem('attribution_data', JSON.stringify(attribution));
  } catch (e) {
    console.error('Failed to save attribution:', e);
  }

  return attribution;
}

export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') {
    return { source: 'direct', timestamp: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem('attribution_data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to get attribution:', e);
  }

  return captureAttribution();
}

export function getAttributionLabel(): string {
  const attr = getAttribution();

  if (attr.medium === 'cpc' || attr.medium === 'ppc') {
    return `${attr.source} (paid)`;
  }
  if (attr.medium === 'organic') {
    return `${attr.source} (organic)`;
  }
  if (attr.medium === 'email') {
    return `${attr.source} (email)`;
  }

  return attr.source;
}
