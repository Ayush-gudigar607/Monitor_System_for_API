import {z} from "zod";
import rabbitmq from "../../shared/config/rabbitmq.js";
import mongodb from "../../shared/config/mongodb.js";
import config from "../../shared/config/index.js";
import logger from "../../shared/config/logger.js";

import processorContainer from "./dependencies/dependencies.js";
import {EVENT_TYPES} from "../../shared/events/eventTypes.js";
import {RetryStrategy} from "../../shared/events/producer/RetryStrategy.js";
import {CircuitBreaker} from "../../shared/events/producer/CircuitBreaker.js";

const messageSchema=z.object({
    type:z.enum([EVENT_TYPES.API_HIT]),
    data:z.record(z.string(),z.unknown()),
    messageId:z.string().optional(),
    timestamp:z.union([z.number(),z.string()]).optional(),
});

class EventConsumer
{
    constructor({processorService,rabbitmq,mongodb,postgres,config,logger,retryStrategy,circuitBreaker})
    {
      this._processorService=processorService;
      this._rabbitmq=rabbitmq;
      this._mongodb=mongodb;
      this._postgres=postgres;
      this._config=config;
      this._logger=logger;
      this._retryStrategy=retryStrategy;
      this._circuitBreaker=circuitBreaker;

      this.isRunning=false;
      this.channel=null;
      this._stats={
        processed:0,
        failed:0,
        retries:0
      };
      this._processedIds=new Set();
      this._poisonMessages=new Set(); //constructive failure count
    }
    
}