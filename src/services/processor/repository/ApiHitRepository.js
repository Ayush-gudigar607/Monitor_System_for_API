import { BaseRepository } from "./BaseRepository.js";

export class ApiHitRepository extends BaseRepository {
  constructor({ model, logger: l } = {}) {
    super({ logger: l });
    if (!model) {
      throw new Error("Model is required");
    }
    this.model = model;
  }

  async save(userData) {
    try {
      const doc = new this.model(userData);
      if (!doc) {
        logger.error("Error creating document");
        throw new AppError("Error creating document", 500);
      }
      await doc.save();
      this.logger.info(
        `Saving document with data: ${JSON.stringify(userData)}`,
      );
      return doc;
    } catch (err) {
      if (err && err.code === 11000) {
        this.logger.warn("Duplicate event ID,skipping save", {
          eventId: userData.eventId,
        });
        return null;
      }
      this.logger.error(`Error saving API Hit: ${err.message}`);
      throw err;
    }
  }
}
