const CACHE_PREFIX = "catalog-cache-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCacheKey(endpoint) {
  return `${CACHE_PREFIX}:${encodeURIComponent(endpoint)}`;
}

function readCache(endpoint) {
  if (typeof window === "undefined" || !endpoint) return null;

  try {
    const raw = window.localStorage.getItem(getCacheKey(endpoint));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.expiresAt !== "number") {
      window.localStorage.removeItem(getCacheKey(endpoint));
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(getCacheKey(endpoint));
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(endpoint, data) {
  if (typeof window === "undefined" || !endpoint || !Array.isArray(data)) return;

  try {
    const payload = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    window.localStorage.setItem(getCacheKey(endpoint), JSON.stringify(payload));
  } catch {
    // Ignore storage quota/write failures and continue using network data.
  }
}

export async function getCatalogData(endpoint, options = {}) {
  const { forceRefresh = false } = options;
  if (!endpoint) throw new Error("API URL is missing.");

  if (!forceRefresh) {
    const cachedData = readCache(endpoint);
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
  }

  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}.`);
  }

  const result = await res.json();
  if (result.status !== "success" || !Array.isArray(result.data)) {
    throw new Error(result.message || "Failed to load product catalog.");
  }

  writeCache(endpoint, result.data);
  return { data: result.data, fromCache: false };
}

export const catalogCacheTtlMs = CACHE_TTL_MS;
