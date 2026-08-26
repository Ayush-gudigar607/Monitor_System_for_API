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
        throw new Error("Super Admin already exists");
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
      const existingUser = await this.userRepository.findByEmail(
        userData.email,
      );
      if (existingUser) {
        throw new Error("User with this email already exists");
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
        throw new Error("Invalid email or password");
      }

      if (!user.isActive) {
        throw new Error("User account is inactive");
      }

      const isPasswordValid = await this.comparePassword(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
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
        throw new Error("User not found");
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
        throw new Error("User not found");
      }

      return user.role === APPLICATION_ROLES.SUPER_ADMIN;
    } catch (error) {
      throw new Error(
        `Error checking Super Admin permissions: ${error.message}`,
      );
    }
  }
}
