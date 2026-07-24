import { useState } from 'react';
import { ChevronDown, ClipboardList, Settings2, Sparkles, ArrowRight } from 'lucide-react';
import { TOOLS_CONFIG } from '../../config/tools.config';

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Paste your text',
    description:
      'Drop your content into the editor. You can also paste from your clipboard to get started instantly.',
    color: '#7C3AED',
    tint: '#F5F3FF',
  },
  {
    number: '02',
    icon: Settings2,
    title: 'Choose your tool & mode',
    description:
      'Pick the right AI tool for your task — Paraphrase, Grammar, Humanize, or Detect. Fine-tune with the mode settings.',
    color: '#059669',
    tint: '#ECFDF5',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Get your result instantly',
    description:
      'Click the action button and receive your AI-powered result in seconds. Copy, review, and submit feedback.',
    color: '#EA580C',
    tint: '#FFF7ED',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-xs font-semibold text-violet-600 mb-3 border border-violet-100">
          <ArrowRight className="w-3 h-3" />
          Simple 3-step process
        </span>
        <h2 className="text-xl font-bold text-stone-800">How does NavQuill work?</h2>
        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
          Powerful AI tools designed to be simple. No complex settings — just paste, pick, and process.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-[30px] left-[calc(50%+40px)] right-[-calc(50%-40px)] h-px border-t border-dashed border-stone-200 z-0" />
              )}

              {/* Step card */}
              <div
                className="relative z-10 w-full rounded-xl border p-5 flex flex-col items-center bg-stone-50/50"
                style={{ borderColor: step.color + '22' }}
              >
                {/* Number badge */}
                <span
                  className="text-[10px] font-bold tracking-widest uppercase mb-3 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: step.color + '18', color: step.color }}
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
                  style={{ backgroundColor: step.color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-sm font-bold text-stone-800 mb-1.5">{step.title}</h3>
                <p className="text-xs text-stone-700 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tool chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {TOOLS_CONFIG.map(({ slug, label, icon: Icon, color }) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
            style={{
              backgroundColor: color.hex + '0f',
              color: color.hex,
              borderColor: color.hex + '22',
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is NavQuill?',
    answer:
      'NavQuill is an AI-powered writing assistant platform that helps you paraphrase, fix grammar, humanize AI-generated text, and detect AI-written content — all in one place.',
  },
  {
    question: 'How many words can I process for free?',
    answer:
      'The free tier allows up to 125 words per request across all tools. This is designed for short documents, paragraphs, and quick edits.',
  },
  {
    question: 'Which AI tools are available?',
    answer:
      'NavQuill currently offers four tools: AI Paraphraser (6 modes), Grammar Checker, AI Humanizer, and AI Detector. More tools will be added in future updates.',
  },
  {
    question: 'Is my text stored or shared?',
    answer:
      'Your privacy matters. Text submitted for processing is used only to generate a result for you. We do not sell or share your content with third parties.',
  },
  {
    question: 'How accurate is the AI Detector?',
    answer:
      'The AI Detector uses a trained model to estimate the probability that a piece of text was written by an AI. While accuracy is high, no detector is 100% certain — results should be used as a guide, not a definitive verdict.',
  },
  {
    question: 'What does the Humanizer mode actually do?',
    answer:
      'The AI Humanizer rewrites AI-generated text to sound more natural, conversational, and human. It adjusts sentence structure, vocabulary, and flow to reduce AI-detection signals.',
  },
  {
    question: 'Can I use NavQuill in multiple languages?',
    answer:
      'Currently NavQuill is optimized for English. Multi-language support is on the product roadmap and will be released in a future version.',
  },
];

function FAQRow({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left py-3.5 px-1 gap-4 group"
      >
        <span className="text-sm font-semibold text-stone-850 group-hover:text-violet-600 transition-colors duration-150">
          {item.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-stone-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : ''
            }`}
        />
      </button>

      {/* Answer ─ CSS height transition */}
      <div
        className={`overflow-hidden transition-all duration-305 ease-in-out ${isOpen ? 'max-h-40 pb-3.5' : 'max-h-0'
          }`}
      >
        <p className="text-xs text-stone-700 leading-relaxed px-1">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="bg-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-xs font-semibold text-violet-600 mb-3 border border-violet-100">
            Got questions?
          </span>
          <h2 className="text-xl font-bold text-stone-800">Frequently Asked Questions</h2>
          <p className="text-xs text-stone-600 mt-1.5">
            Everything you need to know about NavQuill.
          </p>
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-stone-100 border-t border-stone-100 pt-2">
          {FAQ_ITEMS.map((item, i) => (
            <FAQRow
              key={item.question}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
