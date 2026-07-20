import prisma from '../config/database.js';

/**
 * Get all products with pagination and filters
 */
export async function getAllProducts(filters) {
    const { page = 1, limit = 8000, category, status, search } = filters;

    const where = {};

    if (category) {
        where.category = category;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
    ]);

    return { products, total, page: parseInt(page), limit: parseInt(limit) };
}

/**
 * Get product by ID
 */
export async function getProductById(productId) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    return product;
}

/**
 * Create new product
 */
export async function createProduct(productData, sellerId) {
    const product = await prisma.product.create({
        data: {
            ...productData,
            sellerId,
        },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return product;
}

/**
 * Update product
 */
export async function updateProduct(productId, updateData, userId, userRole) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    if (userRole !== 'ADMIN' && product.sellerId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to update this product' };
    }

    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return updatedProduct;
}

/**
 * Delete product
 */
export async function deleteProduct(productId, userId, userRole) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw { statusCode: 404, message: 'Product not found' };
    }

    if (userRole !== 'ADMIN' && product.sellerId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to delete this product' };
    }

    await prisma.product.delete({
        where: { id: productId },
    });

    return true;
}

/**
 * Approve product (Admin only)
 */
export async function approveProduct(productId) {
    const product = await prisma.product.update({
        where: { id: productId },
        data: {
            isApproved: true,
            status: 'AVAILABLE',
        },
    });

    return product;
}

/**
 * Update product stock
 */
export async function updateProductStock(productId, quantity) {
    const product = await prisma.product.update({
        where: { id: productId },
        data: {
            stock: {
                increment: quantity,
            },
        },
    });

    return product;
}
