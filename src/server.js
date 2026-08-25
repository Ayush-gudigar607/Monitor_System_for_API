import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import ResponceFormatter from "./shared/utils/ResponceFormatter.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.header["user-agent"], //browser info
  });
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json(
    ResponceFormatter.sucess(
      {
        status: "healthy",
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      "service is healthy",
    ),
  );
});


app.get('/',(req,res)=>
{
    res.status(200).json(ResponceFormatter.sucess({
        service:"Api Monitoring Service",
        version:'1.0.0',
        endpoints:[
            {
                health:'/health',
                auth:'/api/auth',
                ingest:'api/hit',
                analytics:'api/analytics'
            }
        ],
            description:"API HIT MONITORING SERVICE"
        
    }))
})

app.use((req,res)=>
{
    res.status(404).json(ResponceFormatter.error("Endpoints not found ",404))
})

const port = process.env.API_PORT;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
