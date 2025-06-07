// src/app.ts
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { errorMiddleware } from "./middleware/error-middleware";
import userRoutes from "./routes/user-routes";
import passwordRoutes from "./routes/password-routes";

const app = express();

const frontendOrigin =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/passwords", passwordRoutes);

app.use(errorMiddleware);

export default app;
