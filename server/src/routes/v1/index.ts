import { Router, type Request, type Response } from "express";
import { sendResponse } from "../../utils/apiResponse.js";

import { authRoutes } from "../../modules/auth/index.js";
import { hubbleRoutes } from "../../modules/hubble/index.js";

const router = Router();

// Base v1 ping/status endpoint
router.get("/status", (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    message: "API v1 operational",
    data: {
      status: "online",
      timestamp: new Date().toISOString(),
    },
  });
});

// Feature module routes
router.use("/auth", authRoutes);
router.use("/hubble", hubbleRoutes);

export default router;

