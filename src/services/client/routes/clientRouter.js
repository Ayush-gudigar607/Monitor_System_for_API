import express from "express";
import authenticate from "../../../shared/middlewares/authenticate.js";
import ResponceFormatter from "../../../shared/utils/ResponceFormatter.js";
import Clientdependencies from "../Dependencies/dependencies.js";

const router = express.Router();
const {clientController}=Clientdependencies.controllers;

router.get("/", (req, res) => {
  console.log("GET /api/client HIT");
  return res.status(200).json(
    ResponceFormatter.success(
      {
        service: "Client Management",
        endpoints: [
          {
            path: "/api/client/admin/client/onboard",
            method: "POST",
          },
          {
            path: "/api/client/admin/client/:clientId/users",
            method: "POST",
          },
          {
            path: "/api/client/admin/client/:clientId/api-keys",
            method: "POST",
          },
          {
            path: "/api/client/admin/client/:clientId/api-keys",
            method: "GET",
          },
        ],
      },
      "Client Management endpoints available",
    ),
  );
});

//This router will handle all the client related routes
router.use(authenticate);


router.post("/admin/client/onboard", async (req, res, next) => {
  clientController.createClient(req, res, next);
});

router.post("/admin/client/:clientId/users", (req, res, next) =>
  clientController.createClientUser(req, res, next),
);

router.post("/admin/client/:clientId/api-keys", (req, res, next) =>
  clientController.createApiKey(req, res, next),
);

router.get("/admin/client/:clientId/api-keys", (req, res, next) =>
  clientController.getApiKeys(req, res, next),
);

export default router;
