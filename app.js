import express from "express";
import cors from "cors";
import http from "http";
import { createSocketServer } from "./socket-server.js"; // 🚀 Import your Socket.io logic
import { configureApp } from "./config.js"; // ⚙️ Import configuration logic
import apiRouter from "./src/router/router.js"; // 🌐 Import your API router
import { DatabaseModule } from "./src/database/database.js"; // 📦 Import the Database Module

const PORT = process.env.PORT || 3030;

async function startServer() {
  try {
    const app = express();
    app.use(cors());

    // 🛠️ Configure the app (e.g., middleware, routes, etc.)
    configureApp(app);

    // 🔗 Integrate your API router
    app.use("/api", apiRouter);

    const httpServer = http.createServer(app);

    // 🌐 Create the Socket.io server
    const io = createSocketServer(httpServer);

    // 📦 Connect to the database
    DatabaseModule.connectToDatabase((error) => {
      if (error) {
        console.error("Error starting the server: ❌", error);
        process.exit(1);
      } else {
        httpServer.listen(PORT, () => {
          console.log(`Server is running on port ${PORT} 🚀`);
        });
      }
    });
  } catch (error) {
    console.error(`Error starting the server: ❌ ${error}`);
    process.exit(1);
  }
}

startServer();
