const connection = require("../db/db_config");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadBanner = (req,res)=>{
    const { heading,title,desc,product_id,priority } = req.body;

    // First, check if a category with the same name already exists
    connection.query("SELECT * FROM banners WHERE product_id = ?", [product_id], (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error checking banner existence", error: error.message });
      }
  
      if (results.length > 0) {
        return res.status(400).json({ message: "Banner with same product already exists" });
      }
  
      
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
  
        uploadStream.end(req.files[0].buffer); 
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
              "INSERT INTO banners (heading,title,banner_desc,product_id,priority,image_url) VALUES (?, ?,?,?,?,?)",
              [heading,title,desc,product_id,priority,url],
              (error, result) => {
                if (error) {
                  return connection.rollback(() => {
                    res.status(500).json({ message: "Error inserting banner", error: error.message });
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
                    message: "Banner added successfully",
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
}

const getBanners = (req,res)=>{
const {priority} = req.query;
       let query = `SELECT * FROM banners`;
       let queryParams = [];
       if (priority) {
        query += " WHERE priority = ?";
        queryParams.push(priority);
      }

    connection.query(query,[queryParams], (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Error fetching banners", error: error.message });
        }
    
        if (results.length === 0) {
          return res.status(404).json({ message: "No banners found" });
        }
    
        res.status(200).json({
          message: "banner fetched successfully",
          data: results,
        });
      });
}
module.exports = {uploadBanner, getBanners } 