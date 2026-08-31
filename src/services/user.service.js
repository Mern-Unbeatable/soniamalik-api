import prisma from "../config/database.js";
import PrismaQueryBuilder from "../shared/query-builder.js";
import { hashPassword } from "../utils/password.js";

/**
 * Get all users with pagination and filters
 */
export const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  avatar: true,
  phone: true,
  bio: true,
  address: true,
  billingAddress: true,
  shippingAddress: true,
  isEmailVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,

  firstName: true,
  lastName: true,
  displayName: true,
  postcode: true,

  organizationName: true,
  sessionType: true,
  sportsOffered: true,

  serviceTypes: true,
  aboutOrganization: true,

  sportsInterests: true,
};

export async function getAllUsers(query) {
  const qb = new PrismaQueryBuilder(prisma.user, query, {
    searchableFields: ["name", "email", "displayName"],

    defaultSort: { createdAt: "desc" },
    defaultLimit: 20,
    maxLimit: 100,

    populateRelations: {},

    // ⚠️ IMPORTANT: disable omit usage in builder layer for this service
    omitFields: {},
  });

  const result = await qb
    .search()
    .filter()
    .sort()
    .paginate()
    .build();

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: result.where,
      orderBy: result.orderBy,
      skip: result.skip,
      take: result.take,
      select: safeUserSelect, // ✅ ONLY THIS controls fields
    }),

    prisma.user.count({
      where: result.where,
    }),
  ]);

  return {
    users,
    total,
    page: qb._page || 1,
    limit: qb._take || 20,
  };
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      // Basic info
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      avatar: true,
      phone: true,
      bio: true,
      address: true,
      billingAddress: true,
      shippingAddress: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,

      // Name fields
      firstName: true,
      lastName: true,
      displayName: true,
      postcode: true,

      // Sport Provider (COACH) fields
      organizationName: true,
      sessionType: true,
      sportsOffered: true,

      // Service Provider (PROVIDER) fields
      serviceTypes: true,
      aboutOrganization: true,

      // Regular User fields
      sportsInterests: true,

      // ALL RELATIONS
      events: {
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to prevent overload
      },
      products: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      },
      threads: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      threadReplies: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      recruitments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      services: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      eventRegistrations: {
        orderBy: { registeredAt: 'desc' },
        take: 50,
        include: {
          event: true
        }
      },
      serviceBookings: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          service: true
        }
      },
      news: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      club: true,
      communityPosts: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      postLikes: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          post: true
        }
      },
      postComments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          post: true
        }
      },

      serviceMessages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      eventMessages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      // Counts for relations (to avoid loading too much data)
      _count: {
        select: {
          events: true,
          products: true,
          orders: true,
          threads: true,
          threadReplies: true,
          recruitments: true,
          services: true,
          eventRegistrations: true,
          serviceBookings: true,
          news: true,
          communityPosts: true,
          postLikes: true,
          postComments: true,
          serviceMessages: true,
          eventMessages: true,
        }
      }
    },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return user;
}

export async function updateUser(userId, updateData) {
  const {
    name,
    phone,
    bio,
    address,
    avatar,
    password,
    image,
    postcode,
    organizationName,
    organisationName,
    providerBusinessName,
    aboutOrganization,
    sessionType,
    sportsOffered,
    serviceTypes,
  } = updateData;

  const data = {};
  const orgName = organizationName ?? organisationName ?? providerBusinessName ?? null;

  if (name) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (bio !== undefined) data.bio = bio;
  if (address !== undefined) data.address = address;
  if (postcode !== undefined) data.postcode = postcode;
  if (avatar) data.avatar = avatar;
  if (image) data.avatar = image;

  if (orgName !== null && orgName !== undefined) {
    data.organizationName = orgName;
  }

  if (aboutOrganization !== undefined) {
    data.aboutOrganization = aboutOrganization;
  }

  if (sessionType !== undefined) {
    data.sessionType = sessionType;
  }

  if (sportsOffered !== undefined) {
    data.sportsOffered = sportsOffered;
  }

  if (serviceTypes !== undefined) {
    data.serviceTypes = serviceTypes;
  }

  if (password) {
    data.password = await hashPassword(password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      avatar: true,
      phone: true,
      bio: true,
      address: true,
      postcode: true,
      organizationName: true,
      aboutOrganization: true,
      sessionType: true,
      sportsOffered: true,
      serviceTypes: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function deleteUser(userId) {
  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
}

export function canAccessUser(requestingUser, targetUserId) {
  return requestingUser.role === "ADMIN" || requestingUser.id === targetUserId;
}

export async function updateBillingAddress(userId, addressData) {
  const {
    firstName,
    lastName,
    companyName,
    address,
    regionState,
    city,
    zipCode,
    email,
    phoneNumber,
  } = addressData;

  const billingAddress = {
    firstName,
    lastName,
    companyName: companyName || null,
    address,
    regionState,
    city,
    zipCode,
    email,
    phoneNumber,
  };

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      billingAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      billingAddress: true,
    },
  });

  return user;
}

export async function updateShippingAddress(userId, addressData) {
  const {
    firstName,
    lastName,
    companyName,
    address,
    regionState,
    city,
    zipCode,
    email,
    phoneNumber,
  } = addressData;

  const shippingAddress = {
    firstName,
    lastName,
    companyName: companyName || null,
    address,
    regionState,
    city,
    zipCode,
    email,
    phoneNumber,
  };

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      shippingAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      shippingAddress: true,
    },
  });

  return user;
}

// In services/user.service.js

/**
 * Get user's comments with replies (paginated)
 */
export async function getUserCommentsWithReplies(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: {
        authorId: userId,
        parentId: null  // Top-level comments only
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    }),
    prisma.postComment.count({
      where: {
        authorId: userId,
        parentId: null
      }
    })
  ]);

  return {
    comments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get all replies by a user (all replies regardless of parent)
 */
export async function getUserRepliesWithContext(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    prisma.postComment.findMany({
      where: {
        authorId: userId,
        parentId: { not: null }  // Only replies
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              }
            }
          }
        },
        post: {
          select: {
            id: true,
            title: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          }
        }
      }
    }),
    prisma.postComment.count({
      where: {
        authorId: userId,
        parentId: { not: null }
      }
    })
  ]);

  return {
    replies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}