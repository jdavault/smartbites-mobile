// Helper function to format image name (exactly like your AppWrite formatImageName)
export function formatImageName(searchQuery: string, allergenNames: string[], extension: string): string {
  const cleanQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const allergenSuffix = allergenNames.length > 0 ? `-${allergenNames.join('-').toLowerCase()}` : '';
  return `${cleanQuery}${allergenSuffix}-${Date.now()}.${extension}`;
}