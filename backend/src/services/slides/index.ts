import { v4 as uuidv4 } from "uuid";
import { generateSlides } from "./generator";

interface StartParams {
  chatId?: string;
  topic?: string;
  filePath?: string;
}

interface StartResult {
  slidesId: string;
  stream: string;
}

const activeStreams = new Map<string, any>();

export const slidesService = {
  async start(params: StartParams): Promise<StartResult> {
    const slidesId = uuidv4();
    const stream = `/ws/slides?slidesId=${slidesId}`;
    
    // Store the stream info for WebSocket connection
    activeStreams.set(slidesId, {
      params,
      createdAt: Date.now(),
    });
    
    // Start generation in background
    generateSlides(slidesId, params).catch(console.error);
    
    return { slidesId, stream };
  },
  
  getStreamInfo(slidesId: string) {
    return activeStreams.get(slidesId);
  },
  
  cleanup(slidesId: string) {
    activeStreams.delete(slidesId);
  },
};

export type { StartParams, StartResult };
