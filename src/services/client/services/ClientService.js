import {
  APPLICATION_ROLES,
  isValidClientRole,
} from "../../../shared/constants/role.js";
import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
export class ClientService {
  constructor(dependencies) {
    if (!dependencies) {
      throw new Error("Dependencies are required");
    }

    if (!dependencies.clientRepository) {
      throw new Error("ClientRepository instance is required");
    }

    if (!dependencies.apiKeyRepository) {
      throw new Error("ApiKeyRepository instance is required");
    }

    if (!dependencies.userRepository) {
      throw new Error("UserRepository instance is required");
    }

    this.clientRepository = dependencies.clientRepository;
    this.apiKeyRepository = dependencies.apiKeyRepository;
    this.userRepository = dependencies.userRepository;
  }

 formatClientForResponse(client) {
  if (!client) {
    return null;
  }

  const object = client.toObject
    ? client.toObject()
    : { ...client };

  return object;
}

formatUserForResponse(user) {
  if (!user) {
    return null;
  }

  const object = user.toObject
    ? user.toObject()
    : { ...user };

  delete object.password;

  return object;
}

formatApiKeyForResponse(apiKey) {
  if (!apiKey) {
    return null;
  }

  const object = apiKey.toObject
    ? apiKey.toObject()
    : { ...apiKey };

  // delete object.keyValue;

  return object;
}

  generateSlug(name) {
    return name
      .toLocaleLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim(); //AMAZON-WEB-SERVICE=>amazon-web-service
  }

  canUserAccessClient(user, clientId) {
    if (!user || !clientId) {
      return false;
    }

    if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
      return true;
    }

