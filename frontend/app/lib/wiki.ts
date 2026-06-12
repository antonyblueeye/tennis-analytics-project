/**
 * Normalizes wikidata_id from DB (e.g. "Q712208", "712208", "712208.0") → "Q712208"
 */
export function normalizeWikidataId(id: string | number | null | undefined): string | null {
  if (id == null || id === '') return null;
  const raw = String(id).trim().replace(/\.0+$/, '');
  if (!raw) return null;
  if (raw.startsWith('Q')) return raw;
  if (/^\d+$/.test(raw)) return `Q${raw}`;
  return null;
}

/**
 * Fetches image from Wikidata entity (property P18) via Commons.
 * @see https://www.wikidata.org/wiki/Q712208
 */
export async function getWikidataImage(
  wikidataId: string | number | null | undefined
): Promise<string | null> {
  const id = normalizeWikidataId(wikidataId);
  if (!id) return null;

  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(id)}` +
    `&props=claims&format=json&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const claims = data.entities?.[id]?.claims?.P18;
    if (!claims?.length) return null;

    const filename = claims[0]?.mainsnak?.datavalue?.value;
    if (typeof filename !== 'string' || !filename) return null;

    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
  } catch {
    return null;
  }
}

/** Wikidata first; Wikipedia by name as fallback when wikidata_id is missing. */
export async function getPlayerImage(
  wikidataId: string | number | null | undefined,
  playerName?: string
): Promise<string | null> {
  const fromWikidata = await getWikidataImage(wikidataId);
  if (fromWikidata) return fromWikidata;
  if (playerName) return getWikiImage(playerName);
  return null;
}

/**
 * @deprecated Use getWikidataImage / getPlayerImage instead.
 */
export async function getWikiImage(playerName: string): Promise<string | null> {
  const tennisTitle = `${playerName} (tennis)`;
  let imageUrl = await getDirectWikiImage(tennisTitle);
  if (imageUrl) return imageUrl;
  return getDirectWikiImage(playerName);
}

async function getDirectWikiImage(pageTitle: string): Promise<string | null> {
  const cleanTitle = pageTitle.replace(/\s+/g, '_');
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages` +
    `&piprop=original&titles=${encodeURIComponent(cleanTitle)}&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return null;

    return pages[pageId]?.original?.source ?? null;
  } catch {
    return null;
  }
}
