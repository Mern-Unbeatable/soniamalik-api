import { z } from "zod";

const optionalString = z.preprocess(
  (val) => {
    if (val === null || val === "") return undefined;
    return val;
  },
  z.string().optional()
);
const jsonSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema)
  ])
);

const optionalStringArray = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;

    if (Array.isArray(val)) {
      const cleaned = val.filter(item => item && item.trim().length > 0);
      return cleaned.length > 0 ? cleaned : undefined;
    }

    if (typeof val === 'string') {
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

const eventTypeEnum = z.enum([
  "MATCH",
  "TOURNAMENT",
  "TRIAL",
  "TRAINING",
  "WORKSHOP",
  "SEMINAR",
  "COMPETITION",
  "MEETUP",
]);

const responseTypeEnum = z.enum([
  "INTERESTED",
  "REGISTER",
]);

function parseDateInput(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

// Enhanced parseTimeString with full support for both formats
export function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const clean = timeStr.trim().toLowerCase();

  // Handle 12-hour format with AM/PM (e.g., "2:30 PM", "2 PM", "02:30pm", "8:30:15 AM")
  const twelveHourMatch = clean.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/);
  if (twelveHourMatch) {
    let hour = parseInt(twelveHourMatch[1], 10);
    const minute = parseInt(twelveHourMatch[2] || '0', 10);
    const second = parseInt(twelveHourMatch[3] || '0', 10);
    const meridiem = twelveHourMatch[4];

    if (isNaN(hour) || isNaN(minute) || isNaN(second)) {
      return null;
    }

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      return null;
    }

    // Convert 12-hour to 24-hour
    if (meridiem === 'am') {
      if (hour === 12) hour = 0;
    } else { // pm
      if (hour !== 12) hour += 12;
    }

    return { hour, minute, second };
  }

  // Handle 24-hour format (e.g., "14:30", "14:30:15", "8:32")
  const twentyFourMatch = clean.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
  if (twentyFourMatch) {
    const hour = parseInt(twentyFourMatch[1], 10);
    const minute = parseInt(twentyFourMatch[2] || '0', 10);
    const second = parseInt(twentyFourMatch[3] || '0', 10);

    if (isNaN(hour) || isNaN(minute) || isNaN(second)) {
      return null;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      return null;
    }

    return { hour, minute, second };
  }

  return null;
}

function combineDateAndTime(dateValue, timeValue, fallbackToEndOfDay = false) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return null;
  }

  const parsedTime = parseTimeString(timeValue);

  if (parsedTime) {
    return new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      parsedTime.hour,
      parsedTime.minute,
      parsedTime.second || 0,
      0
    );
  }

  if (fallbackToEndOfDay) {
    return new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      23,
      59,
      59,
      999
    );
  }

  return new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
    0,
    0,
    0,
    0
  );
}

// Custom time validation with AM/PM support
const timeStringSchema = z.string().refine(
  (val) => {
    if (!val) return false;
    return parseTimeString(val) !== null;
  },
  {
    message: "Invalid time format. Use HH:MM or HH:MM:SS (24-hour) or HH:MM AM/PM (12-hour)",
  }
);

// Custom date validation for past dates
const dateNotInPast = z.date().refine(
  (date) => {
    const now = new Date();
    const dateAtMidnight = new Date(date);
    dateAtMidnight.setHours(0, 0, 0, 0);
    const nowAtMidnight = new Date(now);
    nowAtMidnight.setHours(0, 0, 0, 0);

    return dateAtMidnight >= nowAtMidnight;
  },
  {
    message: "Date cannot be in the past",
  }
);


