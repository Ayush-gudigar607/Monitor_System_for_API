export const CircuitState = Objects.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
});

export class CircuitBreaker {
  constructor(opts = {}) {
    this.failureThreshold = opts.failureThreshold || 5;
    this.coolDownMs = opts.coolDownMs || 30000; // 10 seconds
    this.halfOpenMaxAttempts = opts.halfOpenMaxAttempts || 2;
    this.logger = opts.logger || console;

    this._state = CircuitState.CLOSED;
    this._failures = 0;
    this._halfOpenAttempts = 0;
    this._halfOpenSuccesses = 0;
    this._lastfailureTime = 0;
  }


  /**
   * Checks if the cooldown period has elapsed.
    * @returns {boolean} True if the cooldown period has elapsed, false otherwise.
    */
  _coolDownElapsed() {
    return new Date() - this._lastfailureTime > this.coolDownMs;
  }

  _transitionTo(newState) {
    const prev = this._state;
    this._state = newState;

    if (newState === CircuitState.OPEN) {
      this._halfOpenAttempts = 0;
      this._halfOpenSuccesses = 0;

      this.logger.info(`[CircuitBreaker] ${prev} => OPEN`);
    } else if(newState === CircuitState.HALF_OPEN)
      {
        this._halfOpenAttempts=0;
        this._halfOpenSuccesses=0;

          this.logger.info(
            `[CircuitBreaker] ${prev} => HALF_OPEN`
        );
      }
    }

    _openCircuit() {
        this._lastfailureTime = new Date();
        this._transitionTo(CircuitState.OPEN);
       this.logger.error(`[CircuitBreaker] OPEN`, {
            failures:    this._failures,
            cooldownMs:  this.cooldownMs
        });   
     }

     getstate() {
        if (this._state === CircuitState.OPEN && this._coolDownElapsed()) {
            this._transitionTo(CircuitState.HALF_OPEN);
        }
        return this._state;
    }

    allowedRequest()
    {
        const currentState=this.getstate();

        if(currentState===CircuitState.CLOSED) return true;

        if(currentState===CircuitState.OPEN) return false;

        if(currentState===CircuitState.HALF_OPEN){
            if(this._halfOpenAttempts < this.halfOpenMaxAttempts)
            {
                this._halfOpenAttempts++;
                return true;
            }
            return false;
        }
    }

    onSucces()
    {
        if(this._state===CircuitState.HALF_OPEN)
        {
            this._halfOpenSuccesses++;
            if(this._halfOpenSuccesses>=this.halfOpenMaxAttempts)
            {
                this._reset();
                this.logger.info(`CircuitBreaker: HALF_OPEN => CLOSED`);
            }
            return;
        }

        if(this._failures>0)
        {
            this._failures=0;
            this.logger.info(`CircuitBreaker: Resetting failure count to 0`);
        }

        
    }

    onFailure()
    {
        if(this._state===CircuitState.HALF_OPEN){
            this.logger.warn(`CircuitBreaker: HALF_OPEN => OPEN due to failure`);
            this._openCircuit();
            return;
        }

        this._failures++;
        this._lastfailureTime=new Date();

        if(this._failures>=this.failureThreshold)
        {
            this.logger.error(`CircuitBreaker: CLOSED => OPEN due to failure threshold reached`);
            this._openCircuit();
        }
    }

   snapshot() {
    return {
      state: this._state,
      failures: this._failures,
      lastFailureTime: this._lastFailureTime,
      halfOpenAttempts: this._halfOpenAttempts,
      halfOpenSuccesses: this._halfOpenSuccesses,
      coolDownMs: this.coolDownMs,
      failureThreshold: this.failureThreshold,
    };
  }
  }

