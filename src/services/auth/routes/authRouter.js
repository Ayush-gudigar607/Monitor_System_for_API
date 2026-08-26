import express from "express";
import dependencies from "../dependencies/Dependencies.js";
import ResponceFormatter from "../../../shared/utils/ResponceFormatter.js";
import requestLogger from "../../../shared/middlewares/requestlogger.js";

import {
  onboardsuperAdminSchema,
  loginSchema,
  registerSchema,
} from "../validation/authSchema.js";

import authenticate from "../../../shared/middlewares/authenticate.js";
import validate from "../../../shared/middlewares/validate.js";

const router = express.Router();

const { controllers } = dependencies;

const authController = controllers.authController;

// GET /api/auth
router.get("/", (req, res) => {
  console.log("GET /api/auth HIT");

  return res.status(200).json(
    ResponceFormatter.sucess(
      {
        service: "Authentication",
        endpoints: [
          {
            path: "/api/auth/onboard-super-admin",
            method: "POST",
          },
          {
            path: "/api/auth/register",
            method: "POST",
          },
          {
            path: "/api/auth/login",
            method: "POST",
          },
          {
            path: "/api/auth/profile",
            method: "GET",
          },
          {
            path: "/api/auth/logout",
            method: "POST",
          },
        ],
      },
      "Auth endpoints available"
    )
  );
});

// POST /api/auth/onboard-super-admin
router.post(
  "/onboard-super-admin",
  requestLogger,
  validate(onboardsuperAdminSchema),
  authController.OnboardSuperAdmin.bind(authController)
);

// POST /api/auth/register
router.post(
  "/register",
  requestLogger,
  validate(registerSchema),
  authController.register.bind(authController)
);

// POST /api/auth/login
router.post(
  "/login",
  requestLogger,
  validate(loginSchema),
  authController.login.bind(authController)
);

// GET /api/auth/profile
router.get(
  "/profile",
  requestLogger,
  authenticate,
  authController.getProfile.bind(authController)
);

// POST /api/auth/logout
router.post(
  "/logout",
  requestLogger,
  authenticate,
  authController.logout.bind(authController)
);

export default router;