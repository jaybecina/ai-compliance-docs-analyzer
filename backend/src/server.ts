import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });
import { createApp } from "./app";

const PORT = process.env.PORT || 8000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
