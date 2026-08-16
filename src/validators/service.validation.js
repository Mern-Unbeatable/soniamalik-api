import { z } from "zod";

const optionalString = z.preprocess(
  (val) => {
    if (val === null || val === "") return undefined;
    return val;
  },
  z.string().optional()
);

const optionalStringArray = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;

    // If already array, clean it
    if (Array.isArray(val)) {
      const cleaned = val.filter(item => item && item.trim().length > 0);
      return cleaned.length > 0 ? cleaned : undefined;
    }

    // If string, try to parse JSON or split by comma
    if (typeof val === 'string') {
      // Check if it's a JSON string
      if (val.startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(item => item && item.trim().length > 0);
            return cleaned.length > 0 ? cleaned : undefined;
          }
        } catch (e) {
          // Not valid JSON, fall through to comma split
        }
      }

      // Split by comma
      const cleaned = val
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      return cleaned.length > 0 ? cleaned : undefined;
    }

    return undefined;
  },
  z.array(z.string()).optional()
);

const optionalBoolean = z.preprocess(
  (val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === null || val === "") return undefined;
    return val;
  },
  z.boolean().optional()
);

const optionalNumber = z.preprocess(
  (val) => {
    if (val === null || val === "" || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().optional()
);

const bookingLinkSchema = z.preprocess(
  (val) => {
    if (val === null || val === "" || val === undefined) return undefined;

    // Handle array case
    if (Array.isArray(val)) {
      // If empty array, return undefined
      if (val.length === 0) return undefined;
      // Take first element if it's a string
      if (typeof val[0] === 'string') {
        return val[0].trim();
      }
      return undefined;
    }

    return typeof val === 'string' ? val.trim() : undefined;
  },
  z.string().optional()
);
const responseTypeEnum = z.enum([
  "INTERESTED",
  "REGISTER",
]);
export const createServiceSchema = z.object({
  listingHeadline: optionalString,
  aboutService: optionalString,

  providerName: optionalString,
  contactName: optionalString,
  providerPhone: optionalString,
  costMemebershipDetail: optionalString,
  providerEmail: z.string().email().optional(),
  responseType: responseTypeEnum.optional(),
  providerType: optionalStringArray,
  whoCanTakePart: z.string({ required_error: 'Who can take part is required' }),
  startTime: z.string({ required_error: ' Start time is requied' }),
  endTime: z.string({ required_error: 'End time is required' }),
  clinicName: optionalString,
  addressLine1: optionalString,
  city: optionalString,
  postcode: optionalString,
  location: optionalString,
  googleMapLink: optionalString,
  fullAddress: optionalString,
  sports: optionalStringArray,
  isOnline: optionalBoolean,

  professionalRegistration: optionalString,
  insuranceInPlace: optionalBoolean,

  participantResponseType: z
    .enum([
      "BY_DEFAULT",
      "ADD_BOOKING_LINK",
      "ALLOW_REGISTER_INTEREST",
    ])
    .optional(),

  bookingLink: bookingLinkSchema,

  logo: optionalString,

  duration: optionalNumber,
  visibility: optionalString,
  availableDays: optionalStringArray,

  organizationName: optionalString,
  role: optionalString,
  description: optionalString,
  sessionTypes: optionalStringArray,
  suitableFor: optionalStringArray,
  womenOnly: optionalBoolean,

  sessonDay: optionalString,
  date: optionalString,
  timeSlote: optionalString,
});

export const updateServiceSchema = createServiceSchema.partial();
export const updateBookingStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "UPCOMING",
  ]),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  parentId: z.string().uuid("Invalid parent message ID").optional().nullable(),
});

export const banServiceSchema = z.object({
  reason: z.string().min(1, "Ban reason is required").trim(),
});

export const rejectServiceSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").trim(),
});