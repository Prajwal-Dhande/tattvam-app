// backend/server.js

import dotenv from "dotenv";
// ✅ BUG FIX: dotenv ko sabse upar load karna zaroori hai, taaki baaki files ko env variables mil sakein
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ROUTES
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// CONNECT DATABASE
connectDB();

// INIT APP
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIX __dirname FOR ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ STATIC IMAGE SERVING
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// DEBUG: Confirm path in console
console.log("🖼️ Image directory:", uploadsPath);

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/admin", adminRoutes);

// ROOT (✅ HEALTH CHECK FOR CRON-JOB.ORG)
app.get("/", (req, res) => {
  // Explicitly sending status 200 so monitoring tools don't fail
  res.status(200).send("✅ Tattvam API is running successfully... Server is AWAKE! 🚀");
});

// ERROR HANDLERS
app.use(notFound);
app.use(errorHandler);

// START SERVER
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${ENV} mode on port ${PORT}`);
});