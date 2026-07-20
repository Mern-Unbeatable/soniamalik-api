import prisma from '../config/database.js';

/**
 * Get all orders with pagination and filters
 */
export async function getAllOrders(filters, userId, userRole) {
    const { page = 1, limit = 8000, status } = filters;

    const where = {};

    // Regular users can only see their own orders
    if (userRole !== 'ADMIN') {
        where.userId = userId;
    }

    if (status) {
        where.status = status;
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
    ]);

    return { orders, total, page: parseInt(page), limit: parseInt(limit) };
}


export async function getOrderById(orderId, userId, userRole) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    // Check authorization
    if (userRole !== 'ADMIN' && order.userId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to view this order' };
    }

    return order;
}


export async function createOrder(orderData, userId) {
    const { items, shippingAddress, paymentMethod, notes } = orderData;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
        });

        if (!product) {
            throw { statusCode: 404, message: `Product ${item.productId} not found` };
        }

        if (product.stock < item.quantity) {
            throw { statusCode: 400, message: `Insufficient stock for ${product.name}` };
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += Number(itemTotal);

        orderItems.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
        });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
            data: {
                orderNumber,
                userId,
                totalAmount,
                shippingAddress,
                paymentMethod,
                notes,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Update product stock
        for (const item of items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        return newOrder;
    });

    return order;
}


export async function updateOrderStatus(orderId, status, userId, userRole) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    // Only admin can update order status
    if (userRole !== 'ADMIN') {
        throw { statusCode: 403, message: 'Not authorized to update order status' };
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    return updatedOrder;
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId, userId, userRole) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    // Check authorization
    if (userRole !== 'ADMIN' && order.userId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to cancel this order' };
    }

    // Only pending orders can be cancelled
    if (order.status !== 'PENDING') {
        throw { statusCode: 400, message: 'Only pending orders can be cancelled' };
    }

    // Update order and restore stock
    const cancelledOrder = await prisma.$transaction(async (tx) => {
        // Update order status
        const updated = await tx.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });

        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                },
            });
        }

        return updated;
    });

    return cancelledOrder;
}
