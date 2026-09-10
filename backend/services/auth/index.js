import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.send({message: "hello from auth"});
});

app.listen(port, () => {
  connectDB();
  console.log(`Auth server is running on port ${port}`);
})