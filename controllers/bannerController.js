const connection = require("../db/db_config");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadBanner = async (req, res) => {
  const banner_id = uuidv4();
  const { heading, title, desc, product_id, priority } = req.body;

  // Start a database client for transactions
  const client = await connection.connect();

  try {
    // Check if a banner with the same product_id exists
    const values = [product_id];
    const bannerCheck = await client.query("SELECT * FROM banners WHERE product_id = $1;", values);

    if (bannerCheck.rows.length > 0) {
      return res.status(400).json({ message: "Banner with the same product already exists" });
    }

    // Upload the image to Cloudinary
    const imageInsertPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "banner_images" },
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

    // Insert the banner into the database
    const bannerValues = [banner_id, heading, title, desc, product_id, priority, imageUrl];
    const insertQuery = `
      INSERT INTO banners (id, heading, title, banner_desc, product_id, priority, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
    `;
    const insertResult = await client.query(insertQuery, bannerValues);

    // Commit the transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Banner added successfully",
      banner_id: insertResult.rows[0].id,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error uploading banner", error: error.message });
  } finally {
    // Release the client back to the pool
    client.release();
  }
};


const getBanners = (req, res) => {
  const { priority } = req.query;
  let query = `SELECT * FROM banners`;
  const queryParams = []; // Initialize an empty array for query parameters

  // If priority is provided, add the WHERE clause and parameter
  if (priority) {
    query += " WHERE priority = $1";
    queryParams.push(priority); // Add priority to queryParams
  }

  // Execute the query with the queryParams array
  connection.query(query, queryParams, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching banners", error: error.message });
    }

    if (results?.rows?.length === 0) {
      return res.status(404).json({ message: "No banners found" });
    }

    res.status(200).json({
      message: "Banners fetched successfully",
      data: results.rows,
    });
  });
};

module.exports = {uploadBanner, getBanners } 