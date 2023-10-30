/**
 * Validate collected form data against the expected form structure fields.
 * Filter out any extra fields.
 *
 * @param {object} formData - The collected form data.
 * @param {Array} formStructureFields - The expected form structure fields.
 * @returns {object|false} - Validated and filtered form data if valid, false otherwise.
 */
function validateFormData(formData, formStructureFields) {
    const filteredFormData = {};

    // Check if all required fields are present in the collected data
    for (const field of formStructureFields) {
        if (field.required && !(field.name in formData)) {
            return false;
        }
    }

    // Filter out any extra fields that are not in the form structure
    for (const field of formStructureFields) {
        const fieldName = field.name;
        const value = formData[fieldName];

        if (value !== undefined) {
            // Check if the data type is one of the expected types ("string", "number", or "array")
            if (
                !isValidType(value, "string") &&
                !isValidType(value, "number") &&
                !isValidType(value, "array")
            ) {
                return false;
            }

            // Add the valid field to the filtered form data
            filteredFormData[fieldName] = value;
        }
    }

    return filteredFormData; // Validated and filtered form data
}

/**
 * Check if a value is of a certain data type.
 *
 * @param {any} value - The value to check.
 * @param {string} type - The expected data type ("string," "number," or "array").
 * @returns {boolean} - True if the value is of the expected type, false otherwise.
 */
function isValidType(value, type) {
    if (type === "array") {
        return Array.isArray(value);
    }
    return typeof value === type;
}

export default validateFormData;
