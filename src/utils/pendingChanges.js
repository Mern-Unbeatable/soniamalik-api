import { Prisma } from "@prisma/client";

// Fields a provider can never change through a staged edit
const PROTECTED_FIELDS = [
  "id",
  "status",
  "isApproved",
  "isFeatured",
  "featuredAt",
  "featuredBy",
  "bannedReason",
  "bannedAt",
  "rejectionReason",
  "providerId",
  "organizerId",
  "shareLink",
  "currentParticipants",
  "pendingChanges",
  "pendingChangesAt",
  "createdAt",
  "updatedAt",
];

const isDecimal = (value) =>
  value !== null &&
  typeof value === "object" &&
  (value instanceof Prisma.Decimal || value?.constructor?.name === "Decimal");

function toJsonValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (isDecimal(value)) return Number(value);
  if (Array.isArray(value)) return value.map(toJsonValue);
  return value;
}

function toComparable(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (isDecimal(value)) return Number(value);
  if (Array.isArray(value)) return value.map(toComparable);
  if (typeof value === "object") return JSON.parse(JSON.stringify(value));
  return value;
}

export function isSameValue(a, b) {
  return JSON.stringify(toComparable(a)) === JSON.stringify(toComparable(b));
}

/**
 * Merge a new edit into any existing pending edit and drop every field that
 * matches the live record. Returns null when nothing differs from live.
 */
export function mergePendingChanges(live, existingPending, incoming) {
  const merged = { ...(existingPending || {}) };

  Object.entries(incoming || {}).forEach(([field, value]) => {
    if (value === undefined || PROTECTED_FIELDS.includes(field)) return;
    merged[field] = toJsonValue(value);
  });

  const changes = {};
  Object.entries(merged).forEach(([field, value]) => {
    if (!isSameValue(live?.[field], value)) changes[field] = value;
  });

  return Object.keys(changes).length > 0 ? changes : null;
}

export function buildPendingDiff(live, pending) {
  if (!pending || typeof pending !== "object") return [];
  return Object.entries(pending).map(([field, newValue]) => ({
    field,
    oldValue: toJsonValue(live?.[field] ?? null),
    newValue,
  }));
}

export function hasPendingChanges(record) {
  return Boolean(record?.pendingChangesAt && record?.pendingChanges);
}

/** Record as the owner sees it: live data with their pending edits applied. */
export function withPendingApplied(record) {
  if (!hasPendingChanges(record)) return record;
  return { ...record, ...record.pendingChanges };
}

export function stripPendingChanges(record) {
  if (!record || typeof record !== "object") return record;
  const { pendingChanges, ...rest } = record;
  return { ...rest, hasPendingChanges: hasPendingChanges(record) };
}

export const clearPendingData = () => ({
  pendingChanges: Prisma.DbNull,
  pendingChangesAt: null,
});
