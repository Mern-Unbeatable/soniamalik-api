import prisma from "../config/database.js";

// ==================== CUSTOM ERRORS ====================
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

// ==================== HELPER FUNCTIONS ====================
const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  return value === "true" || value === true;
};

const parseOrder = (order) => {
  return order !== undefined ? parseInt(order) : 0;
};


// ==================== SECTION SERVICES ====================

export async function createSection(data) {
  const section = await prisma.homeSection.create({
    data: {
      page: data.page,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      image: data.image,
      aboutImages: data.aboutImages || [],
      order: parseOrder(data.order),
      isActive: parseBoolean(data.isActive) ?? true,
      founderInfo: data.founderInfo,
      sportsProviderImg: data.sportsProviderImg,
      sportsProviderDescription: data.sportsProviderDescription,
      supportImg: data.supportImg,
      supportDescription: data.supportDescription,
      brandImg: data.brandImg,
      brandDescription: data.brandDescription,
      sportSubTitle: data.sportSubTitle,
      sportTitle: data.sportTitle,
      sectionSubTitle: data.sectionSubTitle,
      sectionTitle: data.sectionTitle,
    },

  });
  return section;
}

export async function getAllSections(filters) {
  const { pageType, isActive, page = 1, limit = 100 } = filters;
  const where = {};

  if (pageType) where.page = pageType;
  if (isActive !== undefined) where.isActive = parseBoolean(isActive);

  const [sections, total] = await Promise.all([
    prisma.homeSection.findMany({
      where,

      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { order: "asc" },
    }),
    prisma.homeSection.count({ where }),
  ]);

  return {
    sections,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
}

export async function getSectionById(id) {
  const section = await prisma.homeSection.findUnique({
    where: { id }
  });

  if (!section) throw new NotFoundError("Section not found");
  return section;
}

export async function updateSection(id, data) {

  const existingSection = await getSectionById(id);

  const allowedFields = [
    "page",
    "title",
    "subtitle",
    "description",
    "image",
    "aboutImages",
    "founderInfo",
    "sportsProviderImg",
    "sportsProviderDescription",
    "supportImg",
    "supportDescription",
    "brandImg",
    "brandDescription",
    "sectionTitle",
    "sectionSubTitle",
    "sportTitle",
    "sportSubTitle"
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  // Parse founderInfo
  if (typeof updateData.founderInfo === "string") {
    updateData.founderInfo = JSON.parse(updateData.founderInfo);
  }

  // Parse aboutImages
  if (typeof updateData.aboutImages === "string") {
    updateData.aboutImages = JSON.parse(updateData.aboutImages);
  }

  // Merge founder image
  if (data.founderImage) {

    // If founderInfo wasn't sent,
    // use the existing one from database
    updateData.founderInfo =
      updateData.founderInfo ||
      existingSection.founderInfo ||
      {};

    updateData.founderInfo.image = data.founderImage;
  }

  if (data.order !== undefined) {
    updateData.order = parseOrder(data.order);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = parseBoolean(data.isActive);
  }

  return prisma.homeSection.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteSection(id) {
  await getSectionById(id);
  await prisma.homeSection.delete({ where: { id } });
  return { message: "Section deleted successfully" };
}

export async function getActiveSections(pageType = null) {
  const where = { isActive: true };
  if (pageType) where.page = pageType;

  return await prisma.homeSection.findMany({
    where,

    orderBy: { order: "asc" },
  });
}

export async function getHomepageContent(pageType = null) {
  const sections = await getActiveSections(pageType);
  return { sections };
}

// ==================== CARD SERVICES ====================

export async function createCard(data) {

  console.log('check card ', data)

  const card = await prisma.card.create({
    data: {
      sectionTitle: data.sectionTitle,
      sectionSubTitle: data.sectionSubTitle,
      sportSubTitle: data.sportSubTitle,
      sportSubTitle: data.sportSubTitle,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      image: data.image,
      order: parseOrder(data.order),
      isActive: parseBoolean(data.isActive) ?? true,
    },
  });

  return card;
}

export async function getAllCards(filters) {
  const { isActive, page = 1, limit = 100 } = filters;
  const where = {};

  if (isActive !== undefined) where.isActive = parseBoolean(isActive);

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,

      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { order: "asc" },
    }),
    prisma.card.count({ where }),
  ]);

  return {
    cards,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
}

export async function getCardById(id) {
  const card = await prisma.card.findUnique({
    where: { id },
  });

  if (!card) throw new NotFoundError("Card not found");
  return card;
}
export async function updateCard(id, data) {
  await getCardById(id);


  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.order !== undefined) updateData.order = parseOrder(data.order);
  if (data.isActive !== undefined) updateData.isActive = parseBoolean(data.isActive);

  const card = await prisma.card.update({
    where: { id },
    data: updateData,
  });

  return card;
}

export async function deleteCard(id) {
  await getCardById(id);
  await prisma.card.delete({ where: { id } });
  return { message: "Card deleted successfully" };
}