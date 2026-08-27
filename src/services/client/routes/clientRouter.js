import express from "express";
import {} from "../../../shared/middlewares/authenticate.js";

const router=express.Router();

//This router will handle all the client related routes
router.use(authenticate);

router.post("/admin/client/onboard",async(req,res,next)=>
{
    clientController.createClient(req,res,next);
})