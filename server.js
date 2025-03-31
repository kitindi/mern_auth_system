import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mondodb.js";

const app = express();

// middlewares

app.use(express.json());
app.use(cookieParser());
app.use(cors({ Credentials: true }));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 4000;
// connect to db

await connectDB();
// API routes

app.get("/", (req, res) => {
  res.send("API is in work");
});

app.listen(port, () => {
  console.log(`Server is listening post ${port} via http://localhost:${port}`);
});