 return (
    user.clientId &&
    user.clientId.toString() === clientId.toString()
  );  }

  generateApiKeyValue() {
    const prefix = "api_";
    const randomString = crypto.randomBytes(16).toString("hex");
    return prefix + randomString;
  }

  async getClientByApiKey(apiKeyValue) {
    const apiKey = await this.apiKeyRepository.findByKeyValue(apiKeyValue);

    if (!apiKey || apiKey.isExpired()) {
      return null;
    }

    const client = await this.clientRepository.findById(apiKey.clientId);
    if (!client) {
      return null;
    }

    return { client, apiKey };
  }

  async createClient(clientData, adminUser) {
    try {
      const { name, email, description, website } = clientData;
       
      // console.log("Creating client with data:", clientData, "by admin user:", adminUser);

      if (!name || !email) {
        throw new AppError("Name and email are required to create a client", 400);
      }

      const slug = this.generateSlug(name);

      if(!slug || slug.length === 0) {
        throw new AppError("Failed to generate slug from client name", 400);
      }

      const existingClient = await this.clientRepository.findBySlug(slug);

      if (existingClient) {
        throw new AppError("Client with this name already exists", 400);
      }

      const newClient = await this.clientRepository.create({
        name,
        email,
        description,
        website,
        slug,
        createdBy: adminUser._id,
      });

      if (!newClient) {
        throw new Error("Failed to create client");
      }

      return this.formatClientForResponse(newClient);
    } catch (err) {
      logger.error(`Error creating client: ${err.message}`);
      throw err;
    }
  }

  async createClientUser(clientId, userData, adminUser) {
    try {
      if (!this.canUserAccessClient(adminUser, clientId)) {
        throw new AppError(
          "You do not have permission to create a user for this client",
          403,
        );
      }

      const {
        username,
        email,
        password,
        role = APPLICATION_ROLES.CLIENT_VIEWER,
      } = userData;

      if (!username || !email || !password) {
        throw new AppError(
          "Username, email and password are required to create a user",
          400,
        );
      }

      if (!isValidClientRole(role)) {
        throw new AppError("Invalid role provided", 400);
      }

      const client = await this.clientRepository.findById(clientId);

      if (!client) {
        throw new AppError("Client not found", 404);
      }

      let permissions = {
        canCreateApiKeys: false,
        canManageUsers: false,
        canViewAnalytics: true,
        canExportData: false,
      };

      if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
        permissions = {
          canCreateApiKeys: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canExportData: true,
        };
      }

      const existingUser = await this.userRepository.findByEmail(email);

      if (existingUser) {
        throw new AppError("User with this email already exists", 400);
      }

      const newUser = await this.userRepository.create({
        username,
        email,
        password,
        role,
        clientId: client._id,
        permissions,
      });

      logger.info("Client user created in MongoDB", {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        clientId: newUser.clientId,
      });

      return this.formatUserForResponse(newUser);
    } catch (err) {
      logger.error(`Error creating client user: ${err.message}`);
      throw err;
    }
  }

  async createApiKey(clientId, apiKeyData, adminUser) {
    try {
      const client = await this.clientRepository.findById(clientId);

      if (!client) {
        throw new AppError("Client not found", 404);
      }

      if (!this.canUserAccessClient(adminUser, clientId)) {
        throw new AppError(
          "You do not have permission to create an API key for this client",
          403,
        );
      }

      if (
        adminUser.role !== APPLICATION_ROLES.CLIENT_ADMIN &&
        adminUser.role !== APPLICATION_ROLES.SUPER_ADMIN
      ) {
        throw new AppError(
          "Access denied-only for admin and client-admin can create API-keys ",
          403,
        );
      }

      const {
        name,
        description,
        environment = "production",
        isActive = true,
      } = apiKeyData;

      if (!name) {
        throw new AppError("Name is required to create an API key", 400);
      }

        const keyId = uuidv4();

        const keyValue = this.generateApiKeyValue();
      if (!keyValue) {
        throw new AppError("Failed to generate API key value", 500);
      }

      if (!["production", "staging", "development"].includes(environment)) {
        throw new AppError("Invalid environment provided", 400);
      }

      const apiKey = await this.apiKeyRepository.create({
        keyId,
        keyValue,
        clientId: client._id,
        name,
        description,
        environment,
        isActive,
        createdBy: adminUser._id,
      });

      logger.info("API key created in MongoDB with ID:", apiKey._id);
      
      return apiKey;

      // return this.formatApiKeyForResponse(apiKey);
    } catch (err) {
      logger.error(`Error creating API key: ${err.message}`);
      throw err;
    }
  }

  async getClientApiKeys(clientId, user) {
    try {
      if (!this.canUserAccessClient(user, clientId)) {
        throw new AppError(
          "Access denied-you do not have permission to access this client",
          403,
        );
      }

      const apiKey = await this.apiKeyRepository.findByClientId(clientId);

      if (!apiKey) {
        throw new AppError("API key not found for this client", 404);
      }
      const formattedResponces = apiKey.map((key) => {
        const KeyObj = key.toObject() ? key.toObject() : { ...key };
        delete KeyObj.keyValue;
        return KeyObj;
      });

      return formattedResponces;
    } catch (err) {
      logger.error(`Error fetching API keys for client: ${err.message}`);
      throw err;
    }
  }

  async getApiKeys(clientId, user) {
    try {
      const client = await this.clientRepository.findById(clientId);
      if (!client) {
        throw new AppError("Client not found", 404);
      }
      if (!this.canUserAccessClient(user, clientId)) {
        throw new AppError(
          "Access denied-you do not have permission to access this client",
          403,
        );
      }

      const apiKeys = await this.apiKeyRepository.findByClientId(clientId);
      if (!apiKeys || apiKeys.length === 0) {
        throw new AppError("No API keys found for this client", 404);
      }

      const formattedResponces = apiKeys.map((key) => {
        const KeyObj = key.toObject() ? key.toObject() : { ...key };
        delete KeyObj.keyValue;
        return KeyObj;
      });

      return formattedResponces;
    } catch (err) {
      logger.error(`Error fetching API keys for client: ${err.message}`);
      throw err;
    }
  }
}
