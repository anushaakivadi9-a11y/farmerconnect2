import express from "express";
import { protect } from "../middleware/auth.js"; // your existing auth middleware
import { getWishlist, toggleWishlist } from "../controllers/wishlistController.js";

const router = express.Router();
router.get("/", protect, getWishlist);
router.post("/:productId", protect, toggleWishlist);

export default router;