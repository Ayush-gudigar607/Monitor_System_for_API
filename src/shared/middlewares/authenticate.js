import config from "../config/index.js";
import ResponceFormatter from "../utils/ResponceFormatter.js";
import logger from "../config/logger.js"


const authenticate=(req,res,next)=>
{
    try {
        let token=null;
        if(req.cookies && req.cookies.token)
        {
            token=req.cookies.token
        }
        if(!token)
        {
            return res.status(401).json(ResponceFormatter.error("Authentication token is required",401))
        }

        const decoded =jwt.verify(token,config.jwt.secret);
        const {userId,username,email,role,clienId}=decoded;
        req.user={userId,username,email,role,clienId};
        next();
    } catch (error) {
         logger.error("Authentication error:",{
            error: error.message,
            path:req.path,
        })

        if(error.name==="TokenExpiredError")
        {
            return res.status(401).json(ResponceFormatter.error("Authentication token has expired",401))
        }
    return res.status(401).json(ResponceFormatter.error("Invalid authentication token",401))

    }
}

export default authenticate;