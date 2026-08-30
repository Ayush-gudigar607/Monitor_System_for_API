import { EVENT_TYPES } from "../eventContracts.js";
import { isRetryable } from "./RetryStratergy.js";

export class EventProducer {
  constructor({
    channelManager,
    circuitBreaker,
    retryStrategy,
    logger,
    queueName,
  }) 
  {
    if (!channelManager) throw new Error("channelManager is required");
    if (!circuitBreaker) throw new Error("circuitBreaker is required");
    if (!retryStrategy) throw new Error("retryStrategy is required");
    if (!logger) throw new Error("logger is required");
    if (!queueName) throw new Error("queueName is required");

    this.channelManager = channelManager;
    this.circuitBreaker = circuitBreaker;
    this.retryStrategy = retryStrategy;
    this.logger = logger;
    this.queueName = queueName;

    this.metrics = {
      published: 0,
      failed: 0,
      retriesExhausted: 0,
    };

    this._shutdown = false;
  }

  //track system health
  _incrementMetric(metric) {
    this.metrics[metric] = (this.metrics[metric] || 0) + 1;
  }

  async publish(eventData, { correlationId, attempt }) {
    const channel = await this.channelManager.getChannel();
    if (!channel) {
      this.logger.error("No channel available for publishing");
      throw new Error("No channel available for publishing");
    }

    const message = {
      type: EVENT_TYPES.API_HIT,
      data: eventData,
      publihsedAt: new Date().toISOString(),
      attempt: attempt + 1,
    };

    //convert into buffer

    const messageBuffer = Buffer.from(JSON.stringify(message));

    const publishOptions = {
      persistent: true,
      contentType: "application/json",
      messageId: eventData.eventId,
      correlationId: correlationId,
      timeStamp: Math.floor(Date.now() / 1000),
    };

    return new Promise((resolve, reject) => {
      const written = channel.publish(
        "",
        this.queueName,
        messageBuffer,
        publishOptions,
        (err) => {
          if (err) {
            return reject(
              new Error(`Failed to publish message: ${err.message}`),
            );
          }
          resolve();
        },
      );

      if (!written) {
        this.logger.warn("Channel buffer is full, waiting for drain event", {
          eventId: eventData.eventId,
          correlationId: correlationId,
          queueName: this.queueName,
        });
      }

      const OnDrain = () => {
        channel.removeListener("drain", OnDrain);
        this.logger.info("Channel buffer drained, resuming publishing", {
          eventId: eventData.eventId,
          correlationId: correlationId,
          queueName: this.queueName,
        });
      };
      channel.on("drain", OnDrain);
    });
  }

  async shutDown() {
    this._shutdown = true;
    this.logger.info("Shutting down EventProducer");
    await this.channelManager.close();
    this.logger.info("EventProducer shutdown complete");
  }

  async getStatus() {
    return {
      metrics: { ...this.metrics },
      circuitBreakerState: this.circuitBreaker.snapshot(),
      // channelStatus:this.channelManager.getStatus(),
    };
  }

  async publishApiHit(eventData, opts = {}) {
    if (this._shutdown) {
      const error = new Error(
        "EventProducer is shutting down, cannot publish new events",
      );
      const code = "SHUTDOWN";
      this.logger.warn(`[EventProducer] publish rejected-shutting down`, {
        eventId: eventData.eventId,
        queueName: this.queueName,
      });

      throw error;
    }

    if (!this.circuitBreaker.allowedRequest()) {
      const error = new Error(
        "Circuit breaker is open, cannot publish new events",
      );
      error.code = "CIRCUIT_BREAKER_OPEN";
      this.logger.warn(
        `[EventProducer] publish rejected-circuit breaker open`,
        {
          eventId: eventData.eventId,
          queueName: this.queueName,
        },
      );
      return false;
    }

    const correlationId =
      opts.correlationId ||
      `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const startMs = Date.now();
    let attempt = 0;

    while (true) {
      try {
        await this.publish(eventData, { correlationId, attempt });
        const latencyMs = Date.now() - startMs;
        this.circuitBreaker.onSuccess();
        this._incrementMetric("published");

        this.logger.info(`[EventProducer] Event published successfully`, {
          eventId: eventData.eventId,
          correlationId: correlationId,
          queueName: this.queueName,
          latencyMs: latencyMs,
          attempt: attempt + 1,
        });
        return true;
      } catch (err) {
        this.logger.error(`[EventProducer] Failed to publish event`, {
          eventId: eventData.eventId,
          correlationId: correlationId,
          queueName: this.queueName,
          error: err.message,
          stack: err.stack,
          code: err.code,
          attempt: attempt + 1,
        });

        const isRetryable =
          isRetryable(err) && this.retryStrategy.shouldRetry(attempt);
        if (!isRetryable) {
          this.circuitBreaker.onFailure();
          this._incrementMetric("failed");

          if (!this.retryStrategy.shouldRetry(attempt)) {
            this._incrementMetric("retriesExhausted");
          }
          this.circuitBreaker.onFailure();
          this._incrementMetric("failed");
          throw err;

          this.logger.error(
            `[EventProducer] Event publishing failed, not retrying`,
            {
              eventId: eventData.eventId,
              correlationId: correlationId,
              queueName: this.queueName,
              attempt: attempt,
              error: err.message,
              stack: err.stack,
              code: err.code,
              attempt: attempt + 1,
            },
          );
          //"The event was NOT published because the failure should not be retried."
          return false;
        }

        await this.retryStrategy.wait(attempt);
        attempt++;
        this.logger.warn(`[EventProducer] Retrying event publish`, {
          eventId: eventData.eventId,
          correlationId: correlationId,
          queueName: this.queueName,
          attempt: attempt,
        });
      }
    }
  }
}
