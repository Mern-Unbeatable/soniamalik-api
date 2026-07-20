import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";
import * as serviceService from "../services/service.service.js";
import { config } from "../config/index.js";
import { catchAsync } from "../shared/catch-async.js";
import * as messageService from "../services/message.service.js";


export async function getAllServices(req, res) {
  try {
    const { services, pagination } =
      await serviceService.getAllServices(req.query);
    return sendPaginatedResponse(
      res,
      services,
      pagination.currentPage,
      pagination.limit,
      pagination.total,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function getServicesByProviderRole(req, res) {
  try {
    const { services, total, page, limit } =
      await serviceService.getServicesByProviderRole(req.query);

    return sendPaginatedResponse(res, services, page, limit, total);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}
/** GET /api/services/:id — single service (guards unapproved for non-owners) */
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const shouldTrackView =
      !req.user || (req.user.role !== "ADMIN" && req.user.role !== "PROVIDER");
    const service = await serviceService.getServiceById(id, shouldTrackView);
    // if (!service.isApproved) {
    //   if (!req.user) return sendError(res, 403, "Service is pending approval");
    //   if (req.user.role !== "ADMIN" && service.providerId !== req.user.id)
    //     return sendError(res, 403, "Service is pending approval");
    // }
    return sendSuccess(res, 200, "Service retrieved successfully", { service });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** GET /api/services/provider/my — provider's own services (any status) */
export async function getProviderServices(req, res) {
  try {
    const result = await serviceService.getProviderServices(
      req.user.id,
      req.query,
    );
    return sendPaginatedResponse(
      res,
      result.services,
      result.page,
      result.limit,
      result.total,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function createService(req, res) {
  console.log('body check', req.body)


  try {
    const logoPath = req.file
      ? `${config.backendUrl}/uploads/services/${req.file.filename}`
      : null;

    const service = await serviceService.createService(
      req.body,
      req,
      logoPath,
    );
    return sendSuccess(res, 201, "Service submitted for approval", { service });
  } catch (error) {
    console.error('Create service error:', error);
    return sendError(res, error.statusCode || 500, error.message);
  }
}




export async function updateService(req, res) {
  try {
    const { id } = req.params;

    const logoPath = req.file
      ? `${config.backendUrl}/uploads/services/${req.file.filename}`
      : null;

    const service = await serviceService.updateService(
      id,
      req.body,
      req.user.id,
      req.user.role,
      logoPath
    );

    return sendSuccess(res, 200, "Service updated successfully", { service });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** DELETE /api/services/:id */
export async function deleteService(req, res) {
  try {
    await serviceService.deleteService(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return sendSuccess(res, 200, "Service deleted successfully");
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** GET /api/services/admin/all — all services for admin panel */
export async function getAdminServices(req, res) {
  try {
    const result = await serviceService.getAdminServices(req.query);
    return sendPaginatedResponse(
      res,
      result.services,
      result.page,
      result.limit,
      result.total,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** PATCH /api/services/:id/approve */
export async function approveService(req, res) {
  try {
    const service = await serviceService.approveService(req.params.id);
    return sendSuccess(res, 200, "Service approved successfully", { service });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}




/** PATCH /api/services/:id/reject — body: { reason } */
export const rejectService = catchAsync(async (req, res) => {
  const { reason } = req.body;

  const service = await serviceService.rejectService(
    req.params.id,
    reason,
    req.user.id
  );

  return sendSuccess(res, 200, "Service rejected", {
    service,
  });
});


/** PATCH /api/services/:id/feature — toggles featured status */
export async function featureService(req, res) {
  try {
    const service = await serviceService.featureService(req.params.id);
    const msg = service.isFeatured ? "Service featured" : "Service unfeatured";
    return sendSuccess(res, 200, msg, { service });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** PATCH /api/services/:id/ban — body: { reason } */
export async function banService(req, res) {
  try {
    const { reason } = req.body;

    const service = await serviceService.banService(
      req.params.id,
      reason,
      req.user.id
    );

    return sendSuccess(res, 200, "Service banned", { service });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

// ─── Booking / Interest ───────────────────────────────────────────────────────

/** POST /api/services/:id/book — one-click (USER, no body needed) */
export async function bookNow(req, res) {
  try {
    const booking = await serviceService.bookNow(req.params.id, req.user.id);
    return sendSuccess(res, 201, "Booking created successfully", { booking });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** POST /api/services/:id/interest — one-click (USER, no body needed) */
export async function registerInterest(req, res) {
  try {
    const interest = await serviceService.registerInterest(
      req.params.id,
      req.user.id,
    );
    return sendSuccess(res, 201, "Interest registered successfully", {
      interest,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/** GET /api/services/:id/bookings — PROVIDER sees name, phone, email */
export async function getServiceBookings(req, res) {
  try {
    const bookings = await serviceService.getServiceBookings(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return sendSuccess(res, 200, "Bookings retrieved successfully", {
      bookings,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


/** GET /api/services/:id/interests — PROVIDER sees name, phone, email */
export async function getServiceInterests(req, res) {
  try {
    const interests = await serviceService.getServiceInterests(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return sendSuccess(res, 200, "Interests retrieved successfully", {
      interests,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


/** PATCH /api/services/bookings/:bookingId/status */
export async function updateBookingStatus(req, res) {
  try {
    const { status } = req.body;

    const booking = await serviceService.updateBookingStatus(
      req.params.bookingId,
      status,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, "Booking status updated successfully", {
      booking,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Delete a booking (Admin or Service Owner)
 * DELETE /api/services/bookings/:bookingId
 */
export async function deleteBooking(req, res) {
  try {
    const { bookingId } = req.params;

    const result = await serviceService.deleteServiceBooking(
      bookingId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, result.message, result.deletedBooking);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Delete an interest (Admin or Service Owner)
 * DELETE /api/services/interests/:interestId
 */
export async function deleteInterest(req, res) {
  try {
    const { interestId } = req.params;

    const result = await serviceService.deleteServiceInterest(
      interestId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, result.message, result.deletedInterest);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Cancel a booking (User can cancel their own booking)
 * PATCH /api/services/bookings/:bookingId/cancel
 */
export async function cancelBooking(req, res) {
  try {
    const { bookingId } = req.params;

    const result = await serviceService.cancelBooking(
      bookingId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, result.message, result.booking);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

// ─── Analytics / Dashboard ───────────────────────────────────────────────────

export async function getServiceAnalytics(req, res) {

  console.log("Getting analytics for provider ID:", req.user.id);
  try {
    const analytics = await serviceService.getServiceAnalytics(req.user.id);
    return sendSuccess(res, 200, "Analytics retrieved successfully", {
      analytics,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getProviderDashboard(req, res) {
  try {
    const dashboard = await serviceService.getProviderDashboard(req.user.id);
    return sendSuccess(res, 200, "Dashboard retrieved successfully", {
      dashboard,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

// Legacy: keep updateApprovalStatus for backward compat (older routes)
export async function updateApprovalStatus(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (action === "approve") {
      const service = await serviceService.approveService(id);
      return sendSuccess(res, 200, "Service approved successfully", {
        service,
      });
    } else if (action === "reject") {
      const service = await serviceService.rejectService(id, reason);
      return sendSuccess(res, 200, "Service rejected", { service });
    }
    return sendError(res, 400, 'Invalid action. Use "approve" or "reject"');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


/**
 * Send a message or reply
 */
export async function sendMessage(req, res) {
  try {
    const { id } = req.params;
    const { message, parentId } = req.body;

    if (!message || !message.trim()) {
      return sendError(res, 400, "Message is required");
    }

    const result = await messageService.sendMessage(
      id,
      req.user.id,
      message,
      parentId || null
    );

    return sendSuccess(res, 201, "Message sent", { message: result });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Get all messages for a service (chat thread)
 */
export async function getServiceMessages(req, res) {
  try {
    const { id } = req.params;

    const result = await messageService.getServiceMessages(
      id,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, "Messages retrieved", result);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Get single message with thread
 */
export async function getMessageWithThread(req, res) {
  try {
    const { messageId } = req.params;

    const message = await messageService.getMessageWithThread(
      messageId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, "Message retrieved", { message });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Get user's conversations
 */
export async function getUserConversations(req, res) {
  try {
    const conversations = await messageService.getUserConversations(
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, "Conversations retrieved", { conversations });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;

    const result = await messageService.deleteMessage(
      messageId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(res, 200, result.message, null);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

/**
 * Get all messages for all services (provider/coach only sees their own)
 */
export async function getAllServiceMessages(req, res) {
  try {
    const { page, limit, search, serviceId, status } = req.query;

    const result = await messageService.getAllServiceMessages(
      req.user.id,
      req.user.role,
      { page, limit, search, serviceId, status }
    );

    return sendSuccess(res, 200, "All service messages retrieved successfully", result);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}