export const createEventSchema = z
  .object({
    title: z
      .string({
        required_error: "Title is required",
      })
      .min(2, "Title must be at least 2 characters"),

    sportType: z
      .string({
        required_error: "Sport type is required",
      })
      .optional(),

    description: z.string().optional(),

    eventType: eventTypeEnum,

    startDate: z.preprocess(
      (val) => {
        return parseDateInput(val);
      },
      dateNotInPast
    ),

    endDate: z.preprocess(
      (val) => {
        return parseDateInput(val);
      },
      dateNotInPast
    ),

    startTime: timeStringSchema,
    endTime: timeStringSchema,

    responseType: responseTypeEnum.optional(),

    venueName: z
      .string({
        required_error: "Venue name is required",
      })
      .min(2, "Venue name must be at least 2 characters"),
    postCode: z
      .string().optional(),
    city: z
      .string({
        required_error: "City is required",
      })
      .min(2, "City must be at least 2 characters"),

    bookingLink: z.string().optional(),

    fullAddress: z.string().optional(),

    googleMapLink: z
      .string()
      .url("Invalid Google map link")
      .optional()
      .or(z.literal("")),

    minAge: optionalNumber
      .refine(
        (val) => val === undefined || (val >= 0 && val <= 100),
        {
          message: "Min age must be between 0 and 100",
        }
      ),

    maxParticipants: optionalNumber
      .refine(
        (val) => val === undefined || val > 0,
        {
          message: "Max participants must be greater than 0",
        }
      ),

    skillLevel: jsonSchema.optional(),
    registrationFee: z.preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      },
      z.number().min(0, "Registration fee cannot be negative")
    ),

    costType: z.enum(["free", "paid"]).optional(),

    image: z.string().optional(),

    currentParticipants: optionalNumber,
    responseMethods: z.array(z.string()).optional(),
    suitableFor: z.array(z.string()).optional(),
  })

  // Cross-field validation: End date must be after or equal to start date
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      return endUTC >= startUTC;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  )

  // Cross-field validation: If same day, end time must be after start time
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      if (startUTC === endUTC) {
        const startTime = parseTimeString(data.startTime);
        const endTime = parseTimeString(data.endTime);

        if (!startTime || !endTime) return true;

        const startMinutes = startTime.hour * 60 + startTime.minute;
        const endMinutes = endTime.hour * 60 + endTime.minute;

        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: "End time must be after start time when dates are the same",
      path: ["endTime"],
    }
  )

  // Cross-field validation: Event cannot be in the past
  .refine(
    (data) => {
      const endDateTime = combineDateAndTime(data.endDate, data.endTime, true);
      if (!endDateTime) return true;

      return endDateTime > new Date();
    },
    {
      message: "Cannot create event in the past",
      path: ["endDate"],
    }
  );

// Update Event Schema (All fields optional for partial updates)
export const updateEventSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters").optional(),

    sportType: z.string().optional(),

    description: z.string().optional(),

    eventType: eventTypeEnum.optional(),

    startDate: z.preprocess(
      (val) => {
        return parseDateInput(val);
      },
      z.date().optional()
    ),

    endDate: z.preprocess(
      (val) => {
        return parseDateInput(val);
      },
      z.date().optional()
    ),

    startTime: timeStringSchema.optional(),
    endTime: timeStringSchema.optional(),

    responseType: responseTypeEnum.optional(),

    venueName: z.string().min(2, "Venue name must be at least 2 characters").optional(),
    postCode: z
      .string().optional()
    ,
    city: z.string().min(2, "City must be at least 2 characters").optional(),

    bookingLink: z.string().optional(),

    fullAddress: z.string().optional(),

    googleMapLink: z
      .string()
      .url("Invalid Google map link")
      .optional()
      .or(z.literal("")),

    minAge: optionalNumber
      .refine(
        (val) => val === undefined || (val >= 0 && val <= 100),
        {
          message: "Min age must be between 0 and 100",
        }
      ),

    maxParticipants: optionalNumber
      .refine(
        (val) => val === undefined || val > 0,
        {
          message: "Max participants must be greater than 0",
        }
      ),

    skillLevel: jsonSchema.optional(),

    registrationFee: z.preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().min(0, "Registration fee cannot be negative").optional()
    ),

    costType: z.enum(["free", "paid"]).optional(),

    image: z.string().optional(),

    currentParticipants: optionalNumber,
    responseMethods: optionalStringArray,
    suitableFor: optionalStringArray,
  })

  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;

      const startUTC = Date.UTC(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate()
      );
      const endUTC = Date.UTC(
        data.endDate.getFullYear(),
        data.endDate.getMonth(),
        data.endDate.getDate()
      );

      return endUTC >= startUTC;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  )

  // Cross-field validation: If same day and both times provided, end time must be after start time
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate || !data.startTime || !data.endTime) return true;

      const startUTC = Date.UTC(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate()
      );
      const endUTC = Date.UTC(
        data.endDate.getFullYear(),
        data.endDate.getMonth(),
        data.endDate.getDate()
      );

      if (startUTC === endUTC) {
        const startTime = parseTimeString(data.startTime);
        const endTime = parseTimeString(data.endTime);

        if (!startTime || !endTime) return true;

        const startMinutes = startTime.hour * 60 + startTime.minute;
        const endMinutes = endTime.hour * 60 + endTime.minute;

        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: "End time must be after start time when dates are the same",
      path: ["endTime"],
    }
  )
  ;