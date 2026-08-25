import logger from "../config/logger.js";
import ResponceFormatter from "../utils/ResponceFormatter.js";

const errorHandler=(err,req,res,next)=>
{
    let statusCode=err.statusCode || 500;
    let message=err.message || "Internal server error"
    let errors=err.errors || null;

    //Invalid json
    if(err instanceof syntaxError && err.statusCode===400 && "body" in err)
    {
        statusCode=400;
        message="Invalid JSON payload";
    }

    //Mongoose validation error
    else if(err.name==="validationError")
        {
            statusCode=400,
            message="validationError",
            errors=Object.values(err.errors).map((e)=>e.message)
    }
    //duplicate key(MongoDB)
    else if(err.name==="MongoServerError" && err.code===11000)
    {
        statusCode=400;
        message="Duplicate key Error";
        errors=Object.keys(err.KeyValue);
    }

    else if(err.name ==="JsonWebTokenError")
    {
        statusCode=401;
        message="Invalid token";
    }

    else if(err.name ==="TokenExpiredError")
    {
        statusCode=401;
        message="Token Expired";
    }

    logger.error("API ERROR",
        {
            message:err.message,
            statusCode,
            stack:err.stack,
            path:req.originalUrl,
            method:req.method,
            ip:req.ip,
        }
    );

    res.status(statusCode).json(ResponceFormatter.error(message,statusCode,errors))


}

export default errorHandler;