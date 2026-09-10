import moongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await moongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

export default connectDB;