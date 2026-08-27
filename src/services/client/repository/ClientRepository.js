import BaseClientRepository from "./BaseClientRepository.js";
import client from "../../../shared/models/Client.js";
import logger from "../../../shared/config/logger.js";

class MongoClientRepository extends BaseClientRepository {
  constructor() {
    super(client);
  }

  //This method will create a new client in the database and return the created client object
  async create(clientData) {
    try {
      const existingClient = await this.model.findOne({
        $or: [{ name: clientData.name }, { slug: clientData.slug }],
      });
      if (existingClient) {
        logger.error(
          `Client with name ${clientData.name} or slug ${clientData.slug} already exists`,
        );
        throw new Error(
          `Client with name ${clientData.name} or slug ${clientData.slug} already exists`,
        );
      }

      const client = new this.model(clientData);
      await client.save();

      logger.info("Client created in MongoDB", {
        mongoId: client._id,
        name: client.name,
        slug: client.slug,
      });

      return client;
    } catch (err) {
      logger.error("Error creating client in MongoDB", { error: err.message });
      throw err;
    }
  }
}
