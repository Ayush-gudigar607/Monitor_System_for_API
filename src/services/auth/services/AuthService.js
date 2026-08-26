// import bcrypt from "bcrypt";
import  SecurityUtils  from "../../../shared/utils/SecurityUtils.js";
import logger from "../../../shared/config/logger.js";
import {APPLICATION_ROLES} from "../../../shared/constants/role.js";
import AppError from "../../../shared/utils/AppError.js";
export class AuthService {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error("UserRepository instance is required");
    }
    this.userRepository = userRepository;
  }

  formateResponce(user) {
    if (!user) {
      throw new Error("User object is required");
    }

    const userobject = user.toObject ? user.toObject() : { ...user };
    delete userobject.password;
    return userobject;
  }

  comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async OnboardSuperAdmin(SuperAdminData) {
    try {
      const existingUser = await this.userRepository.findAll();

      if (existingUser.length > 0 && existingUser) {
        throw new AppError("Super Admin already exists", 409);
      }

      const user = await this.userRepository.create(SuperAdminData);
      const token = SecurityUtils.generateToken({ user });

      logger.info("Super Admin onboarded successfully");
      return { user: this.formateResponce(user), token };
    } catch (err) {
      logger.error(`Error onboarding Super Admin: ${err.message}`);
      throw err;
    }
  }

  async register(userData) {
    try {
      // Check for duplicate email
      const existingEmail = await this.userRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new AppError("User with this email already exists", 409);
      }

      // Check for duplicate username
      const existingUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUsername) {
        throw new AppError("User with this username already exists", 409);
      }

      const user = await this.userRepository.create(userData);
      const token = SecurityUtils.generateToken({ user });

      logger.info(`User registered successfully with email: ${user.email}`);
      return { user: this.formateResponce(user), token };
    } catch (err) {
      logger.error(`Error registering user: ${err.message}`);
      throw err;
    }
  }

  async login(username, password) {
    try {
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new AppError("Invalid username or password", 401);
      }

      if (!user.isActive) {
        throw new AppError("User account is inactive", 403);
      }

      const isPasswordValid = await this.comparePassword(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new AppError("Invalid username or password", 401);
      }

      logger.info(`User logged in successfully with email: ${user.email}`);
      const token = SecurityUtils.generateToken({ user });
      return { user: this.formateResponce(user), token };
    } catch (err) {
      logger.error(`Error logging in user: ${err.message}`);
      throw err;
    }
  }

  async getProfile(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      return this.formateResponce(user);
    } catch (err) {
      logger.error(`Error fetching user profile: ${err.message}`);
      throw err;
    }
  }

  async checkSuperAdminPermissions(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user.role === APPLICATION_ROLES.SUPER_ADMIN;
    } catch (error) {
      logger.error(`Error checking Super Admin permissions: ${error.message}`);
      throw error;
    }
  }
}
