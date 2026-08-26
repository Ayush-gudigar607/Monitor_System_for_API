import BaseRepository from "./BaseRepository.js";
import User from "../../../shared/models/user.js";
import logger from "../../../shared/config/logger.js";

export default class MongoUserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async create(userData) {
    try {
      let data = { ...userData };
      if (data.role === "SUPER_ADMIN" && !data.permissions) {
        data.permissions = {
          canCreateApiKeys: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canExportData: true,
        };
      }

      const user = new this.model(data);
      await user.save();

      logger.info(
        `User created with username: ${user.username} and email: ${user.email}`,
      );
      return user;
    } catch (err) {
      logger.error(`Error creating user: ${err.message}`);
      throw err;
    }
  }

  async findById(id) {
    try {
      const user = await this.model.findById(id);
      return user;
    } catch (err) {
      logger.info(`Error finding user by id: ${err.message}`);
      throw err;
    }
  }

  async findByUsername(username) {
    try {
      const user = await this.model.findOne({ username: username });
      return user;
    } catch (err) {
      logger.info(`Error finding user by username: ${err.message}`);
      throw err;
    }
  }

  async findByEmail(email) {
    try {
      const user = await this.model.findOne({ email: email });
      return user;
    } catch (err) {
      logger.info(`Error finding user by email: ${err.message}`);
      throw err;
    }
  }

  async findAll()
  {
    try{
   const users=await this.model.find({isActive:true}).select("-password");
   return users;
    }
    catch(err)
    {
   logger.info(`Error finding all users: ${err.message}`);
   throw err;
    }
  }
}

