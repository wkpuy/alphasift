export interface NewsEvent {
  title: string;
  country: string;
  date: string; // ISO string
  impact: 'High' | 'Medium' | 'Low' | 'Non-Economic';
  forecast: string;
  previous: string;
}

const CACHE_KEY = 'ff_calendar_cache';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export async function fetchUpcomingNews(): Promise<NewsEvent[]> {
  try {
    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }

    // Using allorigins as a reliable free CORS proxy
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const targetUrl = encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    
    const res = await fetch(proxyUrl + targetUrl);
    if (!res.ok) throw new Error('Failed to fetch calendar');
    
    const data: NewsEvent[] = await res.json();
    
    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    
    return data;
  } catch (err) {
    console.error('Error fetching economic calendar:', err);
    return [];
  }
}

export function getNewsWarningsForPair(pair: string, news: NewsEvent[]): string[] {
  const currencies = pair.split('/'); // e.g., ['EUR', 'USD']
  const warnings: string[] = [];
  const now = new Date();
  
  // Look 24 hours into the future
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (const event of news) {
    if (!currencies.includes(event.country)) continue;
    if (event.impact !== 'High' && event.impact !== 'Medium') continue;

    const eventDate = new Date(event.date);
    
    // If event is in the next 24 hours
    if (eventDate > now && eventDate <= tomorrow) {
      // Calculate hours remaining
      const hoursLeft = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      warnings.push(`🚨 ${event.impact} Impact: ${event.country} (${event.title}) in ~${hoursLeft}h`);
    }
  }

  // Return unique warnings (sometimes APIs duplicate events)
  return Array.from(new Set(warnings));
}
