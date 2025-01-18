const connection = require("../db/db_config");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const uploadProduct = async (req, res) => {
    const {
      name, desc, price, off_sale, rating, priority, fabric_type,
      colors, size, returnable, shop_id, margin, category_id
    } = req.body;
  
    connection.query(
      "SELECT * FROM products WHERE name = ?",
      [name],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error checking product existence", error: err.message });
        }
  
        if (result.length > 0) {
          return res.status(400).json({ message: "Product with this name already exists" });
        }
  
        connection.beginTransaction((err) => {
          if (err) {
            return res.status(500).json({ message: "Failed to start transaction", error: err.message });
          }
  
          connection.query(
            "INSERT INTO products (`name`, `product_desc`, `price`, `off_sale`, `rating`, `priority`, `fabric_type`, `colors`, `size`, `returnable`, `shop_id`, `margin`, `category_id`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [name, desc, price, off_sale, rating, priority, fabric_type, colors, size, returnable, shop_id, margin, category_id],
            (error, result) => {
              if (error) {
                return connection.rollback(() => {
                  res.status(500).json({ message: "Error saving product", error: error.message });
                });
              }
  
              const productId = result.insertId;
  
              const imageInsertPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                  const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "product_images" },
                    (error, result) => {
                      if (error) {
                        return reject(error);
                      }
  
                      const imageUrl = result.secure_url;
                      connection.query(
                        "INSERT INTO images (product_id, img_url) VALUES (?, ?)",
                        [productId, imageUrl],
                        (err, data) => {
                          if (err) {
                            return reject(err);
                          }
                          resolve(data);
                        }
                      );
                    }
                  );
  
                  uploadStream.end(file.buffer);
                });
              });
  
              Promise.all(imageInsertPromises)
                .then(() => {
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        res.status(500).json({ message: "Transaction commit failed", error: err.message });
                      });
                    }
  
                    res.status(201).json({
                      message: "Product and images uploaded successfully",
                      product_id: productId,
                    });
                  });
                })
                .catch((error) => {
                  connection.rollback(() => {
                    res.status(500).json({ message: "Error saving images", error: error.message });
                  });
                });
            }
          );
        });
      }
    );
  };
  
  const getProducts = (req, res) => {
    const { cat, limit = 10, offset = 0, id, priority } = req.query;
  
    // Updated query with category name, priority, and price calculation
    let query = `
      SELECT 
        products.id,
        products.name,
        products.product_desc,
        products.price,
        products.margin,
        products.off_sale,
        products.rating,
        products.priority,
        products.fabric_type,
        products.colors,
        products.size,
        products.category_id,
        categories.name AS category_name,
        GROUP_CONCAT(images.img_url) AS images,
        -- Calculate the price after margin and ensure it's an integer (rounded down)
        FLOOR(products.price + (products.price * products.margin / 100)) AS price_with_margin,
        -- Calculate the final price after margin and off_sale, ensuring it's an integer (rounded down)
        FLOOR((products.price + (products.price * products.margin / 100)) 
            - ((products.price + (products.price * products.margin / 100)) * products.off_sale / 100)) AS final_price
      FROM products
      LEFT JOIN images ON products.id = images.product_id
      LEFT JOIN categories ON products.category_id = categories.id  -- Join categories table
    `;
    
    let queryParams = [];
  
    // Add WHERE clause based on query parameters
    if (id) {
      query += " WHERE products.id = ?";
      queryParams.push(id);
    } else {
      // Add condition for category if provided
      if (cat) {
        query += " WHERE products.category_id = ?";
        queryParams.push(cat);
      }
  
      // Add condition for priority if provided
      if (priority) {
        // If there's already a WHERE condition (because of category or id), use AND
        if (queryParams.length > 0) {
          query += " AND products.priority = ?";
        } else {
          query += " WHERE products.priority = ?";
        }
        queryParams.push(priority);
      }
    }
  
    // Add GROUP BY and pagination
    query += " GROUP BY products.id";
    if (!id) {
      query += " LIMIT ? OFFSET ?";
      queryParams.push(parseInt(limit), parseInt(offset));
    }
  
    // Execute query
    connection.query(query, queryParams, (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error fetching products", error: error.message });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: `No ${id ? "product" : "products"} found` });
      }
  
      // Format results to include computed prices and category name
      const formattedResults = results.map(product => {
        const { images, price_with_margin, final_price, category_name, ...others } = product;
        return {
          ...others,
          category_name,  // Include category name
          images: images ? images.split(",") : [],
          final_price,    // Price after margin and off_sale
        };
      });
  
      res.status(200).json({
        message: id ? "Product fetched successfully" : "Products fetched successfully",
        data: formattedResults,
      });
    });
  };
  
  
  

module.exports = { uploadProduct, getProducts };
