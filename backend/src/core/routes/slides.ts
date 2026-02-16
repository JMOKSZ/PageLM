import { slidesService } from "../services/slides";

export function slidesRoutes(app: any) {
  app.post("/slides", async (req: any, res: any) => {
    try {
      const { chatId, topic, filePath } = req.body;
      const result = await slidesService.start({ chatId, topic, filePath });
      res.json({ ok: true, slidesId: result.slidesId, stream: result.stream });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });
}
