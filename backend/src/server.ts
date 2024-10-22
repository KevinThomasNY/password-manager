import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = 3000;

app.get("/hello", (req, res) => {
  res.send("Hello World!");
});


app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
