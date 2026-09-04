import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import {v4 as uuidv4} from "uuid";

export class ingestService{
    constructor({eventProducer})
    {
        if(!eventProducer)
        {
            throw new Error("EventProducer is Required");
        }

        this.eventProducer=eventProducer;
    }

    _validateHitData(hitData)
    {
        const requiredFields=[
            "serviceName",
            "endpoint",
            "method",
            "statusCode",
            "latencyMs",
            "clientId",
        ];

        const missingFields=requiredFields.filter((field)=>!hitData[field]);
        
        if(missingFields.length>0)
        {
            throw new AppError(`Missing required fields: ${missingFields.join(", ")}`,400);
        }

        const validMethods=["GET","POST","PUT","DELETE","PATCH","OPTIONS","HEAD"];

        if(!validMethods.includes(hitData.method.toUpperCase()))
        {
            throw new AppError(`Invalid HTTP method: ${hitData.method}`,400);
        }

        const statusCode=parseInt(hitData.statusCode,10);
        if(isNaN(statusCode)||statusCode<100||statusCode>599)
        {
            throw new AppError(`Invalid HTTP status code: ${hitData.statusCode}`,400);
        }

        const latencyMs=parseFloat(hitData.latencyMs);
        if(isNaN(latencyMs)||latencyMs<0)
        {
            throw new AppError(`Invalid latencyMs value: ${hitData.latencyMs}`,400);
        }

        return true;
       
    }

    async ingestApiHit(hitData)
    {
        try{
           this._validateHitData(hitData);

           const event={
            eventId:uuidv4(),
            timestamp:new Date,
            serverName:hitData.endpoint,
            endpoint:hitData.endpoint,
            method:hitData.method.toUpperCase(),
            statusCode:hitData.statusCode,
            latencyMs:parseFloat(hitData.latencyMs),
            clientId:hitData.clientId,
            apiKeyId:hitData.apiKeyId,
            ip:hitData.ip || 'unknown',
            userAgent:hitData.userAgent || ''
           };

           const published=await this.eventProducer.publishApiHit(event);

           if(!published)
           {
            logger.error("Failed to publish API hit event",{
                eventId:event.eventId,
                endpoint:event.endpoint,
                method:event.method,
                clientId:event.clientId,
                apiKeyId:event.apiKeyId
            });

            return {
                eventId:event.eventId,
                status:'rejected',
                reason:'service_unavailable',
                timestamp:new Date()
            }
           }

            logger.info("API hit ingested",{
                eventId: event.eventId,
                endpoint: event.endpoint,
                method: event.method,
                statusCode: event.statusCode,
                clientId: event.clientId,
            });

            return {
                eventId:event.eventId,
                status:'queued',
                timestamp:event.timestamp,
            }
        }
        catch(err)
        {
         logger.error("Error occured while validating hit data",{error});
         throw new AppError("Invalid hit data",400);
        }
    }
}