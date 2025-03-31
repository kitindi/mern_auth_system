import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";

const app = express();

// middlewares

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 4000;

// API routes

app.get("/", (req, res) => {
  res.send("API is in work");
});

app.listen(port, () => {
  console.log(`Server is listening post ${port} via http://localhost:${port}`);
});
