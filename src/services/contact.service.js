import prisma from "../config/database.js";
import { contactEmailService } from "./contact.email.js";

export async function createContact(data) {
  const { name, email, subject, message } = data;

  try {

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message
      }
    });

    // Send emails (non-blocking)
    contactEmailService.sendNotificationToAdmin(contact).catch(err =>
      console.error('Admin notification failed:', err)
    );

    contactEmailService.sendConfirmationToUser(contact).catch(err =>
      console.error('User confirmation failed:', err)
    );

    return contact;
  } catch (error) {
    console.error('Failed to create contact:', error);
    throw { statusCode: 500, message: "Failed to create contact" };
  }
}

export async function getContactById(contactId) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId }
  });

  if (!contact) {
    throw { statusCode: 404, message: "Contact not found" };
  }

  return contact;
}

export async function deleteContact(contactId) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId }
  });

  if (!contact) {
    throw { statusCode: 404, message: "Contact not found" };
  }

  await prisma.contact.delete({
    where: { id: contactId }
  });

  return { success: true, message: "Contact deleted successfully" };
}

export async function getAllContacts(filters = {}) {
  const { page = 1, limit = 20, search } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } }
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.contact.count({ where })
  ]);

  return {
    contacts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}