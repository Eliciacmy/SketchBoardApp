import clientPromise from "@/services/mongo/mongodb";
import { NextResponse } from "next/server";
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
  try {
    const tempCollection = db.collection("temp");
    const result = await tempCollection.deleteMany();
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}
