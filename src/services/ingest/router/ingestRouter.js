import express from "express";
import rateLimit from "express-rate-limit";
import config from "../../../shared/config/index.js";
import validateApiKey from "../../../shared/middlewares/validateApiKey.js";

const router = express.Router();


const ingestLimitter=rateLimit({
  windowMs:config.ingest.rateLimit.windowMs,
  max:config.ingest.rateLimit.max,
 message:{
        success:false,
        message:"Too many requests,please try again later",
        statusCode:429
    },
      standardHeaders:true,
  legacyHeaders:false
});

router.post("/",validateApiKey,ingestLimitter,(req,res)=>{
     ingestController.ingestHit(req,res,next);
});

export default router;