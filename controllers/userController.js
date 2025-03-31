import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;
    // find user

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      userData: {
        name: user.name,
        isAccountverified: user.isAccountverified,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
