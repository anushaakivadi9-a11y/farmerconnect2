import User from "../models/User.js";

export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user.id).populate("wishlist");
  res.json(user.wishlist);
};

export const toggleWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user.id);

  const exists = user.wishlist.some(id => id.toString() === productId);
  if (exists) {
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }
  await user.save();
  res.json({ wishlist: user.wishlist, added: !exists });
};