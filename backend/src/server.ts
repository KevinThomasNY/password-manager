import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { errorMiddleware } from "./middleware/error-middleware";
import userRoutes from "./routes/user-routes";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRoutes);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
