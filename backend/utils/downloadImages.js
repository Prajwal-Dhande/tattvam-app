import fs from "fs";
import path from "path";
import axios from "axios";

export const downloadImage = async (url, filename) => {
  const dir = path.join(process.cwd(), "uploads/products");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, filename);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    response.data.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return `/uploads/products/${filename}`;
};
