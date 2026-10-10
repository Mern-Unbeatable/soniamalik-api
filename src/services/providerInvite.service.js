import crypto from "crypto";
import prisma from "../config/database.js";
import { config } from "../config/index.js";
import { hashPassword } from "../utils/password.js";
import { normalizeStringList } from "../utils/stringList.js";
import { sendProviderInviteEmail } from "./email.service.js";

const INVITE_EXPIRY_DAYS = 7;
const PROVIDER_ROLES = ["COACH", "PROVIDER"];

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const trimOrNull = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const inviteUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  firstName: true,
  phone: true,
  postcode: true,
  organizationName: true,
  sportsOffered: true,
  serviceTypes: true,
  aboutOrganization: true,
  invitedAt: true,
  termsAcceptedAt: true,
  createdAt: true,
};

async function issueInvite(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const inviteExpires = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      inviteToken: hashToken(token),
      inviteExpires,
      invitedAt: new Date(),
    },
    select: inviteUserSelect,
  });

  const inviteLink = `${config.frontendUrl.replace(/\/$/, "")}/set-password?token=${token}`;
  const greetingName = user.firstName || user.organizationName || user.name;

  let inviteSent = true;
  try {
    await sendProviderInviteEmail(updated.email, escapeHtml(greetingName), inviteLink, INVITE_EXPIRY_DAYS);
  } catch (error) {
    console.error("Failed to send provider invite email:", error);
    inviteSent = false;
  }

  return { user: updated, inviteSent };
}

export async function createInvitedProvider(data) {
  const role = String(data?.role || "").toUpperCase();
  if (!PROVIDER_ROLES.includes(role)) {
    throw { statusCode: 400, message: "Role must be COACH (sport provider) or PROVIDER (service provider)" };
  }

  const organizationName = trimOrNull(data?.organizationName);
  if (!organizationName) {
    throw { statusCode: 400, message: "Organisation name is required" };
  }

  const email = trimOrNull(data?.email);
  if (!email) {
    throw { statusCode: 400, message: "Email is required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 409, message: "An account with this email already exists" };
  }

  // Nobody knows this password; the provider replaces it through the invite link.
  const unusablePassword = await hashPassword(crypto.randomBytes(32).toString("hex"));

  const user = await prisma.user.create({
    data: {
      email,
      password: unusablePassword,
      name: organizationName,
      role,
      isEmailVerified: true,
      organizationName,
      firstName: trimOrNull(data?.firstName),
      phone: trimOrNull(data?.phone),
      postcode: trimOrNull(data?.postcode),
      aboutOrganization: trimOrNull(data?.aboutOrganization),
      ...(role === "COACH"
        ? { sportsOffered: normalizeStringList(data?.sportsOffered) }
        : { serviceTypes: normalizeStringList(data?.serviceTypes) }),
    },
  });

  return issueInvite(user);
}

export async function resendProviderInvite(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }
  if (!user.invitedAt) {
    throw { statusCode: 400, message: "This account was not created by invite" };
  }
  if (user.termsAcceptedAt) {
    throw { statusCode: 400, message: "This provider has already set up their account" };
  }

  return issueInvite(user);
}

async function findUserByInviteToken(token) {
  if (!token || typeof token !== "string") {
    throw { statusCode: 400, message: "This invite link is invalid or has expired" };
  }

  const user = await prisma.user.findFirst({
    where: { inviteToken: hashToken(token) },
  });

  if (!user || !user.inviteExpires || user.inviteExpires < new Date()) {
    throw { statusCode: 400, message: "This invite link is invalid or has expired" };
  }

  return user;
}

export async function getInviteDetails(token) {
  const user = await findUserByInviteToken(token);

  return {
    email: user.email,
    name: user.firstName || user.organizationName || user.name,
    organizationName: user.organizationName,
    role: user.role,
  };
}

export async function acceptInvite({ token, password, agreeToTerms }) {
  const user = await findUserByInviteToken(token);

  if (!password || String(password).length < 8) {
    throw { statusCode: 400, message: "Password must be at least 8 characters" };
  }
  if (agreeToTerms !== true) {
    throw { statusCode: 400, message: "You must agree to ESSA Hub's Terms & Conditions and Privacy Policy" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(password),
      termsAcceptedAt: new Date(),
      inviteToken: null,
      inviteExpires: null,
    },
  });

  return { email: user.email };
}
