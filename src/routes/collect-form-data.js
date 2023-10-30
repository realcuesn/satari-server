import { DatabaseModule } from "../database/database.js";
import validateFormData from "../utilities/formValidation.js"; // Create a validation utility
import { generateUUID } from "../utilities/uuid.js"; // Import the UUID generation utility

// Define a schema for the "Collected Form" that includes the collector/form details
const CollectedFormSchema = {
    collectorId: String, // Reference to the original collector/form
    formId: String, // Unique identifier for the collected form
    formData: Object, // Data collected from the form
    collectedAt: Date, // Timestamp indicating when the form was collected
    workspaceId: String, // Reference to the workspace where this collector/form belongs
    name: String, // Name of the collector/form
    sourceType: String, // Source type ("Website")
    sourceDomain: String, // Actual domain from which the data was collected
};

/**
 * Handle a POST request to collect and store forms from websites based on form structure from the database.
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */

function extractDomainFromOrigin(origin) {
    // Check if the 'origin' is a valid URL
    const url = new URL(origin);

    // Extract and return the host (domain) from the URL
    return url.hostname;
}
export default async (req, res) => {
    try {
        const { collectorId, formData } = req.body;
        console.log(req.body)

        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const formsCollection = db.collection("collectors"); // Change to your actual collection name
        /** @type {Collection} */
        const collectedFormsCollection = db.collection("collectedForms"); // Change to your actual collection name

        // Extract the source domain from the request's host header (for websites)
        const sourceOrigin = req.get("Origin");

        // Extract the domain from the sourceOrigin (You may need to parse it to get just the domain)
        const sourceDomain = extractDomainFromOrigin(sourceOrigin);
        
        // Find the collector/form in the database based on the collectorId
        const form = await formsCollection.findOne({ collectorId });

        if (!form) {
            // Collector/Form not found
            return res.status(404).json({ error: "Collector/Form not found" });
        }

        // Verify that the sourceDomain is one of the allowedDomains specified in the collector/form
        if (!form.allowedDomains || !form.allowedDomains.includes(sourceDomain)) {
            // Source domain is not allowed
            return res.status(403).json({ error: "Source domain not allowed" });
        }

        // Extract the form structure fields from the retrieved form document
        const formStructureFields = form.formStructure.fields;

        // Validate the collected form data based on the form structure
        const filteredFormData = validateFormData(formData, formStructureFields);

        if (!filteredFormData) {
            // Data validation failed
            return res.status(400).json({ error: "Invalid form data" });
        }

        // Generate a unique formId for the collected form using UUID
        const formId = generateUUID();

        // Post the collected form data into the "Collected Forms" collection
        const collectedForm = {
            collectorId: collectorId, // Reference to the original collector/form
            formId: formId, // Unique identifier for the collected form
            formData: filteredFormData, // Use the filtered form data
            collectedAt: new Date(),
            workspaceId: form.workspaceId, // Reference to the workspace
            name: form.name, // Name of the collector/form
            sourceType: form.sourceType, // Source type ("Website")
            sourceDomain: sourceDomain, // Actual domain from which the data was collected
        };

        // Insert the collected form data using the CollectedFormSchema
        const insertResult = await collectedFormsCollection.insertOne(collectedForm);
        
        if (insertResult.acknowledged) {
            // Form collected and stored successfully
            res.status(201).json({ message: "Form collected and stored successfully" });
        } else {
            // Failed to store the form
            res.status(500).json({ error: "Failed to store the form" });
        }
    } catch (error) {
        console.error("Error while collecting and storing the form:", error);

        // Send a generic error response
        res.status(500).json({ error: "Error while collecting and storing the form" });
    }
};
