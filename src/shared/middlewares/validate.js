import ResponceFormatter from "../utils/ResponceFormatter.js";

const validate = (schema) => (req, res, next) => {
    if (!schema) {
        return next();
    }

    const errors = [];
    const body = req.body || {};

    Object.entries(schema).forEach(([field, rules]) => {
        const value = body[field];

        if (rules.required && (value === undefined || value === null || value === "")) {
            errors.push(`${field} is required`);
            return;
        }

        if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
            return;
        }

        if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters long`);
            return;
        }

        if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
            errors.push(`${field} must be at most ${rules.maxLength} characters long`);
            return;
        }

        if (rules.custom && typeof rules.custom === "function") {
            const customError = rules.custom(value, body);
            if (customError) {
                errors.push(customError);
                return;
            }
        }
    });

    if (errors.length > 0) {
        return res.status(400).json(ResponceFormatter.error("Validation Error", 400, errors));
    }

    return next();
};

export default validate;