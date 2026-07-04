import { API_URL } from '@/constants/env';
import type { Match } from '@/types/football';

export async function getWorldCupMatches(date?: string): Promise<Match[]> {
  const url = new URL(`${API_URL}/api/world-cup`);
  if (date) url.searchParams.set('date', date);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`World Cup API ${response.status}`);
  }
  const payload = (await response.json()) as { matches?: Match[] };
  return payload.matches ?? [];
}
