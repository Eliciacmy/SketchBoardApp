import clientPromise from "@/services/mongo/mongodb";
import { NextResponse } from "next/server";
import cloudinary from "cloudinary";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "80mb", // Set desired value here
    },
  },
};

export async function POST(req: Request, res: Response) {
  const client = await clientPromise;
  const db = client.db("imgendata");
  const body = await req.json();

  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  try {
    const tempCollection = db.collection("temp");

    const uploadedImageURLs = await Promise.all(
      body.map(async (base64Image: string) => {
        const result = await cloudinary.v2.uploader.upload(base64Image);
        return result.secure_url;
      })
    );

    const result = await tempCollection.insertOne({
      images: uploadedImageURLs,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error generating output:", error);
  }
}
