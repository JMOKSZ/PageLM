import { slidesService } from "./index";
import { getMsgs } from "../../utils/chat/chat";
import { createChatModel } from "../../agents/shared";
import { generateImage } from "./image";

interface Slide {
  id: string;
  title: string;
  bullets: string[];
  imageUrl?: string;
}

const clients = new Map<string, any>();

export function registerClient(slidesId: string, ws: any) {
  clients.set(slidesId, ws);
}

export function unregisterClient(slidesId: string) {
  clients.delete(slidesId);
}

function sendEvent(slidesId: string, event: any) {
  const ws = clients.get(slidesId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(event));
  }
}

export async function generateSlides(slidesId: string, params: { chatId?: string; topic?: string; filePath?: string }) {
  try {
    const model = createChatModel();
    
    // Gather content
    let content = "";
    if (params.chatId) {
      const messages = await getMsgs(params.chatId);
      content = messages.map(m => `${m.role}: ${m.content}`).join("\n\n");
    } else if (params.topic) {
      content = params.topic;
    }
    
    // Send ready event
    sendEvent(slidesId, { type: "ready", slidesId });
    
    // Generate title
    const titlePrompt = `Generate a concise title (max 10 words) for a presentation about:\n\n${content.slice(0, 2000)}`;
    const titleResponse = await model.invoke(titlePrompt);
    const title = String(titleResponse.content).trim().replace(/^["']|["']$/g, "");
    sendEvent(slidesId, { type: "title", value: title });
    
    // Generate slides structure
    const structurePrompt = `Create a presentation outline with 5-8 slides based on this content. 
Return ONLY a JSON array with this exact format:
[
  {"title": "Slide Title", "points": ["point 1", "point 2", "point 3"]},
  ...
]

Content:\n${content.slice(0, 5000)}`;

    const structureResponse = await model.invoke(structurePrompt);
    const structureText = String(structureResponse.content);
    
    // Extract JSON
    const jsonMatch = structureText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to generate slide structure");
    }
    
    const slidesData = JSON.parse(jsonMatch[0]);
    
    // Generate each slide with optional image
    for (let i = 0; i < slidesData.length; i++) {
      const slideData = slidesData[i];
      
      // Generate image for first slide
      let imageUrl: string | undefined;
      if (i === 0 && process.env.REPLICATE_API_TOKEN) {
        try {
          const imagePrompt = `${slideData.title}. Educational illustration, clean minimalist style, no text.`;
          imageUrl = await generateImage(imagePrompt);
        } catch (e) {
          console.log("Image generation failed:", e);
        }
      }
      
      const slide: Slide = {
        id: `slide-${i}`,
        title: slideData.title,
        bullets: slideData.points || [],
        imageUrl,
      };
      
      sendEvent(slidesId, { type: "slide", slide });
      
      // Small delay between slides for streaming effect
      await new Promise(r => setTimeout(r, 500));
    }
    
    sendEvent(slidesId, { type: "done" });
  } catch (error) {
    console.error("Slides generation error:", error);
    sendEvent(slidesId, { type: "error", error: String(error) });
  } finally {
    slidesService.cleanup(slidesId);
    unregisterClient(slidesId);
  }
}
