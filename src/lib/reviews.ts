const WC_BASE = "https://noirblanc.store/?rest_route=/noirblanc/v1";

export interface Review {
  id: number;
  name: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  images: string[];
}

export async function fetchReviews(): Promise<Review[]> {
  try {
    const res = await fetch(`${WC_BASE}/reviews`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
