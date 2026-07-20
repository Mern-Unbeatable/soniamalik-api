import * as contactService from "../services/contact.service.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import { catchAsync } from "../shared/catch-async.js";

export const createContact = catchAsync(async (req, res) => {
    const contact = await contactService.createContact(req.body);
    return sendSuccess(res, 201, "Contact message sent successfully", contact);
});


export const deleteContact = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await contactService.deleteContact(id);
    return sendSuccess(res, 200, result.message, null);
});

export const getAllContacts = catchAsync(async (req, res) => {
    const result = await contactService.getAllContacts(req.query);
    return sendPaginatedResponse(
        res,
        result.contacts,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
    );
});