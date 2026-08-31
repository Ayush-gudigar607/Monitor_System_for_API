import {union, z} from 'zod';
import rabbitmq from "../../shared/config/rabbitmq.js";
import logger from "../../shared/config/logger.js";
import postgres from "../../shared/config/postgres.js";
import mongodb from "../../shared/config/mongodb.js";
import {ProcessorContainer} from "./dependencies/dependencies.js";
import {EVENT_TYPES} from "../../shared/events/eventContracts.js";
import {RetryStrategy,isRetryable} from "../../shared/events/producer/RetryStrategy.js"
import {CircuitBreaker} from "../../shared/events/producer/CircuitBreaker.js";

const messageSchema=z.object({
  type:z.enum([EVENT_TYPES.API_HIT]),
  data:z.record(z.string(),z.unknown()),
  messageId:z.string().optional(),
  timestamp:z.union([z.string(),z.number()]).optional()
});

class EventConsumer{
  constructor({processorService,rabbitmq,mongodb,postgres,config,logger,retryStrategy,circuitBreaker})
  {
    this._processorService=processorService;
    this._rabbitmq=rabbitmq;
    this._mongodb=mongodb;
    this._postgres=postgres;
    this._config=config;
    this._logger=logger;
    this._retryStrategy=retryStrategy;
    this._circuitBreaker=circuitBreaker

    this.isRunning=false;
    this.channel=null;
    this._stats={
      processed:0,
      failed:0,
      retried:0,
      dlqRouted:0,
      lastProcessedAt:null
    };
    this._processedIds=new Set();
    this._poisonMessages=new Set()
  };

   async _connectDatabase()
   {
    const maxRetries=5;
    let retries=0;

    while(retries<maxRetries)
    {
      try {
        this._logger.info('Connecting to Databases');
        await Promise.all([
          this._mongodb.connect(),
          this._rabbitmq.connect()
        ])

        this._logger.info("Database Connections established");
        return;
      } catch (error) {
        retries++;
        this._logger.error(`Database Connection attempt ${retries} failed`,error);
        if(retries>=maxRetries)
        {
          throw new Error(`Failed to connect database after ${maxretries} attempts`);
        }
        //5000 * retries: This calculates the delay in milliseconds. If retries is 1, it waits 5 seconds. If retries is 2, it waits 10 seconds, and so on.
        await new Promise(resolve =>setTimeout(resolve,5000*retries))
      }
    }
   }

  async start()
  {
    try{
      await this._connectDatabase();
      
    }
    catch(err)
    {

    }
  }

}

