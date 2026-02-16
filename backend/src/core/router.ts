import { chatRoutes } from "./routes/chat";
import { smartnotesRoutes } from "./routes/notes";
import { slidesRoutes } from "./routes/slides";

export function registerRoutes(app: any) {
  chatRoutes(app);
  smartnotesRoutes(app);
  slidesRoutes(app);
}
