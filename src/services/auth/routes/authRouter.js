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

router.get("/", (req, res) => {
  res.status(200).json(
    ResponceFormatter.sucess(
      {
        endpoints: [
          {
            path: "/api/auth/onboard-super-admin",
            method: "POST",
            description: "Onboard a super admin user",
          },
        ],
      },
      "auth endpoint available",
    ),
  );
});

router.post(
  "/onboard-super-admin",
  requestLogger,
  validate(onboardsuperAdminSchema),
  authController.OnboardSuperAdmin.bind(authController),
);

router.post(
  "/register",
  requestLogger,
  validate(registerSchema),
  authController.register.bind(authController),
);

router.post(
  "/login",
  requestLogger,
  validate(loginSchema),
  authController.login.bind(authController),
);

router.get(
  "/profile",
  requestLogger,
  authenticate,
  authController.getProfile.bind(authController),
);

router.post(
  "/logout",
  requestLogger,
  authenticate,
  authController.logout.bind(authController),
);

export default router;
