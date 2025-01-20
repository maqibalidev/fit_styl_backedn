const multer = require("multer");

// Use memory storage for Multer
const storage = multer.memoryStorage();

// File filter to allow only PNG images (can be extended for other types)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/png","image/jpg","image/jpeg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type! Only PNG ,JPG ,JPEG files are allowed."), false);
    }
};

// Multer upload instance with memory storage and additional limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB per file
});

// Middleware to parse both files and fields
const parseFormData = (req, res, next) => {
    const uploadMiddleware = upload.array("image", 5); // Handle up to 5 images
    uploadMiddleware(req, res, (err) => {
        if (err) {
            // Handle file upload errors
            return res.status(400).json({ message: err.message });
        }

        // Parse form-data fields (handle JSON strings if applicable)
        const fields = req.body;
        Object.keys(fields).forEach((key) => {
            try {
                fields[key] = JSON.parse(fields[key]); // Parse JSON fields if present
            } catch (e) {
                // Leave as string if not JSON
            }
        });

        req.body = fields; // Update req.body with parsed fields
        next();
    });
};
module.exports = {upload, parseFormData };
