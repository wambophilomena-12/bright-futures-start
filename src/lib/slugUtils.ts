/**
 * Generates a URL-friendly slug from name and location
 */
export const generateSlug = (name: string, location?: string): string => {
  const combined = location ? `${name}-${location}` : name;
  return combined
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
};

/**
 * Parses a slug to extract potential search terms
 */
export const parseSlug = (slug: string): string => {
  return slug.replace(/-/g, ' ').trim();
};

/**
 * Creates a full URL path with slug and id for fallback
 */
export const createDetailPath = (
  type: string,
  id: string,
  name: string,
  location?: string
): string => {
  const slug = generateSlug(name, location);
  return `/${type}/${slug}-${id.substring(0, 8)}`;
};

/**
 * Extracts ID from a slug-id combination
 * The ID is the last 8 characters after the final hyphen
 */
export const extractIdFromSlug = (slugWithId: string): string => {
  // Check if it's a UUID format (contains hyphens in UUID pattern)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slugWithId)) {
    return slugWithId;
  }
  
  // Clean up slug - remove leading/trailing hyphens and collapse multiple hyphens
  const cleanSlug = slugWithId.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  
  // Extract the last segment as ID prefix (typically 8 chars)
  const lastHyphenIndex = cleanSlug.lastIndexOf('-');
  if (lastHyphenIndex !== -1) {
    const idPart = cleanSlug.substring(lastHyphenIndex + 1);
    // Return if it looks like a valid ID prefix (alphanumeric)
    if (idPart && /^[0-9a-f]+$/i.test(idPart)) {
      return idPart;
    }
  }
  
  // If no hyphen or invalid format, check if the whole string is a potential ID
  const cleanedId = cleanSlug.replace(/-/g, '');
  if (/^[0-9a-f]+$/i.test(cleanedId)) {
    return cleanedId.substring(0, 8);
  }
  
  return cleanSlug;
};
