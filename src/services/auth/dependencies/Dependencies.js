import {AuthController} from "../controller/authController.js";
import {AuthService} from "../services/AuthService.js";
import MongoUserRepository from "../repository/UserRepository.js";

class Container {
  static init() {
    const repositories = {
      userRepository: new MongoUserRepository(),
    };

    const services = {
      authService: new AuthService(repositories.userRepository),
    };

    const controllers = {
      authController: new AuthController(services.authService),
    };

    return {
      repositories,
      services,
      controllers,
    };
  }
}

const initialized = Container.init();

export { Container };

export default initialized;
