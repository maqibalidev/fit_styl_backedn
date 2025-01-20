const connection = require("../db/db_config");
const { v4: uuidv4 } = require('uuid');

  
  const AddCartItem = async (req, res) => {
    const cart_id = uuidv4();
    const userId = req.user.userId;
    const {product_id,quantity=1} = req.body;
  
    // Get a connection to the database
    const client = await connection.connect();
  
    try {
      // Start the transaction
      await client.query("BEGIN");
  
      // Check if a product with the same name already exists
      const checkProductQuery = "SELECT * FROM cart WHERE product_id = $1 AND user_id = $2;";
      const checkProductResult = await client.query(checkProductQuery, [product_id,userId]);
  

      
      if (checkProductResult?.rows?.length > 0) {
        throw new Error("Product already exist in cart");
      }
  

      const checkProductValidity = "SELECT * FROM products WHERE id = $1;";
      const checkProductValidityResult = await client.query(checkProductValidity, [product_id]);
  

      
      if (checkProductValidityResult?.rows?.length === 0) {
        throw new Error("Product does not exist");
      }

      // Insert the product into the database
      const insertProductQuery = `
        INSERT INTO cart (
          id, product_id, user_id, quantity, created_at)
        VALUES ($1, $2, $3, $4, $5);
      `;
      const timestamp = Date.now();
      const cartValues = [ cart_id, product_id, userId,quantity, timestamp];

      await client.query(insertProductQuery, cartValues);
  
      await client.query("COMMIT");
  
      res.status(201).json({
        message: "Product added into the cart!",
        product_id,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ message: error.message });
    } finally {
      client.release();
    }
  };

  const UpdateCartItem = async (req, res) => {
    const userId = req.user?.userId;  
    const { product_id, quantity = 1 } = req.body;
  

    if (isNaN(quantity) || !product_id || !userId) {
      return res.status(400).json({ message: "Invalid input data" });
    }
  

    const client = await connection.connect();
  
    try {

      await client.query("BEGIN");
  

      const updateCartQuery = "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3;";
  

      const result = await client.query(updateCartQuery, [quantity, userId, product_id]);
  

      if (result?.rowCount === 0) {
        throw new Error("Failed to update cart or no matching cart item found!");
      }
  

      await client.query("COMMIT");
  

      res.status(200).json({
        message: "Cart updated successfully!",
        product_id,
        quantity,
      });
  
    } catch (error) {

      await client.query("ROLLBACK");
  

      console.error("Error updating cart:", error.message);
  

      res.status(500).json({ message: "Failed to update cart!" });
    } finally {

      client.release();
    }
  };
  
  const removeProductFromCart = async (req, res) => {
    const userId = req.user?.userId; // Assuming you are using a middleware to extract user info from the token
    const { product_id } = req.body;
  
    // Validate input
    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }
  
    // Get a connection to the database
    const client = await connection.connect();
  
    try {
      // Start the transaction
      await client.query("BEGIN");
  
      // Query to delete the product from the cart
      const removeProductQuery = `
        DELETE FROM cart
        WHERE user_id = $1 AND product_id = $2
        RETURNING *;
      `;
  
      // Execute the query
      const result = await client.query(removeProductQuery, [userId, product_id]);
  
      // If no rows were returned, the product was not found in the cart
      if (result?.rowCount === 0) {
        throw new Error("Product not found in the cart!");
      }
  
      // Commit the transaction
      await client.query("COMMIT");
  
      // Send a success response
      res.status(200).json({
        message: "Product removed from cart successfully!",
        product_id,
      });
  
    } catch (error) {
      // Rollback the transaction in case of an error
      await client.query("ROLLBACK");
  
      // Log the error for debugging
      console.error("Error removing product from cart:", error.message);
  
      // Send the error response
      res.status(500).json({ message: "Failed to remove product from cart!" });
    } finally {
      // Release the client back to the pool
      client.release();
    }
  };
  
  const getCartProducts = async (req, res) => {
    const userId = req.user?.userId;  // Extract the user ID from the token

  
    // Get a connection to the database
    const client = await connection.connect();
  
    try {
      // Define the SQL query
      const query = `
     SELECT DISTINCT ON (products.id) 
    products.id AS product_id,
    products.name,
    products.rating,
    images.img_url,
    cart.quantity,
    products.off_sale,
    (products.price * products.margin / 100) AS price_with_margin,
    FLOOR(
        (products.price + (products.price * products.margin / 100)) 
        - ((products.price + (products.price * products.margin / 100)) * products.off_sale / 100)
    ) AS final_price
FROM cart
JOIN products ON cart.product_id = products.id
LEFT JOIN images ON products.id = images.product_id
WHERE cart.user_id = $1
ORDER BY products.id;
      `;
      
      // Execute the query with the productIds array
      const result = await client.query(query,[userId]);
  
      // Return the result
      res.status(200).json(result.rows);
  
    } catch (error) {
      // Handle errors
      console.error("Error fetching cart product details:", error.message);
      res.status(500).json({ message: "Failed to fetch product details!" });
    } finally {
      client.release();
    }
  };
  
  module.exports = {AddCartItem ,UpdateCartItem,removeProductFromCart,getCartProducts}