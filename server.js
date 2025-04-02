import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mondodb.js";
import authRouter from "./routes/authRoutes.js";
import "dotenv/config";
import userRouter from "./routes/userRoutes.js";

const app = express();

// middlewares

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ["http://localhost:5173"];
app.use(
  cors({
    origin: allowedOrigins, // Specify the exact origin of your frontend
    credentials: true, // Allow credentials
  })
);
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 4500;
// connect to db

await connectDB();
// API routes

app.get("/", (req, res) => {
  res.send("API is in work");
});

// API End points
app.use("/api/auth", authRouter);

// API End point for user data
app.use("/api/user", userRouter);
app.listen(port, () => {
  console.log(`Server is listening post ${port} via http://localhost:${port}`);
});
