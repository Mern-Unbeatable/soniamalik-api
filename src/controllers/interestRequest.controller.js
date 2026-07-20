import * as interestRequestService from "../services/interestRequest.service.js";
import { sendSuccess, sendError, sendPaginatedResponse } from "../utils/response.js";
import { catchAsync } from "../shared/catch-async.js";

export const createInterestRequest = catchAsync(async (req, res) => {
    const result = await interestRequestService.createInterestRequest(
        req.user.id,
        req.body
    );
    return sendSuccess(res, 201, "Interest request submitted successfully", result);
});


export const getAllInterestRequests = catchAsync(async (req, res) => {
    const result = await interestRequestService.getAllInterestRequests(req.query);
    return sendPaginatedResponse(
        res,
        result.requests,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
    );
});


export const getInterestRequestById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await interestRequestService.getInterestRequestById(
        id,
        req.user.id,
        req.user.role
    );
    return sendSuccess(res, 200, "Interest request retrieved successfully", request);
});

export const updateRequestStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updated = await interestRequestService.updateRequestStatus(
        id,
        status,
        adminNotes
    );
    return sendSuccess(res, 200, "Request status updated successfully", updated);
});


export const deleteInterestRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await interestRequestService.deleteInterestRequest(
        id,
        req.user.id,
        req.user.role
    );
    return sendSuccess(res, 200, result.message, null);
});
