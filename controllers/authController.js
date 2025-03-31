import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import "dotenv/config";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Mising details" });
  }

  //   create a new user
  try {
    // check for user existance
    const userExist = await userModel.findOne({ email });

    if (userExist) {
      return res.json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a user
    const user = new userModel({ name, email, password: hashedPassword });

    await user.save();

    // generate token for the new user and user cookies to send to client

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // send token to client

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // send welcome email

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to the Wolrd",
      text: `Welcome to the community!\nYour account has been created with email: ${email}`,
      html: `<b>Welcome to the community!</b><p>Your account has been created with email: ${email}</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:");
      }
    });

    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// user login controller

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    //   check for user existance

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: " Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: " Invalid password" });
    }

    // generate token for the new user and user cookies to send to client

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // send token to client

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// logout controller

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Email verification controller

export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account verified" });
    }
    // generate OTP

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    // store otp to user
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    // save user in db

    await user.save();

    // send email to the user

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account verification OTP",
      text: `Your OTP is ${otp}. verify your account using this OTP`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:");
      }
    });

    // send response to user

    res.json({ success: true, message: "Verification OTP Send on your Eamil" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// verify email

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  // check for existing userId and OTP

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    // get user

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not Found" });
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // check for OTP expire date

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    // verify the accoount using OTP

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Check if user is authenticated

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Send Password Reset OTP

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }

  try {
    // find the actual user

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // generate reset otp
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    // store otp to user
    user.resetOtp = otp;
    user.resetOtpExpiredAT = Date.now() + 15 * 60 * 1000;

    // save user in db

    await user.save();

    // send email to the user

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password reset OTP",
      text: `Your OTP for resetting your password is ${otp}. Reset your  account password now securely with this OTP`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email Sent:");
      }
    });

    // send response to user

    res.json({ success: true, message: "OTP Send to your Eamil" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Reset user password

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "Email, OTP, and password are required" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.resetOtp === "" || user.resetOtp !== otp.toString()) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // chech for expire date

    if (user.resetOtpExpiredAT < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    // update new user password

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtpExpiredAT = 0;

    user.resetOtp = "";

    user.save();

    return res.json({ success: true, message: "Your password is restored successfully." });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
