import MongoUserRepository from "../../auth/repository/UserRepository.js";
import MongoApiKeyRepository from "../repository/ApiKeyRepository.js"
import MongoClientRepository from "../repository/ClientRepository.js";
import {clientService} from "../services/ClientService.js";
import {clientController} from "../controllers/ClientController.js";
import authContainer from "../../auth/dependencies/Dependencies.js";

class container
{
    static init()
    {
        const repositories = {
            clientRepository: new MongoClientRepository(),
            apiKeyRepository: new MongoApiKeyRepository(),
            userRepository: new MongoUserRepository(),
        };

            const services={
        clientService:new clientService({
            clientRepository:repositories.clientRepository,
            apiKeyRepository:repositories.apiKeyRepository,
            userRepository:repositories.userRepository
        })
    };

    const controllers={
        clientController:new clientController(services.clientService,authContainer.services.authService)
    };

    return {
        repositories,
        services,
        controllers
    }
}
}

const initializedContainer = container.init();
export {container}
export default initializedContainer;