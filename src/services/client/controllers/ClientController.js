import ResponseFormatter from "../../../shared/utils/ResponceFormatter.js";

export class ClientController {
  constructor(clientService, authService) {
    if (!clientService) {
      throw new Error("ClientService instance is required");
    }
    if (!authService) {
      throw new Error("AuthService instance is required");
    }

    this.clientService = clientService;
    this.authService = authService;
  }

  async createClient(req, res, next) {
    try {
      const isSuperAdmin = await this.authService.checkSuperAdminPermissions(
        req.user._id,
      );

      if (!isSuperAdmin) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              "You do not have permission to create a client",
              403,
            ),
          );
      }

      const client = await this.clientService.createClient(req.body, req.user);
      return res
        .status(201)
        .json(
          ResponseFormatter.success(client, "Client created successfully", 201),
        );
    } catch (err) {
      next(err);
    }
  }

  async createClientUser(req, res, next) {
    try {
      const { clientId } = req.params;
      const user = await this.clientService.createClientUser(
        clientId,
        req.body,
        req.user,
      );

      if (!user) {
        throw new Error("Failed to create client user");
      }
      return res
        .status(201)
        .json(
          ResponseFormatter.success(
            user,
            "Client user created successfully",
            201,
          ),
        );
    } catch (err) {
      next(err);
    }
  }

  async createApiKey(req, res, next) {
    try {
      const { clientId } = req.params;
      const apiKey = await this.clientService.createApiKey(
        clientId,
        req.body,
        req.user,
      );
      if (!apiKey) {
        throw new Error("Failed to create API key");
      }
      return res
        .status(201)
        .json(
          ResponseFormatter.success(apiKey, "API key created successfully", 201),
        );
    } catch (err) {
      next(err);
    }
  }

  async getApiKeys(req, res, next) {
    {
        try{
  const { clientId } = req.params;
  const apiKeys = await this.clientService.getApiKeys(clientId, req.user);
  if(!apiKeys || apiKeys.length === 0){
    return res
    .status(404).json(
      ResponseFormatter.error("No API keys found for this client", 404),
    );
  }
  return res
    .status(200)
    .json(
      ResponseFormatter.success(apiKeys, "API keys fetched successfully", 200),
    );
        }
        catch(err){
          next(err);
        }
    }
}
}

