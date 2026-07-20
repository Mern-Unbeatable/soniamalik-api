export function parseArrayFields(req, res, next) {
    const arrayFields = ["sessionTypes", "sports", "suitableFor", "providerType", "availableDays", "responseMethods"];

    // Handle sessionType field (note: different from sessionTypes)
    if (req.body.sessionType && !arrayFields.includes("sessionType")) {
        arrayFields.push("sessionType");
    }

    arrayFields.forEach((key) => {
        if (!req.body[key]) return;

        // case 1: already array (Postman repeated keys)
        if (Array.isArray(req.body[key])) return;

        // case 2: JSON string ["a","b"]
        try {
            if (typeof req.body[key] === "string" && req.body[key].trim().startsWith("[")) {
                req.body[key] = JSON.parse(req.body[key]);
            } else if (typeof req.body[key] === "string") {
                // fallback: comma separated string
                req.body[key] = req.body[key].split(",").map((v) => v.trim());
            } else {
                req.body[key] = [req.body[key]];
            }
        } catch (e) {
            req.body[key] = [req.body[key]];
        }

        // Remove empty strings from array
        if (Array.isArray(req.body[key])) {
            req.body[key] = req.body[key].filter(v => v && v.trim().length > 0);
            if (req.body[key].length === 0) {
                delete req.body[key];
            }
        }
    });

    // Handle numeric fields
    const numericFields = ["duration"];
    numericFields.forEach((key) => {
        if (req.body[key] !== undefined && req.body[key] !== "") {
            const num = parseInt(req.body[key]);
            if (!isNaN(num)) {
                req.body[key] = num;
            } else {
                delete req.body[key];
            }
        }
    });

    // Handle boolean fields
    const booleanFields = ["isOnline", "insuranceInPlace", "womenOnly"];
    booleanFields.forEach((key) => {
        if (req.body[key] !== undefined) {
            if (req.body[key] === "true" || req.body[key] === true) {
                req.body[key] = true;
            } else if (req.body[key] === "false" || req.body[key] === false) {
                req.body[key] = false;
            } else {
                delete req.body[key];
            }
        }
    });

    next();
}