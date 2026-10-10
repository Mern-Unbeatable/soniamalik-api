// Multipart form submissions send arrays as JSON strings, and older saves stored them
// nested several levels deep (e.g. ['["[\\"Other\\"]"]']), so unwrap until plain names remain.
export function normalizeStringList(value) {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    const flattened = value.flatMap((item) => normalizeStringList(item));
    return [...new Set(flattened)];
  }

  const text = String(value).trim();
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith('"')) {
    try {
      return normalizeStringList(JSON.parse(text));
    } catch {
      // Not valid JSON; fall through and treat as plain text
    }
  }

  return text
    .split(",")
    .map((item) => item.trim().replace(/^["'\\[\]]+|["'\\[\]]+$/g, "").trim())
    .filter(Boolean);
}
