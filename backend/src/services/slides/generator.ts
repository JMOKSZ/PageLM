import { slidesService } from "./index";
import { getMsgs } from "../../utils/chat/chat";
import { createChatModel } from "../../agents/shared";
import { generateImage } from "./image";

interface Slide {
  id: string;
  title: string;
  bullets: string[];
  speakerNotes?: string;
  imageUrl?: string;
  type: "opening" | "concept" | "detail" | "summary" | "closing";
}

interface SlidePlan {
  type: string;
  focus: string;
  estimatedPoints: number;
}

interface PresentationPlan {
  title: string;
  subtitle?: string;
  targetAudience?: string;
  estimatedSlides: number;
  slides: SlidePlan[];
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

// Stage 1: Analyze content and create presentation plan
async function createPresentationPlan(content: string, model: any): Promise<PresentationPlan> {
  const analysisPrompt = `Analyze the following content and create a presentation plan.

Content:
"""
${content.slice(0, 8000)}
"""

First, analyze:
- Main topic/theme
- Key concepts and sub-topics
- Complexity level
- Logical flow/structure

Then, create a slide plan. Rules:
- Opening slide: title + overview
- Content slides: 1 slide per major concept or logical section
- Closing slide: summary or conclusion
- Total slides: 4-12 based on content richness

Return ONLY a JSON object in this exact format:
{
  "title": "Main Presentation Title (concise, catchy)",
  "subtitle": "Optional subtitle explaining the focus",
  "targetAudience": "Who this is for",
  "estimatedSlides": number,
  "slides": [
    {"type": "opening", "focus": "what this presentation covers", "estimatedPoints": 2},
    {"type": "concept", "focus": "first key concept name", "estimatedPoints": 3},
    {"type": "detail", "focus": "sub-topic or example", "estimatedPoints": 3},
    {"type": "concept", "focus": "second key concept", "estimatedPoints": 3},
    ...
    {"type": "summary", "focus": "main takeaways", "estimatedPoints": 3}
  ]
}

Use these slide types:
- opening: title slide with overview
- concept: major idea/section (usually 2-5 per presentation)
- detail: sub-topic, example, or deep-dive
- summary: key takeaways
- closing: final thoughts or call to action`;

  const response = await model.invoke(analysisPrompt);
  const text = String(response.content);
  
  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse presentation plan");
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Stage 2: Generate content for a specific slide
async function generateSlideContent(
  slidePlan: SlidePlan,
  index: number,
  total: number,
  content: string,
  presentationTitle: string,
  model: any
): Promise<Slide> {
  const slidePrompt = `Generate detailed content for slide ${index + 1} of ${total}.

Presentation Title: "${presentationTitle}"
Slide Type: ${slidePlan.type}
Focus: ${slidePlan.focus}
Target Points: ${slidePlan.estimatedPoints}

Source Content:
"""
${content.slice(0, 6000)}
"""

Generate slide content following these rules:
- Title: max 8 words, clear and impactful
- Bullets: ${slidePlan.estimatedPoints} points, concise (10-15 words each)
- Each bullet should be a complete thought
- Use specific details from source content, not generic statements
- Speaker notes: 1-2 sentences expanding on the key message

Return ONLY a JSON object:
{
  "title": "Slide Title",
  "bullets": ["point 1", "point 2", "point 3"],
  "speakerNotes": "Additional context or explanation"
}`;

  const response = await model.invoke(slidePrompt);
  const text = String(response.content);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse slide ${index + 1} content`);
  }
  
  const slideData = JSON.parse(jsonMatch[0]);
  
  return {
    id: `slide-${index}`,
    title: slideData.title,
    bullets: slideData.bullets || [],
    speakerNotes: slideData.speakerNotes,
    type: slidePlan.type as Slide["type"],
  };
}

// Generate image prompt based on slide content
function createImagePrompt(slide: Slide, presentationTitle: string): string {
  const basePrompt = slide.type === "opening" 
    ? `${presentationTitle}. Professional presentation cover, clean modern design, no text.`
    : `${slide.title}. Educational illustration, clean minimalist style, abstract concept visualization, no text.`;
  
  return basePrompt;
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
    
    if (!content.trim()) {
      throw new Error("No content provided");
    }
    
    // Send ready event
    sendEvent(slidesId, { type: "ready", slidesId });
    
    // === STAGE 1: Create Presentation Plan ===
    sendEvent(slidesId, { type: "phase", value: "planning" });
    
    const plan = await createPresentationPlan(content, model);
    
    sendEvent(slidesId, { 
      type: "plan", 
      title: plan.title,
      subtitle: plan.subtitle,
      targetAudience: plan.targetAudience,
      estimatedSlides: plan.estimatedSlides 
    });
    
    // === STAGE 2: Generate Each Slide ===
    const slides: Slide[] = [];
    
    for (let i = 0; i < plan.slides.length; i++) {
      sendEvent(slidesId, { type: "phase", value: `generating_slide_${i + 1}` });
      
      const slidePlan = plan.slides[i];
      const slide = await generateSlideContent(
        slidePlan,
        i,
        plan.slides.length,
        content,
        plan.title,
        model
      );
      
      // Generate image for opening slide
      if (i === 0 && process.env.REPLICATE_API_TOKEN) {
        try {
          const imagePrompt = createImagePrompt(slide, plan.title);
          slide.imageUrl = await generateImage(imagePrompt);
        } catch (e) {
          console.log("Image generation failed:", e);
        }
      }
      
      slides.push(slide);
      sendEvent(slidesId, { type: "slide", slide });
      
      // Small delay between slides for streaming effect
      await new Promise(r => setTimeout(r, 300));
    }
    
    sendEvent(slidesId, { type: "done", totalSlides: slides.length });
  } catch (error) {
    console.error("Slides generation error:", error);
    sendEvent(slidesId, { type: "error", error: String(error) });
  } finally {
    slidesService.cleanup(slidesId);
    unregisterClient(slidesId);
  }
}
