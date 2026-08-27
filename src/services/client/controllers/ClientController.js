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
          ResponseFormatter.sucess(client, "Client created successfully", 201),
        );
    } catch (err) {
      next(err);
    }
  }

  async createClientUser(req, res, next) {
    try{
        const {clientId} = req.params;
        const user=await this.clientService.createClientUser(clientId, req.body, req.user);
        
        if(!user){
            throw new Error("Failed to create client user");
        }
        return res.status(201).json(ResponseFormatter.sucess(user, "Client user created successfully", 201));
    }
    catch (err) {
        next(err);
    }
}
}
