import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/agent.route.js";


dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use("/",router);
app.use((err, req, res, next) => {
  console.log(err);

  if (err.status) {
    return res.status(err.status).json(err.data);
  }

  return res.status(500).json({ message: `agent error ${err.message || err}` });
});
app.get("/", (req, res) => {
  res.send({message: "hello from agent"});
});

app.listen(port, () => {
  connectDB();
  console.log(`Agent server is running on port ${port}`);
})