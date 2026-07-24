import { useParams, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ClipboardPaste,
  FileUp,
  Check,
  AlertCircle,
} from 'lucide-react';
import { getToolBySlug } from '../config/tools.config';
import type { ToolConfig } from '../config/tools.config';
import { processText } from '../services/editorService';

const FREE_WORD_LIMIT = 125;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ─── Mode Selector (Tabs Design) ─────────────────────────────────────────────
function ModeSelector({
  tool,
  activeMode,
  onSelect,
}: {
  tool: ToolConfig;
  activeMode: string;
  onSelect: (m: string) => void;
}) {
  if (!tool.modes || tool.modes.length === 0) return null;
  return (
    <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar w-full whitespace-nowrap scroll-smooth">
      {tool.modes.map((mode) => {
        const isActive = activeMode === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onSelect(mode.value)}
            className={`relative py-3 text-xs sm:text-sm font-semibold transition-all duration-150 border-b-2 flex-shrink-0 whitespace-nowrap`}
            style={{
              borderBottomColor: isActive ? tool.color.hex : 'transparent',
              color: isActive ? tool.color.hex : '#3f3f46', // zinc-700
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Word count badge ──────────────────────────────────────────────────────────
function WordCount({ count, limit }: { count: number; limit: number }) {
  const over = count > limit;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold tabular-nums ${over ? 'text-orange-500' : 'text-stone-600'}`}>
        {count} / {limit} words
      </span>
      {over && (
        <span className="flex items-center gap-0.5 text-[11px] text-orange-500 font-medium animate-pulse">
          <AlertCircle className="w-3 h-3" />
          Free limit
        </span>
      )}
    </div>
  );
}

// ─── Copy button with copied flash ────────────────────────────────────────────
function CopyButton({ text, disabled }: { text: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-850 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-stone-100/80 border border-stone-200"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <span>Copy Text</span>
      )}
    </button>
  );
}

// ─── Feedback bar ─────────────────────────────────────────────────────────────
function FeedbackBar({
  onFeedback,
  feedback,
}: {
  tool: ToolConfig;
  onFeedback: (r: 'good' | 'bad') => void;
  feedback: 'good' | 'bad' | null;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 border-t border-stone-100 rounded-b-[24px]">
      <span className="text-xs text-stone-600 font-medium flex-1">Was this result helpful?</span>
      <button
        onClick={() => onFeedback('good')}
        title="Good result"
        className={`p-1.5 rounded-lg transition-all duration-150 ${feedback === 'good'
            ? 'bg-emerald-100 text-emerald-600'
            : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
          }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onFeedback('bad')}
        title="Bad result"
        className={`p-1.5 rounded-lg transition-all duration-150 ${feedback === 'bad'
            ? 'bg-red-100 text-red-500'
            : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
          }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── AI Detector result panel ─────────────────────────────────────────────────
function DetectorResult({ probability }: { probability: number | null }) {
  if (probability === null) return null;
  const pct = Math.round(probability * 100);
  const isHigh = pct >= 70;
  const isMid = pct >= 40;
  const color = isHigh ? '#EA580C' : isMid ? '#D97706' : '#059669';
  const label = isHigh ? 'Likely AI-generated' : isMid ? 'Possibly AI-generated' : 'Likely human-written';
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E7E5E4" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-stone-800" style={{ color }}>{pct}%</span>
          <span className="text-[10px] text-stone-600 font-semibold mt-0.5">AI</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-stone-700">{label}</p>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────
export function EditorPage() {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [activeMode, setActiveMode] = useState(tool?.modes?.[0]?.value ?? 'standard');
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const [detectorProbability, setDetectorProbability] = useState<number | null>(null);

  // Reset state when clearing
  const handleClear = useCallback(() => {
    setInputText('');
    setOutputText('');
    setHasResult(false);
    setFeedback(null);
    setDetectorProbability(null);
  }, []);

  // Process text using editorService
  const handleProcess = useCallback(async () => {
    if (!inputText.trim() || !tool) return;
    setIsLoading(true);
    setHasResult(false);
    setFeedback(null);
    try {
      const result = await processText(inputText, tool);
      setOutputText(result.outputText);
      setDetectorProbability(result.detectorProbability);
      setHasResult(true);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [inputText, tool]);

  if (toolSlug && !tool) return <Navigate to="/editor/ai-paraphraser" replace />;

  const inputWords = countWords(inputText);
  const outputWords = countWords(outputText);
  const overLimit = inputWords > FREE_WORD_LIMIT;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      // Clipboard permission denied
    }
  };

  const isDetector = tool?.slug === 'ai-detector';

  return (
    <div className="flex flex-col fade-up">
      {/* ── Split Editor Card ── */}
      <div className="bg-white overflow-hidden">
        {/* Connected Mode Tab Bar Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 bg-white flex-wrap gap-4 min-h-[48px]">
          {tool?.modes && tool.modes.length > 0 ? (
            <ModeSelector tool={tool} activeMode={activeMode} onSelect={setActiveMode} />
          ) : (
            <span className="text-xs font-bold text-stone-600 uppercase tracking-widest py-3">
              {tool?.label || 'Editor'}
            </span>
          )}
        </div>

        {/* Text Area Panels */}
        <div
          className={`grid ${isDetector ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} divide-y lg:divide-y-0 lg:divide-x divide-stone-100`}
          style={{ minHeight: '320px' }}
        >
          {/* ─ Input Panel ─ */}
          <div className="flex flex-col relative">
            {/* Textarea */}
            <textarea
              id="editor-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={tool?.inputPlaceholder ?? 'Enter or paste your text here…'}
              className="flex-1 resize-none px-6 py-5 text-sm sm:text-base text-stone-850 placeholder-stone-400 border-0 border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none leading-relaxed min-h-[260px]"
            />

            {/* Floating Clear button in textarea */}
            {inputText && (
              <button
                onClick={handleClear}
                className="absolute top-4 right-4 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-stone-100 hover:border-stone-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}

            {/* Empty state quick actions */}
            {!inputText && (
              <div className="flex items-center gap-3 px-6 pb-5">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{
                    color: tool?.color.hex,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${tool?.color.hex}0d`;
                    e.currentTarget.style.borderColor = tool?.color.hex || '';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e7e5e4';
                  }}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste
                </button>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{
                    color: tool?.color.hex,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${tool?.color.hex}0d`;
                    e.currentTarget.style.borderColor = tool?.color.hex || '';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e7e5e4';
                  }}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>
            )}

            {/* Input footer bar */}
            <div
              className="flex items-center justify-between px-6 py-3 border-t border-stone-100"
              style={{ backgroundColor: overLimit ? '#FFF7ED' : undefined }}
            >
              <WordCount count={inputWords} limit={FREE_WORD_LIMIT} />

              {/* Process button */}
              <button
                id="editor-process-btn"
                onClick={handleProcess}
                disabled={!inputText.trim() || isLoading}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 shadow-md active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  backgroundColor: tool?.color.hex ?? '#7C3AED',
                  boxShadow: `0 4px 14px 0 ${tool?.color.hex ?? '#7C3AED'}44`,
                }}
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    {tool && <tool.icon className="w-3.5 h-3.5" />}
                    {tool?.actionLabel ?? 'Process'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─ Output Panel ─ */}
          <div className="flex flex-col bg-stone-50/40">
            {/* Content area */}
            <div className="flex-1 px-6 py-5 min-h-[260px]">
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-2.5 animate-pulse pt-1">
                  {[90, 75, 85, 60, 78].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-full bg-stone-200"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              ) : isDetector && hasResult ? (
                <DetectorResult probability={detectorProbability} />
              ) : hasResult && outputText ? (
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {outputText}
                </p>
              ) : (
                // Empty state
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                    style={{ backgroundColor: `${tool?.color.hex}14` }}
                  >
                    {tool && <tool.icon className="w-5 h-5" style={{ color: tool.color.hex }} />}
                  </div>
                  <p className="text-sm font-semibold text-stone-700">
                    Your result will appear here
                  </p>
                  <p className="text-xs text-stone-600 max-w-[200px]">
                    Enter text on the left and click{' '}
                    <span className="font-semibold" style={{ color: tool?.color.hex }}>
                      {tool?.actionLabel ?? 'Process'}
                    </span>{' '}
                    to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Output footer with Copy action */}
            {!isDetector && (
              <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/20">
                <span className="text-xs font-semibold text-stone-400 tabular-nums">{outputWords} words</span>
                <CopyButton text={outputText} disabled={!hasResult || !outputText} />
              </div>
            )}
          </div>
        </div>

        {/* ─ Feedback bar — shows after a result ─ */}
        {hasResult && (
          <FeedbackBar
            tool={tool!}
            feedback={feedback}
            onFeedback={setFeedback}
          />
        )}
      </div>

      {/* ─ Over-limit warning ─ */}
      {overLimit && (
        <div className="mx-8 my-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100">
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            <span className="font-semibold">Word limit reached.</span>{' '}
            You are using {inputWords - FREE_WORD_LIMIT} words over the {FREE_WORD_LIMIT}-word free limit.
            Trim your text to continue.
          </p>
        </div>
      )}
    </div>
  );
}
