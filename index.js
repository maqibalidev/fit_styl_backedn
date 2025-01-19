const express = require("express");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const chatRoute = require("./routes/chatRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const { SaveMessage } = require("./controllers/socketController");
require("./db/db_config");

// Load environment variables BEFORE using process.env
require("./firebase/firebaseAdmin");

// Validate essential environment variables
if (!process.env.PORT) {
  throw new Error("Missing PORT in .env file");
}

// Create an Express application
const app = express();
const server = http.createServer(app);

// Configure CORS middleware for HTTP requests
const corsOptions = {
  origin: ["https://fit-styl.vercel.app", "http://localhost:3000"], // Allow frontend domains (Vercel + localhost)
  methods: ["GET", "POST"], // Specify allowed HTTP methods
  credentials: true, // Allow credentials (cookies, auth headers)
};

app.use(cors(corsOptions)); // Apply CORS to HTTP requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: ["https://fit-styl-project.vercel.app", "http://localhost:3000"], // Allow frontend domains (Vercel + localhost)
    methods: ["GET", "POST"], // Specify allowed WebSocket methods
    credentials: true, // Allow credentials (cookies, auth headers)
  },
});

// Connect to the database (your db_config.js should already be using environment variables)
require("./db/db_config");

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/banner", bannerRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected");

  // Listen for the 'send_message' event
  socket.on("send_message", (data) => {
    const { s_id, r_id, msg } = data;
    SaveMessage(s_id, r_id, msg)
      .then(() => {
        // Emit the message to the sender
        socket.emit(`receive_${s_id}_message`, { s_id, r_id, msg });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
