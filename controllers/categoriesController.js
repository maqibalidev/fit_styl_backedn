const connection = require("../db/db_config");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload category function with check for existing category
const uploadCategory = (req, res) => {
  const { name } = req.body;

  // First, check if a category with the same name already exists
  connection.query("SELECT * FROM categories WHERE name = ?", [name], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error checking category existence", error: error.message });
    }

    // If a category with the same name exists, return an error response
    if (results.length > 0) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    // If category does not exist, proceed with image upload and category insertion
    const imageInsertPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "category_images" },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          const imageUrl = result.secure_url;
          resolve(imageUrl); // Resolve with the image URL
        }
      );

      uploadStream.end(req.files[0].buffer); // End the stream with the file buffer
    });

    // Start transaction
    connection.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to start transaction", error: err.message });
      }

      // Upload the image and insert category details
      imageInsertPromise
        .then((url) => {
          // Now insert the category into the database
          connection.query(
            "INSERT INTO categories (name, icon_url) VALUES (?, ?)",
            [name, url],
            (error, result) => {
              if (error) {
                // If error, rollback the transaction
                return connection.rollback(() => {
                  res.status(500).json({ message: "Error inserting category", error: error.message });
                });
              }

              // Commit the transaction if everything is successful
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    res.status(500).json({ message: "Transaction commit failed", error: err.message });
                  });
                }

                res.status(201).json({
                  message: "Category added successfully",
                  category_id: result.insert_id,
                });
              });
            }
          );
        })
        .catch((error) => {
          // Rollback transaction if image upload failed
          connection.rollback(() => {
            res.status(500).json({ message: "Error saving image", error: error.message });
          });
        });
    });
  });
};

// Get all categories function
const getCategories = (req, res) => {
  connection.query("SELECT * FROM categories", (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching categories", error: error.message });
    }

    // If no categories are found
    if (results.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    // Return the categories with their names and icon URLs
    res.status(200).json({
      message: "Categories fetched successfully",
      data: results, // The category data will include the name and icon_url
    });
  });
};

module.exports = { uploadCategory, getCategories };
