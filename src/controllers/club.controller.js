import * as clubService from "../services/club.service.js";
import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";

export async function getAllClubs(req, res) {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 12,
      status: req.query.status,
      search: req.query.search,
    };

    const userId = req.user?.id;
    const userRole = req.user?.role;

    const result = await clubService.getAllClubs(filters, userId, userRole);

    return sendPaginatedResponse(
      res,
      200,
      "Clubs retrieved successfully",
      result.clubs,
      {
        currentPage: result.page,
        totalPages: Math.ceil(result.total / result.limit),
        totalItems: result.total,
        itemsPerPage: result.limit,
      },
    );
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve clubs",
    );
  }
}


export async function getClubById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const club = await clubService.getClubById(id, userId, userRole);

    return sendSuccess(res, 200, "Club retrieved successfully", club);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve club",
    );
  }
}

export async function getMyClub(req, res) {
  try {
    const coachId = req.user.id;

    const club = await clubService.getClubByCoachId(coachId);

    if (!club) {
      return sendSuccess(res, 200, "No club found for this coach", null);
    }

    return sendSuccess(res, 200, "Club retrieved successfully", club);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve club",
    );
  }
}

export async function createClub(req, res) {
  try {
    const coachId = req.user.id;
    const clubData = {
      name: req.body.name,
      description: req.body.description,
      image: req.body.image, // Set by upload middleware
      ownerName: req.body.ownerName,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      fullAddress: req.body.fullAddress,
      website: req.body.website,
      groundName: req.body.groundName,
      groundType: req.body.groundType,
      activePlayers: parseInt(req.body.activePlayers) || 0,
      coachesCount: parseInt(req.body.coachesCount) || 0,
      teamsCount: parseInt(req.body.teamsCount) || 0,
      hostingSessions: parseInt(req.body.hostingSessions) || 0,
      status: req.body.status || "ACTIVE",
    };

    const club = await clubService.createClub(clubData, coachId);

    return sendSuccess(res, 201, "Club created successfully", club);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to create club",
    );
  }
}

export async function updateClub(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const updateData = {};

    // Only include fields that are provided
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.image !== undefined) updateData.image = req.body.image;
    if (req.body.ownerName !== undefined)
      updateData.ownerName = req.body.ownerName;
    if (req.body.contactEmail !== undefined)
      updateData.contactEmail = req.body.contactEmail;
    if (req.body.contactPhone !== undefined)
      updateData.contactPhone = req.body.contactPhone;
    if (req.body.fullAddress !== undefined)
      updateData.fullAddress = req.body.fullAddress;
    if (req.body.website !== undefined) updateData.website = req.body.website;
    if (req.body.groundName !== undefined)
      updateData.groundName = req.body.groundName;
    if (req.body.groundType !== undefined)
      updateData.groundType = req.body.groundType;
    if (req.body.activePlayers !== undefined)
      updateData.activePlayers = parseInt(req.body.activePlayers);
    if (req.body.coachesCount !== undefined)
      updateData.coachesCount = parseInt(req.body.coachesCount);
    if (req.body.teamsCount !== undefined)
      updateData.teamsCount = parseInt(req.body.teamsCount);
    if (req.body.hostingSessions !== undefined)
      updateData.hostingSessions = parseInt(req.body.hostingSessions);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const club = await clubService.updateClub(id, updateData, userId, userRole);

    return sendSuccess(res, 200, "Club updated successfully", club);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to update club",
    );
  }
}

export async function deleteClub(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await clubService.deleteClub(id, userId, userRole);

    return sendSuccess(res, 200, "Club deleted successfully", null);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to delete club",
    );
  }
}

export async function updateClubStats(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify authorization first
    const club = await clubService.getClubById(id, userId, userRole);

    if (userRole !== "ADMIN" && club.coachId !== userId) {
      return sendError(res, 403, "Not authorized to update this club");
    }

    const statsData = {
      activePlayers:
        req.body.activePlayers !== undefined
          ? parseInt(req.body.activePlayers)
          : undefined,
      coachesCount:
        req.body.coachesCount !== undefined
          ? parseInt(req.body.coachesCount)
          : undefined,
      teamsCount:
        req.body.teamsCount !== undefined
          ? parseInt(req.body.teamsCount)
          : undefined,
      hostingSessions:
        req.body.hostingSessions !== undefined
          ? parseInt(req.body.hostingSessions)
          : undefined,
    };

    const updatedClub = await clubService.updateClubStats(id, statsData);

    return sendSuccess(
      res,
      200,
      "Club statistics updated successfully",
      updatedClub,
    );
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to update club statistics",
    );
  }
}
