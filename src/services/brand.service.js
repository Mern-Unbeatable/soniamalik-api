import prisma from "../config/database.js";

export async function createBrand(data) {
  const {
    name,
    email,
    phone,
    postCode,
    businessname,
    offer,
    socialMediaLinks,
    message
  } = data;

  // Check if email already exists
  const existingEmail = await prisma.brand.findFirst({
    where: { email }
  });

  if (existingEmail) {
    throw { statusCode: 409, message: "Email already registered" };
  }

  // Check if business name already exists
  const existingBusiness = await prisma.brand.findFirst({
    where: { businessname }
  });

  if (existingBusiness) {
    throw { statusCode: 409, message: "Business name already exists" };
  }

  const brand = await prisma.brand.create({
    data: {
      name,
      email,
      phone,
      postCode,
      businessname,
      offer,
      socialMediaLinks,
      message
    }
  });

  return brand;
}

export async function getBrandById(brandId) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId }
  });

  if (!brand) {
    throw { statusCode: 404, message: "Brand not found" };
  }

  return brand;
}

export async function updateBrand(brandId, updateData) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId }
  });

  if (!brand) {
    throw { statusCode: 404, message: "Brand not found" };
  }

  const updatedBrand = await prisma.brand.update({
    where: { id: brandId },
    data: updateData
  });

  return updatedBrand;
}

export async function deleteBrand(brandId) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId }
  });

  if (!brand) {
    throw { statusCode: 404, message: "Brand not found" };
  }

  await prisma.brand.delete({
    where: { id: brandId }
  });

  return { success: true, message: "Brand deleted successfully" };
}

export async function getAllBrands(filters = {}) {
  const { page = 1, limit = 20, search } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { businessname: { contains: search, mode: "insensitive" } },
      { postCode: { contains: search, mode: "insensitive" } }
    ];
  }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip,
      take: parseInt(limit)
    }),
    prisma.brand.count({ where })
  ]);

  return {
    brands,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}