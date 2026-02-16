import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { slidesStart, connectSlidesStream, type Slide, type SlideType, type PresentationPlan, type SlidesEvent } from "../lib/api";

const slideTypeLabels: Record<SlideType, string> = {
  opening: "开场",
  concept: "核心概念",
  detail: "详细说明",
  summary: "总结",
  closing: "结尾",
};

const slideTypeColors: Record<SlideType, string> = {
  opening: "bg-blue-900/50 text-blue-300 border-blue-800",
  concept: "bg-emerald-900/50 text-emerald-300 border-emerald-800",
  detail: "bg-amber-900/50 text-amber-300 border-amber-800",
  summary: "bg-purple-900/50 text-purple-300 border-purple-800",
  closing: "bg-rose-900/50 text-rose-300 border-rose-800",
};

function getPhaseLabel(phase: string): string {
  if (phase === "planning") return "正在分析内容...";
  if (phase.startsWith("generating_slide_")) {
    const num = phase.replace("generating_slide_", "");
    return `正在生成第 ${num} 张 Slide...`;
  }
  return phase;
}

export default function Slides() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatId = searchParams.get("chatId");
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
  const [phase, setPhase] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (chatId) {
      generateSlides(chatId);
    }
  }, [chatId]);

  const handleEvent = (ev: SlidesEvent) => {
    switch (ev.type) {
      case "ready":
        setLoading(true);
        break;
      case "phase":
        setPhase(ev.value);
        break;
      case "plan":
        setPlan({
          title: ev.title,
          subtitle: ev.subtitle,
          targetAudience: ev.targetAudience,
          estimatedSlides: ev.estimatedSlides,
          slides: [], // 后端不传完整 plan，只传信息
        });
        break;
      case "slide":
        setSlides(prev => [...prev, ev.slide]);
        break;
      case "done":
        setLoading(false);
        setPhase("");
        break;
      case "error":
        setError(ev.error || "生成失败");
        setLoading(false);
        setPhase("");
        break;
    }
  };

  const generateSlides = async (cid: string) => {
    setLoading(true);
    setError("");
    setSlides([]);
    setPlan(null);
    try {
      const { slidesId } = await slidesStart({ chatId: cid });
      connectSlidesStream(slidesId, handleEvent);
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
    setPlan(null);
    try {
      const { slidesId } = await slidesStart({ topic: topic.trim() });
      connectSlidesStream(slidesId, handleEvent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
      setLoading(false);
    }
  };

  const exportToPPTX = () => {
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, slides.length]);

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

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">
            {plan?.title || "Slides"}
          </h1>
          {plan?.subtitle && (
            <p className="text-sm text-stone-500 truncate">{plan.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              showNotes ? 'bg-stone-700 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
            title="按 N 键切换"
          >
            备注
          </button>
          <button
            onClick={exportToPPTX}
            disabled={slides.length === 0}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-stone-700 transition-colors"
          >
            导出 PPTX
          </button>
        </div>
      </div>

      {/* Plan Info */}
      {plan && (
        <div className="mb-4 p-3 bg-stone-900/50 rounded-xl border border-stone-800">
          <div className="flex items-center gap-4 text-sm">
            {plan.targetAudience && (
              <span className="text-stone-400">
                受众: <span className="text-stone-300">{plan.targetAudience}</span>
              </span>
            )}
            <span className="text-stone-400">
              共 <span className="text-stone-300">{plan.estimatedSlides}</span> 张
            </span>
            {slides.length > 0 && (
              <span className="text-stone-400">
                已生成: <span className="text-emerald-400">{slides.length}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Phase Indicator */}
      {phase && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-900 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-300">{getPhaseLabel(phase)}</span>
          </div>
        </div>
      )}

      {/* Loading Initial */}
      {loading && slides.length === 0 && !phase && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-stone-700 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-stone-400">正在准备...</p>
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
      {currentSlideData && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Slide Content */}
          <div className="flex-1 bg-stone-900 rounded-2xl p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Type Badge */}
            <div className="absolute top-6 left-6">
              <span className={`px-3 py-1 rounded-full text-xs border ${slideTypeColors[currentSlideData.type]}`}>
                {slideTypeLabels[currentSlideData.type]}
              </span>
            </div>

            <div className="max-w-4xl mx-auto w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                {currentSlideData.title}
              </h2>
              <ul className="space-y-4">
                {currentSlideData.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-lg md:text-xl text-stone-300">
                    <span className="w-2 h-2 bg-white rounded-full mt-2.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {currentSlideData.imageUrl && (
                <img 
                  src={currentSlideData.imageUrl} 
                  alt={currentSlideData.title}
                  className="mt-8 max-h-64 object-contain rounded-xl"
                />
              )}
            </div>
          </div>

          {/* Speaker Notes */}
          {showNotes && currentSlideData.speakerNotes && (
            <div className="mt-4 p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-sm font-medium shrink-0">演讲备注</span>
                <p className="text-amber-200/80 text-sm">{currentSlideData.speakerNotes}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
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

          {/* Thumbnails with Type Indicators */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`shrink-0 w-28 h-20 rounded-lg border-2 text-left p-2 flex flex-col justify-between transition-colors ${
                  idx === currentSlide 
                    ? 'border-white bg-stone-800' 
                    : 'border-stone-800 bg-stone-900 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    slide.type === 'opening' ? 'bg-blue-500' :
                    slide.type === 'concept' ? 'bg-emerald-500' :
                    slide.type === 'detail' ? 'bg-amber-500' :
                    slide.type === 'summary' ? 'bg-purple-500' :
                    'bg-rose-500'
                  }`} />
                  <span className={`text-xs ${idx === currentSlide ? 'text-white' : 'text-stone-500'}`}>
                    {idx + 1}
                  </span>
                </div>
                <span className={`text-xs truncate ${idx === currentSlide ? 'text-white' : 'text-stone-400'}`}>
                  {slide.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
