import prisma from "../config/database.js";

const PROVIDER_ROLES = ["COACH", "PROVIDER"];

const candidateSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  organizationName: true,
  email: true,
  phone: true,
  role: true,
  invitedAt: true,
  termsAcceptedAt: true,
};

async function getListingWithOwnerRole(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      providerId: true,
      listingHeadline: true,
      provider: { select: { id: true, role: true } },
    },
  });
  if (!service) throw { statusCode: 404, message: "Listing not found" };

  // Sport sessions belong to COACH accounts and services to PROVIDER accounts;
  // the owner's role decides which public page the listing appears on.
  const role = service.provider?.role;
  if (!PROVIDER_ROLES.includes(role)) {
    throw { statusCode: 400, message: "This listing is not owned by a provider account" };
  }
  return { service, role };
}

const displayName = (user) =>
  user.organizationName || user.name || [user.firstName, user.lastName].filter(Boolean).join(" ");

const contactName = (user) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.organizationName;

export async function getReassignCandidates(serviceId, search = "") {
  const { service, role } = await getListingWithOwnerRole(serviceId);
  const term = String(search || "").trim();

  const users = await prisma.user.findMany({
    where: {
      role,
      id: { not: service.providerId },
      status: "ACTIVE",
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { organizationName: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { firstName: { contains: term, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: candidateSelect,
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return { role, candidates: users };
}

export async function reassignListing(serviceId, newProviderId) {
  const { service, role } = await getListingWithOwnerRole(serviceId);

  if (!newProviderId) throw { statusCode: 400, message: "Please choose a provider" };
  if (newProviderId === service.providerId) {
    throw { statusCode: 400, message: "This listing already belongs to that provider" };
  }

  const target = await prisma.user.findUnique({
    where: { id: newProviderId },
    select: candidateSelect,
  });
  if (!target) throw { statusCode: 404, message: "Provider not found" };
  if (target.role !== role) {
    throw {
      statusCode: 400,
      message:
        role === "COACH"
          ? "Sport session listings can only be reassigned to a sport provider account"
          : "Service listings can only be reassigned to a service provider account",
    };
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      providerId: target.id,
      providerName: displayName(target) || "Unknown",
      contactName: contactName(target) || null,
      providerEmail: target.email || "",
      providerPhone: target.phone || "",
      ...(target.organizationName ? { organizationName: target.organizationName } : {}),
    },
    select: {
      id: true,
      listingHeadline: true,
      providerId: true,
      providerName: true,
      provider: { select: candidateSelect },
    },
  });

  return updated;
}
