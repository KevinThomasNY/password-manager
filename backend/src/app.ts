// src/app.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";

import { errorMiddleware } from "./middleware/error-middleware";
import userRoutes from "./routes/user-routes";
import passwordRoutes from "./routes/password-routes";
import { adminRouter, publicAccountRouter } from "./routes/account-routes";

const app = express();

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const frontendOrigin =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", publicAccountRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRoutes);
app.use("/api/passwords", passwordRoutes);

const frontendDistPath = process.env.FRONTEND_DIST_PATH;
if (frontendDistPath) {
  const resolvedFrontendDistPath = path.resolve(frontendDistPath);
  app.use(express.static(resolvedFrontendDistPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(path.join(resolvedFrontendDistPath, "index.html"));
  });
}

app.use(errorMiddleware);

export default app;
