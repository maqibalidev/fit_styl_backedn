const connection = require("../db/db_config");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require('uuid');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  
  const uploadProduct = async (req, res) => {
    const product_id = uuidv4();
    const {
      name, desc, price, off_sale, rating, priority, fabric_type,
      colors, size, returnable, shop_id, margin, category_id,
    } = req.body;
  
    // Get a connection to the database
    const client = await connection.connect();
  
    try {
      // Start the transaction
      await client.query("BEGIN");
  
      // Check if a product with the same name already exists
      const checkProductQuery = "SELECT * FROM products WHERE name = $1;";
      const checkProductResult = await client.query(checkProductQuery, [name]);
  
      if (checkProductResult.rows.length > 0) {
        throw new Error("Product with this name already exists");
      }
  
      // Insert the product into the database
      const insertProductQuery = `
        INSERT INTO products (
          id, name, product_desc, price, off_sale, rating, priority,
          fabric_type, colors, size, returnable, shop_id, margin, category_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `;
      const productValues = [
        product_id, name, desc, price, off_sale, rating, priority,
        fabric_type, colors, size, returnable, shop_id, margin, category_id,
      ];
      await client.query(insertProductQuery, productValues);
  
      // Upload images to Cloudinary and insert their URLs into the database
      const imageInsertPromises = req.files.map(async (file) => {
        const uploadStream = new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "product_images" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          ).end(file.buffer);
        });
  
        const imageUrl = await uploadStream;
        const image_id = uuidv4();
        const insertImageQuery = "INSERT INTO images (id, product_id, img_url) VALUES ($1, $2, $3);";
        const imageValues = [image_id, product_id, imageUrl];
        await client.query(insertImageQuery, imageValues);
      });
  
      // Wait for all image insertions to complete
      await Promise.all(imageInsertPromises);
  
      // Commit the transaction
      await client.query("COMMIT");
  
      res.status(201).json({
        message: "Product and images uploaded successfully",
        product_id,
      });
    } catch (error) {
      // Roll back the transaction on error
      await client.query("ROLLBACK");
      res.status(500).json({ message: error.message });
    } finally {
      // Release the database connection
      client.release();
    }
  };
  
 

  const getProducts = (req, res) => {
    const { cat, limit = 10, offset = 0, id, priority } = req.query;

    // Base query for fetching products
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
            STRING_AGG(images.img_url, ',') AS images,
            FLOOR(products.price + (products.price * products.margin / 100)) AS price_with_margin,
            FLOOR((products.price + (products.price * products.margin / 100)) 
                - ((products.price + (products.price * products.margin / 100)) * products.off_sale / 100)) AS final_price
        FROM products
        LEFT JOIN images ON products.id = images.product_id
        LEFT JOIN categories ON products.category_id = categories.id
    `;

    let queryParams = [];
    let whereClauses = [];

    // Add conditions based on query parameters
    if (id) {
        whereClauses.push(`products.id = $${queryParams.length + 1}`);
        queryParams.push(id);
    }

    if (cat) {
        whereClauses.push(`products.category_id = $${queryParams.length + 1}`);
        queryParams.push(cat);
    }

    if (priority) {
        whereClauses.push(`products.priority = $${queryParams.length + 1}`);
        queryParams.push(parseInt(priority));
    }

    // Append WHERE clause if conditions exist
    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Group by necessary fields to use aggregate functions
    query += " GROUP BY products.id, categories.name";

    // Add LIMIT and OFFSET for pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset*limit));

    // Execute the query
    connection.query(query, queryParams, (error, results) => {
        if (error) {
            return res.status(500).json({ message: "Error fetching products", error: error.message });
        }

        // Format results
        const formattedResults = results.rows.map(product => ({
            ...product,
            images: product.images ? product.images.split(",") : [], // Convert images string to array
        }));

        res.status(200).json({
            message: id ? "Product fetched successfully" : "Products fetched successfully",
            data: formattedResults,
        });
    });
};



  

  
  
  
  

module.exports = { uploadProduct, getProducts };
