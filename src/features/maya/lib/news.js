/**
 * News fetcher — tech + tennis feeds for Vasco.
 * Uses free RSS feeds via a public CORS proxy (api.allorigins.win).
 * No API key needed.
 */

const FEEDS = {
  tech: [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      icon: '💻',
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com/rss/index.xml',
      icon: '⚡',
    },
    {
      name: 'Hacker News',
      url: 'https://hnrss.org/frontpage?count=10',
      icon: '🟧',
    },
  ],
  tennis: [
    {
      name: 'ESPN Tennis',
      url: 'https://www.espn.com/espn/rss/tennis/news',
      icon: '🎾',
    },
    {
      name: 'Tennis World USA',
      url: 'https://www.tennisworldusa.org/rss/rss.xml',
      icon: '🏆',
    },
  ],
}

const CACHE_KEY = 'maya_news_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 min

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    return parsed
  } catch { return null }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, fetchedAt: Date.now() }))
  } catch {}
}

async function fetchRSS(feedUrl) {
  // Use allorigins.win as CORS proxy (free, no key)
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  const text = await res.text()
  return parseRSS(text)
}

function parseRSS(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = []

  // Try RSS 2.0 <item> first, then Atom <entry>
  const nodes = doc.querySelectorAll('item, entry')
  for (const node of nodes) {
    const title = node.querySelector('title')?.textContent?.trim()
    if (!title) continue

    const link = node.querySelector('link')?.textContent?.trim()
      || node.querySelector('link')?.getAttribute('href')
      || ''

    const pubDate = node.querySelector('pubDate, published, updated')?.textContent?.trim()
    const desc = node.querySelector('description, summary, content')?.textContent?.trim() || ''

    // Strip HTML from description
    const cleanDesc = desc.replace(/<[^>]*>/g, '').trim().slice(0, 200)

    items.push({
      title,
      link,
      date: pubDate ? new Date(pubDate).toISOString() : null,
      desc: cleanDesc,
    })
  }
  return items.slice(0, 8)
}

async function fetchNews(category = 'tech') {
  const cached = loadCache()
  if (cached?.[category]?.length) return cached[category]

  const feeds = FEEDS[category] || []
  const all = []

  for (const feed of feeds) {
    try {
      const items = await fetchRSS(feed.url)
      items.forEach(item => {
        all.push({ ...item, source: feed.name, icon: feed.icon })
      })
    } catch (e) {
      console.warn(`[News] Failed to fetch ${feed.name}:`, e.message)
    }
  }

  // Sort by date, newest first
  all.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date) - new Date(a.date)
  })

  const result = all.slice(0, 20)

  // Cache
  const cache = loadCache() || {}
  cache[category] = result
  saveCache(cache)

  return result
}

function getCategories() {
  return Object.keys(FEEDS)
}

export { fetchNews, getCategories, FEEDS }
