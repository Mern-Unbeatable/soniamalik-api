export const SCHEDULE_TYPES = {
  REGULAR: "REGULAR",
  FIXED_TERM: "FIXED_TERM",
};

const COURSE_FIELDS = ["scheduleType", "courseStartDate", "courseEndDate"];

function startOfDayUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Course dates are calendar days; store them as UTC midnight so they never shift by timezone. */
function toCourseDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = value instanceof Date ? value.toISOString() : String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw { statusCode: 400, message: "Invalid course date" };
  }
  return startOfDayUtc(date);
}

/**
 * Public lists: fixed-term courses stay visible up to and including their end date.
 */
export function activeCourseCondition(now = new Date()) {
  return {
    OR: [
      { scheduleType: { not: SCHEDULE_TYPES.FIXED_TERM } },
      { courseEndDate: null },
      { courseEndDate: { gte: startOfDayUtc(now) } },
    ],
  };
}

export function isCourseEnded(record, now = new Date()) {
  if (record?.scheduleType !== SCHEDULE_TYPES.FIXED_TERM || !record?.courseEndDate) return false;
  return new Date(record.courseEndDate) < startOfDayUtc(now);
}

/**
 * Normalises the schedule fields in an incoming create/update payload (mutates `data`).
 * `existing` is the record being edited, used to fill in fields the payload leaves out.
 */
export function normalizeCourseSchedule(data, existing = null) {
  const touched = COURSE_FIELDS.some((field) => data[field] !== undefined);
  if (!touched) return data;

  const scheduleType = data.scheduleType ?? existing?.scheduleType ?? SCHEDULE_TYPES.REGULAR;

  if (scheduleType !== SCHEDULE_TYPES.FIXED_TERM) {
    data.scheduleType = SCHEDULE_TYPES.REGULAR;
    data.courseStartDate = null;
    data.courseEndDate = null;
    return data;
  }

  const start = toCourseDate(
    data.courseStartDate !== undefined ? data.courseStartDate : existing?.courseStartDate
  );
  const end = toCourseDate(
    data.courseEndDate !== undefined ? data.courseEndDate : existing?.courseEndDate
  );

  if (!start || !end) {
    throw {
      statusCode: 400,
      message: "Course start date and end date are required for fixed-term courses",
    };
  }
  if (end < start) {
    throw { statusCode: 400, message: "Course end date cannot be before the start date" };
  }

  // Only a new or changed end date must be in the future; an ended course can still have other fields edited
  const existingEnd = toCourseDate(existing?.courseEndDate);
  const endChanged = !existingEnd || existingEnd.getTime() !== end.getTime();
  if (endChanged && end < startOfDayUtc()) {
    throw { statusCode: 400, message: "Course end date cannot be in the past" };
  }

  data.scheduleType = SCHEDULE_TYPES.FIXED_TERM;
  data.courseStartDate = start;
  data.courseEndDate = end;
  return data;
}
