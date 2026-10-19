import prisma from "../config/database.js";
import { config } from "../config/index.js";

export const DRAFT_KINDS = ["SERVICE", "EVENT"];
const MAX_DRAFT_BYTES = 200 * 1024;
const MAX_TITLE_LENGTH = 200;

const draftSelect = {
  id: true,
  kind: true,
  title: true,
  data: true,
  image: true,
  logo: true,
  createdAt: true,
  updatedAt: true,
};

function parseKind(kind) {
  const value = String(kind || "").trim().toUpperCase();
  if (!DRAFT_KINDS.includes(value)) {
    throw { statusCode: 400, message: "Draft type must be SERVICE or EVENT" };
  }
  return value;
}

function parseData(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      throw { statusCode: 400, message: "Draft data is not valid" };
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw { statusCode: 400, message: "Draft data is not valid" };
  }
  if (Buffer.byteLength(JSON.stringify(data), "utf8") > MAX_DRAFT_BYTES) {
    throw { statusCode: 400, message: "Draft is too large to save" };
  }
  return data;
}

function parseTitle(title) {
  const text = typeof title === "string" ? title.trim() : "";
  return text ? text.slice(0, MAX_TITLE_LENGTH) : null;
}

/** Uploaded draft files arrive through uploadServiceImages as req.files.image / req.files.logo */
export function getDraftUploadPaths(req) {
  const toUrl = (field) => {
    const file = req.files?.[field]?.[0];
    return file ? `${config.backendUrl}/uploads/drafts/${file.filename}` : null;
  };
  return { image: toUrl("image"), logo: toUrl("logo") };
}

export async function listDrafts(ownerId, kind) {
  return prisma.listingDraft.findMany({
    where: { ownerId, kind: parseKind(kind) },
    orderBy: { updatedAt: "desc" },
    select: draftSelect,
  });
}

export async function createDraft(ownerId, body, uploads = {}) {
  return prisma.listingDraft.create({
    data: {
      ownerId,
      kind: parseKind(body.kind),
      title: parseTitle(body.title),
      data: parseData(body.data),
      image: uploads.image || null,
      logo: uploads.logo || null,
    },
    select: draftSelect,
  });
}

async function findOwnDraft(draftId, ownerId) {
  const draft = await prisma.listingDraft.findFirst({
    where: { id: draftId, ownerId },
  });
  if (!draft) throw { statusCode: 404, message: "Draft not found" };
  return draft;
}

export async function updateDraft(draftId, ownerId, body, uploads = {}) {
  await findOwnDraft(draftId, ownerId);

  const data = {
    title: parseTitle(body.title),
    data: parseData(body.data),
  };
  if (uploads.image) data.image = uploads.image;
  if (uploads.logo) data.logo = uploads.logo;
  if (body.removeImage === "true" || body.removeImage === true) data.image = null;

  return prisma.listingDraft.update({
    where: { id: draftId },
    data,
    select: draftSelect,
  });
}

export async function deleteDraft(draftId, ownerId) {
  await findOwnDraft(draftId, ownerId);
  await prisma.listingDraft.delete({ where: { id: draftId } });
}

/**
 * Draft being submitted as a real listing/event. Returns null when the id is
 * missing or belongs to someone else, so a bad id never blocks the submission.
 */
export async function findDraftForSubmit(draftId, ownerId, kind) {
  if (!draftId) return null;
  return prisma.listingDraft.findFirst({
    where: { id: String(draftId), ownerId, kind },
  });
}

export async function removeSubmittedDraft(draft) {
  if (!draft) return;
  try {
    await prisma.listingDraft.delete({ where: { id: draft.id } });
  } catch (error) {
    console.error("Failed to remove submitted draft:", error.message);
  }
}
