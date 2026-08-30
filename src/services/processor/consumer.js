import {z} from "zod";
import rabbitmq from "../../shared/config/rabbitmq.js";
import mongodb from "../../shared/config/mongodb.js";
import config from "../../shared/config/index.js";
import logger from "../../shared/config/logger.js";

import processorContainer from "./dependencies/dependencies.js";
import {EVENT_TYPES} from "../../shared/events/eventTypes.js";
