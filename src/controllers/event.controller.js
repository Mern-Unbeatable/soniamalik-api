import prisma from "../config/database.js";
import * as eventService from "../services/event.service.js";
import * as eventMessageService from "../services/eventMessage.service.js";
import { catchAsync } from "../shared/catch-async.js";
import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";


export async function getAllEvents(req, res) {
  try {
    const filters = { ...req.query };

    // Backward compatibility for older clients.
    if (!filters.view && filters.viewType) {
      filters.view = filters.viewType;
    }

    const userRole = req.user?.role || null;
    const userId = req.user?.id || null;
    const result = await eventService.getAllEvents(filters, userRole, userId);

    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}



export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const userRole = req.user?.role || null;

    const event = await eventService.getEventById(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: "Event retrieved successfully",
      data: event,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export const createEvent = catchAsync(async (req, res) => {
  console.log('request user check this', req.body)
  console.log('request user check this', req.user)
  const eventData = {
    ...req.body,
    postCode: req.body.postCode,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    minAge: req.body.minAge ? Number(req.body.minAge) : null,
    maxParticipants: req.body.maxParticipants ? Number(req.body.maxParticipants) : null,
    registrationFee: req.body.registrationFee ? Number(req.body.registrationFee) : 0,
    image: req.body.image || null,
    organizerName: req.user.name,
    organizerPhone: req.user.phone,
    organizerEmail: req.user.email,
    responseType: req.body.responseType || "INTERESTED",
  };

  const event = await eventService.createEvent(eventData, req.user.id);

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    data: event,
  });
});

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const updateData = {};

    const allowedFields = [
      "title",
      "sportType",
      "description",
      "eventType",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "venueName",
      "city",
      "fullAddress",
      "googleMapLink",
      "minAge",
      "maxParticipants",
      "skillLevel",
      "registrationFee",
      "organizerName",
      "organizerPhone",
      "organizerEmail",
      "image",
      "responseType",
      "postCode"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          updateData[field] = new Date(req.body[field]);
        } else if (field === "minAge" || field === "maxParticipants") {
          updateData[field] = req.body[field]
            ? parseInt(req.body[field])
            : null;
        } else if (field === "registrationFee") {
          updateData[field] = parseFloat(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Validate dates if both are being updated or one is being changed
    if (updateData.startDate || updateData.endDate) {
      const currentEvent = await eventService.getEventById(
        id,
        req.user.id,
        req.user.role,
      );

      const finalStartDate =
        updateData.startDate || new Date(currentEvent.startDate);
      const finalEndDate = updateData.endDate || new Date(currentEvent.endDate);

      if (finalEndDate < finalStartDate) {
        return res.status(400).json({
          success: false,
          message: "End date cannot be before start date",
        });
      }

      const now = new Date();
      const endDateTime = new Date(finalEndDate);
      const finalEndTime = updateData.endTime || currentEvent.endTime;

      if (finalEndTime) {
        const timeParts = finalEndTime.split(":");
        endDateTime.setHours(
          parseInt(timeParts[0]) || 23,
          parseInt(timeParts[1]) || 59,
          parseInt(timeParts[2]) || 59,
        );
      } else {
        endDateTime.setHours(23, 59, 59);
      }

      if (endDateTime < now) {
        return res.status(400).json({
          success: false,
          message: "Cannot update event with end date in the past",
        });
      }
    }

    const updatedEvent = await eventService.updateEvent(
      id,
      updateData,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    await eventService.deleteEvent(id, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function updateApprovalStatus(req, res) {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be either "approve" or "reject"',
      });
    }

    let updatedEvent;
    if (action === "approve") {
      updatedEvent = await eventService.approveEvent(id);
    } else {
      updatedEvent = await eventService.rejectEvent(id, rejectionReason);
    }

    res.status(200).json({
      success: true,
      message: `Event ${action}d successfully`,
      data: updatedEvent,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function registerForEvent(req, res) {
  try {
    const { id } = req.params;

    const registrationData = {
      userId: req.user?.id || null,
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      notes: req.body.notes || null,
    };

    const registration = await eventService.registerForEvent(
      id,
      registrationData,
    );

    res.status(201).json({
      success: true,
      message: "Successfully registered for event",
      data: registration,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function registerInterest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interest = await eventService.registerInterest(id, userId);

    res.status(201).json({
      success: true,
      message: "Interest registered successfully. The event organizer will contact you.",
      data: interest,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getEventRegistrations(req, res) {
  try {
    const { id } = req.params;

    const registrations = await eventService.getEventRegistrations(
      id,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Event registrations retrieved successfully",
      data: registrations,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function updateRegistrationStatus(req, res) {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;

    const updatedRegistration = await eventService.updateRegistrationStatus(
      registrationId,
      status,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Registration status updated successfully",
      data: updatedRegistration,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getEventInterests(req, res) {
  try {
    const { id } = req.params;

    const interests = await eventService.getEventInterests(
      id,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Event interests retrieved successfully",
      data: interests,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getEventAnalytics(req, res) {
  try {
    const filters = {
      eventId: req.query.eventId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const analytics = await eventService.getEventAnalytics(filters);

    res.status(200).json({
      success: true,
      message: "Event analytics retrieved successfully",
      data: analytics,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getOrganizerDashboard(req, res) {
  try {
    const dashboard = await eventService.getOrganizerDashboard(req.user.id);

    res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function getOrganizerEvents(req, res) {
  try {
    const filters = { ...req.query };

    // Backward compatibility for older clients.
    if (!filters.view && filters.viewType) {
      filters.view = filters.viewType;
    }

    const result = await eventService.getEventsByOrganizer(
      req.user.id,
      filters,
    );

    res.status(200).json({
      success: true,
      message: "Organizer events retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


// ==================== ADMIN MANAGEMENT CONTROLLERS ====================


export async function toggleFeatureStatus(req, res) {
  try {
    const { id } = req.params;

    const updatedEvent = await eventService.toggleFeatureEvent(id, req.user.id);

    const action = updatedEvent.isFeatured ? "featured" : "unfeatured";

    res.status(200).json({
      success: true,
      message: `Event ${action} successfully`,
      data: updatedEvent,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function toggleBanStatus(req, res) {
  try {
    const { id } = req.params;
    const { bannedReason } = req.body;

    const updatedEvent = await eventService.toggleBanEvent(
      id,
      bannedReason,
      req.user.id,
    );

    const action = updatedEvent.status === "BANNED" ? "banned" : "unbanned";

    res.status(200).json({
      success: true,
      message: `Event ${action} successfully`,
      data: updatedEvent,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}



// ==================== EVENT MESSAGING CONTROLLERS ====================


export const postEventMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, parentId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const eventMessage = await eventMessageService.postEventMessage(
      id,
      req.user.id,
      message,
      parentId || null
    );

    res.status(201).json({
      success: true,
      message: parentId ? "Reply posted successfully" : "Question posted successfully",
      data: eventMessage,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * Get all messages for an event (questions with replies)
 */
export const getEventMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await eventMessageService.getEventMessages(
      id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Event messages retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};


export const getAllEventMessages = async (req, res) => {
  try {
    const { page, limit, search, eventId } = req.query;

    const result = await eventMessageService.getAllEventMessages(
      req.user.id,
      req.user.role,
      { page, limit, search, eventId }
    );

    res.status(200).json({
      success: true,
      message: "Event messages retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};
/**
 * Get event messages for user dashboard
 * Shows messages from events the user is registered for or interested in
 */
export const getUserDashboardMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user.id;

    const result = await eventMessageService.getUserDashboardMessages(
      userId,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      message: "Dashboard messages retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const getEventMessageWithThread = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await eventMessageService.getEventMessageWithThread(
      messageId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Message retrieved successfully",
      data: message,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * Delete a message
 */
export const deleteEventMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await eventMessageService.deleteEventMessage(
      messageId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * Get user's interested events
 */
export async function getUserInterestedEvents(req, res) {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      eventStatus: req.query.eventStatus,
      eventType: req.query.eventType,
      sortOrder: req.query.sortOrder,
    };

    const result = await eventService.getUserInterestedEvents(userId, filters);

    res.status(200).json({
      success: true,
      message: "User's interested events retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


export async function getUserRegisteredEvents(req, res) {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      registrationStatus: req.query.registrationStatus,
      eventStatus: req.query.eventStatus,
      eventType: req.query.eventType,
      sortOrder: req.query.sortOrder,
    };

    const result = await eventService.getUserRegisteredEvents(userId, filters);

    res.status(200).json({
      success: true,
      message: "User's registered events retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}



export async function getUserSavedEvents(req, res) {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await eventService.getUserSavedEvents(userId, filters);

    res.status(200).json({
      success: true,
      message: "Saved events retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

// Toggle save 
export async function toggleSaveEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const isSaved = await eventService.isEventSavedByUser(id, userId);

    if (isSaved) {
      const result = await eventService.unsaveEvent(id, userId);
      res.status(200).json({
        success: true,
        message: result.message,
        isSaved: false,
      });
    } else {
      const savedEvent = await eventService.saveEvent(id, userId);
      res.status(200).json({
        success: true,
        message: "Event saved successfully",
        isSaved: true,
        data: savedEvent,
      });
    }
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}


// Get single saved event by saved event ID
export async function getSavedEventById(req, res) {
  try {
    const { savedEventId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const savedEvent = await eventService.getSavedEventById(
      savedEventId,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      message: "Saved event retrieved successfully",
      data: savedEvent,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

