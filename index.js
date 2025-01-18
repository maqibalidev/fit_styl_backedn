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
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to the database (your db_config.js should already be using environment variables)
require("./db/db_config");

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/chat", chatRoute);
// Uncomment this block if you're handling socket.io events

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("send_message", (data) => {
    const {s_id,r_id,msg} = data
  SaveMessage(s_id,r_id,msg).then(()=>{
    socket.emit(`receive_${s_id}_message`,{s_id,r_id,msg})
  }).catch((err)=>{
    console.log(err)
  })
  });

});



// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
