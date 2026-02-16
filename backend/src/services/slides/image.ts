import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export async function generateImage(prompt: string): Promise<string> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not set");
  }
  
  const output = await replicate.run(
    "baumannlab/nano-bannana:2c5476c6a915d984b3e98c4721fcfac3e82529bb5b4f4a4e6951d4cb85b8b1dd",
    {
      input: {
        prompt,
        width: 1024,
        height: 576,  // 16:9 for slides
        num_inference_steps: 4,  // Fast generation
      },
    }
  );
  
  if (Array.isArray(output) && output.length > 0) {
    return output[0] as string;
  }
  
  throw new Error("Image generation failed");
}
