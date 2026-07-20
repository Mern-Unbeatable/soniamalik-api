import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";
import * as adminService from "../services/admin.service.js";

export async function suspendUser(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim() === "") {
      return sendError(res, 400, "Suspension reason is required");
    }

    const user = await adminService.suspendUser(id, reason.trim(), adminId);
    return sendSuccess(res, 200, "User suspended successfully", { user });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function unsuspendUser(req, res) {
  try {
    const { id } = req.params;

    const user = await adminService.unsuspendUser(id);
    return sendSuccess(res, 200, "User unsuspended successfully", { user });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getSuspendedUsers(req, res) {
  try {
    const { users, total, page, limit, totalPages } =
      await adminService.getSuspendedUsers(req.query);
    return sendPaginatedResponse(res, users, page, limit, total);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getDashboardStats(req, res) {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, 200, "Dashboard stats retrieved successfully", stats);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}
export async function getUserTrends(req, res) {
  try {
    const { period = "year" } = req.query;
    const data = await adminService.getUserTrends(period);
    return sendSuccess(res, 200, "User trends retrieved successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getDemandVsSupply(req, res) {
  try {
    const data = await adminService.getDemandVsSupply();
    return sendSuccess(res, 200, "Demand vs supply data retrieved successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getHighDemandAlerts(req, res) {
  try {
    const alerts = await adminService.getHighDemandAlerts();
    return sendSuccess(res, 200, "High demand alerts retrieved successfully", alerts);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getTopLocationsByDemand(req, res) {
  try {
    const { limit = 10 } = req.query;
    const locations = await adminService.getTopLocationsByDemand(parseInt(limit));
    return sendSuccess(res, 200, "Top locations retrieved successfully", locations);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function exportDashboardData(req, res) {
  try {
    const csvData = await adminService.exportDashboardData();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=dashboard-export-${new Date().toISOString().split("T")[0]}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getConversionFunnel(req, res) {
  try {
    const data = await adminService.getConversionFunnel();
    return sendSuccess(res, 200, "Conversion funnel data retrieved successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getContactMetadata(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const result = await adminService.getContactMetadata({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });

    return sendSuccess(res, 200, "Contact metadata retrieved successfully", result);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getRegisterInterests(req, res) {
  try {
    const { page = 1, limit = 20, status, search, sport } = req.query;

    const result = await adminService.getRegisterInterests({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
      sport
    });

    return sendSuccess(res, 200, "Register interests retrieved successfully", result);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}