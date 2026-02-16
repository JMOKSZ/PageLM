import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { slidesStart, connectSlidesStream, type Slide, type SlidesEvent } from "../lib/api";

export default function Slides() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatId = searchParams.get("chatId");
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (chatId) {
      generateSlides(chatId);
    }
  }, [chatId]);

  const generateSlides = async (cid: string) => {
    setLoading(true);
    setError("");
    try {
      const { slidesId } = await slidesStart({ chatId: cid });
      
      connectSlidesStream(slidesId, (ev: SlidesEvent) => {
        if (ev.type === "slide") {
          setSlides(prev => [...prev, ev.slide!]);
        } else if (ev.type === "title") {
          setTitle(ev.value || "");
        } else if (ev.type === "done") {
          setLoading(false);
        } else if (ev.type === "error") {
          setError(ev.error || "生成失败");
          setLoading(false);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
      setLoading(false);
    }
  };

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSlides([]);
    try {
      const { slidesId } = await slidesStart({ topic: topic.trim() });
      
      connectSlidesStream(slidesId, (ev: SlidesEvent) => {
        if (ev.type === "slide") {
          setSlides(prev => [...prev, ev.slide!]);
        } else if (ev.type === "title") {
          setTitle(ev.value || "");
        } else if (ev.type === "done") {
          setLoading(false);
        } else if (ev.type === "error") {
          setError(ev.error || "生成失败");
          setLoading(false);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
      setLoading(false);
    }
  };

  const exportToPPTX = () => {
    // TODO: 导出 PPTX 功能
    alert("PPTX 导出功能开发中...");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!chatId && slides.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-3xl font-bold text-white text-center">生成 Slides</h1>
          <p className="text-stone-400 text-center">
            输入主题，或先去 <button onClick={() => navigate('/chat')} className="text-blue-400 hover:underline">Chat</button> 上传文档
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入主题..."
              className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-stone-600"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromTopic()}
            />
            <button
              onClick={handleGenerateFromTopic}
              disabled={!topic.trim() || loading}
              className="w-full py-3 bg-white text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-200 transition-colors"
            >
              {loading ? "生成中..." : "生成 Slides"}
            </button>
          </div>
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900 rounded-xl text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white truncate">{title || "Slides"}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPPTX}
            disabled={slides.length === 0}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-stone-700 transition-colors"
          >
            导出 PPTX
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && slides.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-stone-700 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-stone-400">正在生成 Slides...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900 rounded-xl text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Slide Viewer */}
      {slides.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Slide Content */}
          <div className="flex-1 bg-stone-900 rounded-2xl p-8 md:p-12 flex flex-col justify-center min-h-[400px]">
            <div className="max-w-4xl mx-auto w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {slides[currentSlide]?.title}
              </h2>
              <ul className="space-y-4">
                {slides[currentSlide]?.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-lg md:text-xl text-stone-300">
                    <span className="w-2 h-2 bg-white rounded-full mt-2.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {slides[currentSlide]?.imageUrl && (
                <img 
                  src={slides[currentSlide].imageUrl} 
                  alt={slides[currentSlide].title}
                  className="mt-8 max-h-64 object-contain rounded-xl"
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl disabled:opacity-50 hover:bg-stone-700 transition-colors"
            >
              ← 上一页
            </button>
            
            <span className="text-stone-400">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="px-6 py-3 bg-stone-800 text-white rounded-xl disabled:opacity-50 hover:bg-stone-700 transition-colors"
            >
              下一页 →
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`shrink-0 w-24 h-16 rounded-lg border-2 text-xs p-2 text-left truncate ${
                  idx === currentSlide 
                    ? 'border-white bg-stone-800 text-white' 
                    : 'border-stone-800 bg-stone-900 text-stone-500 hover:border-stone-600'
                }`}
              >
                {idx + 1}. {slide.title.slice(0, 15)}...
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
