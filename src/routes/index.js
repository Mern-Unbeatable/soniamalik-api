import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import eventRoutes from "./event.routes.js";
import productRoutes from "./product.routes.js";
import serviceRoutes from "./service.routes.js";
import orderRoutes from "./order.routes.js";
import threadRoutes from "./thread.routes.js";
import recruitmentRoutes from "./recruitment.routes.js";
import clubRoutes from "./club.routes.js";
import newsRoutes from "./news.routes.js";
import communityRoutes from "./community.routes.js";
import adminRoutes from "./admin.routes.js";
import homepageRoutes from "./homepage.routes.js";
import brandRoutes from "./brand.routes.js";
import notificationRoutes from "./notification.route.js";
import interestRequestRoutes from "./interestRequest.routes.js";
import inqueryRoutes from './inquiry.route.js'
import sportsCategoryRoutes from './sportsCategory.route.js'
import contactRoutes from './contact.routes.js'
const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes);
router.use("/products", productRoutes);
router.use("/services", serviceRoutes);
router.use("/orders", orderRoutes);
router.use("/threads", threadRoutes);
router.use("/recruitments", recruitmentRoutes);
router.use("/clubs", clubRoutes);
router.use("/news", newsRoutes);
router.use("/community", communityRoutes);
router.use("/admin", adminRoutes);
router.use("/homepage", homepageRoutes);
router.use("/brands", brandRoutes);
router.use("/notifications", notificationRoutes);
router.use("/interest-requests", interestRequestRoutes);
router.use("/inquiries", inqueryRoutes);
router.use("/sports-categories", sportsCategoryRoutes);
router.use("/contacts", contactRoutes)
export default router;
