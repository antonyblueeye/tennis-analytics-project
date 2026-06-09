/**
 * Fetches the main image URL for a Wikipedia page by its title.
 * Returns null if no image is found or if the request fails.
 */
export async function getWikiImage(playerName: string): Promise<string | null> {
  // 1. Сначала пробуем строго теннисную страницу, например "Andrei Medvedev (tennis)"
  const tennisTitle = `${playerName} (tennis)`;
  let imageUrl = await getDirectWikiImage(tennisTitle);
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // 2. Если не нашлось, пробуем прямую страницу "Andrei Medvedev"
  return await getDirectWikiImage(playerName);
}

/**
 * Directly fetches the main image for a specific Wikipedia page title.
 */
async function getDirectWikiImage(pageTitle: string): Promise<string | null> {
  const cleanTitle = pageTitle.replace(/\s+/g, '_');
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&titles=${encodeURIComponent(cleanTitle)}&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return null; // Page not found
    
    const original = pages[pageId]?.original;
    return original ? original.source : null;
  } catch (error) {
    return null;
  }
}
