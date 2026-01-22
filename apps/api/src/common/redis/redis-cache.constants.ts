export const CACHE_TTL = {
  DOCUMENT_LOOKUP: 300, // 5 minutes in seconds
  TAG_SUGGESTIONS: 600, // 10 minutes in seconds
};

export const CACHE_KEYS = {
  document: (tenantId: string, id: string) => `doc:${tenantId}:${id}`,
  tags: (tenantId: string, query: string) => `tags:${tenantId}:${query}`,
};
