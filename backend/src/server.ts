import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from "./middleware/error-middleware";
import userRoutes from "./routes/user-routes";
import passwordRoutes from "./routes/password-routes";
import logger from "./utils/logger";

const app = express();
const port = process.env.PORT || 3000;

const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/passwords", passwordRoutes);

app.use(errorMiddleware);

app.listen(port, () => {
  logger.info(`Server started at http://localhost:${port}`);
});

