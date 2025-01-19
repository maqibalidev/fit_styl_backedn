const connection = require("../db/db_config");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require('uuid');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload category function with check for existing category
const uploadCategory = async (req, res) => {
  const { name } = req.body;
  const category_id = uuidv4();

  // Start a database client for transactions
  const client = await connection.connect();

  try {
    // Check if a category with the same name already exists
    const values = [name];
    const categoryCheck = await client.query("SELECT * FROM categories WHERE name = $1;", values);

    if (categoryCheck.rows.length > 0) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    // Upload the image to Cloudinary
    const imageInsertPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "category_images" },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          const imageUrl = result.secure_url;
          resolve(imageUrl);
        }
      );
      uploadStream.end(req.files[0].buffer); // Send the image buffer to Cloudinary
    });

    // Begin a transaction
    await client.query("BEGIN");

    const imageUrl = await imageInsertPromise;

    // Insert the category into the database
    const insertValues = [category_id, name, imageUrl];
    const insertQuery = `
      INSERT INTO categories (id, name, icon_url)
      VALUES ($1, $2, $3) RETURNING id;
    `;
    const insertResult = await client.query(insertQuery, insertValues);

    // Commit the transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Category added successfully",
      category_id: insertResult.rows[0].id,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error uploading category", error: error.message });
  } finally {
    // Release the client back to the pool
    client.release();
  }
};


// Get all categories function
const getCategories = (req, res) => {
  connection.query("SELECT * FROM categories;", (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching categories", error: error.message });
    }

    // If no categories are found
    if (results?.rows?.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    // Return the categories with their names and icon URLs
    res.status(200).json({
      message: "Categories fetched successfully",
      data: results.rows, // The category data will include the name and icon_url
    });
  });
};

module.exports = { uploadCategory, getCategories };
