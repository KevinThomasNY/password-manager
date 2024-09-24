import express from "express";
const app = express();
const port = 3000;
import { db } from "./db";
import { users } from "./db/schema";

app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

app.get("/users", async (req, res) => {
  const result = await db.select().from(users);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
