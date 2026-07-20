import * as inquiryService from "../services/inquiry.service.js";
import { sendSuccess, sendError } from "../utils/response.js";


export const getAllInquiries = async (req, res) => {
  try {
    const { page, limit, search, type, status } = req.query;
    
    const result = await inquiryService.getAllInquiries(
      req.user.id,
      req.user.role,
      { page, limit, search, type, status }
    );

    res.status(200).json({
      success: true,
      message: "Inquiries retrieved successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};


export const getInquiryById = async (req, res) => {
  try {
    const { inquiryId, type } = req.params;
    
    const inquiry = await inquiryService.getInquiryById(
      inquiryId,
      type,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Inquiry retrieved successfully",
      data: inquiry,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};



