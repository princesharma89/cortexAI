import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan";

import protect from "./middleware/auth.middleware.js";
import { getCurrentUser} from "./controllers/user.controller.js";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(morgan("dev"));
app.use(cookieParser());

app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => req.originalUrl.replace("/api", ""),
  })
);
app.use("/api/chat",protect, proxyWithHeader(process.env.CHAT_SERVICE_URL));
app.use("/api/agent",protect, proxy(process.env.AGENT_SERVICE_URL));
app.get("/api/me",protect,getCurrentUser)

app.get("/auth", (req, res) => {
  res.send({message: "hello from gateway"});
});

app.listen(port, () => {
  console.log(`Gateway server is running on port ${port}`);
})