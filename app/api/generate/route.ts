/* eslint-disable import/no-anonymous-default-export */

import Replicate from "replicate";
import { NextResponse } from "next/server";

type Input = {
  inputs: string;
};

async function query(data: Input) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/Gustavosta/MagicPrompt-Stable-Diffusion",
    {
      headers: {
        Authorization: "Bearer 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",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
}

export async function POST(req: Request, res: Response) {
  const replicate = new Replicate({
    auth: String(process.env.REPLICATE_API_TOKEN),
  });

  const body = await req.json();
  const { message, selectedImage, width, height, noOfOutputs }: any = body;

  query({ inputs: message }).then((response) => {
    console.log(JSON.stringify(response));
  });

  try {
    const newOutput: any = await replicate.run(
      "dummybanana/arcane:ae8f35faeba8f07aeb6d85807f6487e7edd1c35791efc4ef3a6589c4515c9849",
      {
        input: {
          prompt: `arcane style, ${message}, 8k uhd, hyper realistic, focused,dslr, unreal engine 5 , cinematic ,masterpiece  , soft lighting, high quality, film grain, Fujifilm XT3, best quality, extremely detailed`,
          negative_prompt: `longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality`,
          num_inference_steps: 20,
          num_outputs: noOfOutputs,
          image: selectedImage,
          width: width,
          height: height,
        },
      }
    );
    return NextResponse.json({ newOutput });
  } catch (error) {
    console.error("Error generating output:", error);
  }
}
