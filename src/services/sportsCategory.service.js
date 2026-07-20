import prisma from "../config/database.js";

export async function createSportsCategory(data) {
  try {
    const category = await prisma.sportsCategory.create({
      data: {
        name: data.name,
      },
    });

    return category;
  } catch (error) {
    // ✅ যদি একই নামের ক্যাটাগরি আগে থেকে থাকে (Unique Constraint Error)
    if (error.code === "P2002") {
      throw {
        statusCode: 409,
        message: `Sports category "${data.name}" already exists`,
      };
    }
    throw {
      statusCode: 400,
      message: `Failed to create category: ${error.message}`,
    };
  }
}

export async function getAllSportsCategories(query = {}) {
  const { search, page = 1, limit = 50 } = query;

  const where = {};
  
  // ✅ Search functionality
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [categories, total] = await Promise.all([
    prisma.sportsCategory.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sportsCategory.count({ where }),
  ]);

  return {
    categories,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getSportsCategoryById(categoryId) {
  const category = await prisma.sportsCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw { statusCode: 404, message: "Sports category not found" };
  }

  return category;
}

export async function updateSportsCategory(categoryId, updateData) {
  const category = await prisma.sportsCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw { statusCode: 404, message: "Sports category not found" };
  }

  try {
    const updatedCategory = await prisma.sportsCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    return updatedCategory;
  } catch (error) {
    // ✅ আপডেট করার সময় যদি অন্য কোনো ক্যাটাগরির সাথে নাম মিলে যায়
    if (error.code === "P2002") {
      throw {
        statusCode: 409,
        message: `Sports category "${updateData.name}" already exists`,
      };
    }
    throw {
      statusCode: 400,
      message: `Failed to update category: ${error.message}`,
    };
  }
}

export async function deleteSportsCategory(categoryId) {
  const category = await prisma.sportsCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw { statusCode: 404, message: "Sports category not found" };
  }

  await prisma.sportsCategory.delete({
    where: { id: categoryId },
  });

  return true;
}