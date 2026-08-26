import amqp from "amqplib";
import config from "./index.js";
import logger from "./logger.js";

class RabbitMqConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.channel) {
      return this.channel;
    }

    if (this.isConnecting) {
      //a b c =====>
      //a b ======> c
      //a ======> b =====> c
      //if connection is in progress then wait for 100 ms and try again
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      return this.channel;

      try {
        this.isConnecting = true;
        logger.info("Connecting to RabbitMQ...", config.rabbitmq.url);
        this.connection = await amqp.connect(config.rabbitmq.url);
        this.channel = await this.connection.createChannel();

        //creating key
        const dlqName = `${config.rabbitmq.queue}.dlq`;

        //DL QUEUE
        await this.channel.assertQueue(dlqName, {
          durable: true,
        });

        //normal queue
        await this.channel.assertQueue(config.rabbitmq.queue, {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": dlqName,
          },
        });

        logger.info("Rabbitmq connected successfully");

        //when connection closed
        this.connection.on("close",()=>
        {
            logger.error("Rabbitmq connection closed");
            this.connection=null;
            this.channel=null;
        })

        //when error occurs
        this.connection.on("error",(err)=>
        {
            logger.error("Rabbitmq connection error",err);
            this.connection=null;
            this.channel=null;
        })

        return this.channel;

      } catch (error) {
        logger.error("Error connecting to RabbitMQ:", error);
        throw error;
      }
      finally {
        this.isConnecting = false;
      }
    }
  }

  getChannel()
  {
    return this.channel;
  }

  getStatus()
  {
    if(!this.connection || !this.channel) return "disconnected";
    if(this.connection.closing) return "closing";
    return "connected";
  }

  async close()
  {
    try {
        if(this.channel)
        {
            await this.channel.close();
            this.channel=null;
        }
        if(this.connection)
        {
            await this.connection.close();
            this.connection=false;
        }
        logger.info("Rabbitmq connection closed successfully");
    } catch (error) {
        logger.error("Error closing Rabbitmq connection");
    }
  }
}

export default new RabbitMqConnection;
