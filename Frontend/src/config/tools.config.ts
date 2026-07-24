import type { LucideIcon } from 'lucide-react';
import { RefreshCw, CheckCircle, UserCheck, ScanSearch } from 'lucide-react';
import type { ToolSlug } from '../types/shared';

export interface ToolMode {
  value: string;
  label: string;
}

export interface ToolColor {
  chipBg: string;
  iconColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  hex: string;
  tint: string;
  shadow: string;
}

export interface ToolConfig {
  slug: ToolSlug;
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
  inputPlaceholder: string;
  actionLabel: string;
  color: ToolColor;
  modes?: ToolMode[];
}

export const TOOLS_CONFIG: ToolConfig[] = [
  {
    slug: 'ai-paraphraser',
    label: 'AI Paraphraser',
    description: 'Rephrase any text while preserving its original meaning.',
    icon: RefreshCw,
    path: '/editor/ai-paraphraser',
    inputPlaceholder: "To rewrite text, enter or paste it here and press 'Paraphrase.'",
    actionLabel: 'Paraphrase',
    color: {
      chipBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      activeBorder: 'border-l-violet-500',
      activeBg: 'bg-violet-50',
      activeText: 'text-violet-700',
      hex: '#7C3AED',
      tint: '#F5F3FF',
      shadow: 'shadow-violet-200',
    },
    modes: [
      { value: 'standard', label: 'Standard' },
      { value: 'fluency', label: 'Fluency' },
      { value: 'formal', label: 'Formal' },
      { value: 'academic', label: 'Academic' },
      { value: 'simple', label: 'Simple' },
      { value: 'creative', label: 'Creative' },
    ],
  },
  {
    slug: 'grammar-checker',
    label: 'Grammar Checker',
    description: 'Detect and correct grammar, spelling, and punctuation errors.',
    icon: CheckCircle,
    path: '/editor/grammar-checker',
    inputPlaceholder: 'Enter or paste your text here to check for grammar issues.',
    actionLabel: 'Check Grammar',
    color: {
      chipBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      activeBorder: 'border-l-emerald-500',
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-700',
      hex: '#059669',
      tint: '#ECFDF5',
      shadow: 'shadow-emerald-200',
    },
    modes: [
      { value: 'standard', label: 'Standard' },
      { value: 'strict', label: 'Strict' },
    ],
  },
  {
    slug: 'ai-humanizer',
    label: 'AI Humanizer',
    description: 'Transform AI-generated text to sound more naturally human.',
    icon: UserCheck,
    path: '/editor/ai-humanizer',
    inputPlaceholder: 'Paste AI-generated text here to make it sound more human.',
    actionLabel: 'Humanize',
    color: {
      chipBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      activeBorder: 'border-l-orange-500',
      activeBg: 'bg-orange-50',
      activeText: 'text-orange-700',
      hex: '#EA580C',
      tint: '#FFF7ED',
      shadow: 'shadow-orange-200',
    },
    modes: [
      { value: 'low', label: 'Subtle' },
      { value: 'medium', label: 'Balanced' },
      { value: 'high', label: 'Aggressive' },
    ],
  },
  {
    slug: 'ai-detector',
    label: 'AI Detector',
    description: 'Analyze text to determine the likelihood it was AI-written.',
    icon: ScanSearch,
    path: '/editor/ai-detector',
    inputPlaceholder: 'Paste text here to analyze its AI-written probability.',
    actionLabel: 'Detect AI',
    color: {
      chipBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      activeBorder: 'border-l-sky-500',
      activeBg: 'bg-sky-50',
      activeText: 'text-sky-700',
      hex: '#0284C7',
      tint: '#F0F9FF',
      shadow: 'shadow-sky-200',
    },
  },
];

export const getToolBySlug = (slug: string): ToolConfig | undefined =>
  TOOLS_CONFIG.find((t) => t.slug === slug);
