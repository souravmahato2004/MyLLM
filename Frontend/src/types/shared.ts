// ─────────────────────────────────────────────────────────────────────────────
// NavQuill — Shared Type Definitions
// Mirrors the PostgreSQL database schema including JSONB dynamic columns.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── Feature (Tool Definition) ────────────────────────────────────────────────
export type ToolSlug =
  | 'ai-paraphraser'
  | 'grammar-checker'
  | 'ai-humanizer'
  | 'ai-detector';

export interface Feature {
  id: string;
  name: string;
  slug: ToolSlug;
  description: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export type FeedbackRating = 'good' | 'bad';

export interface Feedback {
  id: string;
  interactionId: string;
  rating: FeedbackRating;
  comment?: string;
  createdAt: string;
}

// ─── Tool Interaction (central record) ───────────────────────────────────────
// input_metadata and output_data are JSONB columns — intentionally open at the
// base level. Use the per-tool output unions below for safe narrowing.
export interface ToolInteraction {
  id: string;
  userId: string;
  featureId: string;
  feature?: Feature;
  input_text: string;
  input_metadata: Record<string, unknown>; // JSONB — settings per tool
  output_data: Record<string, unknown>;    // JSONB — result per tool
  createdAt: string;
  feedback?: Feedback;
}

// ─── API Pagination Wrapper ───────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-Tool Input Metadata Shapes
// Stored in ToolInteraction.input_metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface ParaphraserMetadata {
  tone?: 'standard' | 'fluency' | 'formal' | 'academic' | 'simple' | 'creative';
}

export interface GrammarMetadata {
  language?: string; // e.g. 'en-US'
}

export interface HumanizerMetadata {
  strength?: 'low' | 'medium' | 'high';
}

export interface DetectorMetadata {
  // No extra metadata for MVP — reserved for future (e.g. model version)
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-Tool Output Data Shapes
// Stored in ToolInteraction.output_data — use these to narrow output_data
// ─────────────────────────────────────────────────────────────────────────────

export interface ParaphraserOutput {
  result_text: string;
}

export interface GrammarIssue {
  offset: number;
  length: number;
  message: string;
  suggestions: string[];
}

export interface GrammarOutput {
  corrected_text: string;
  issues: GrammarIssue[];
}

export interface HumanizerOutput {
  humanized_text: string;
}

export interface DetectorFlag {
  text: string;
  reason: string;
}

export interface DetectorOutput {
  ai_probability: number; // 0.0 – 1.0
  flagged: DetectorFlag[];
}

// ─── Discriminated Union for type-safe output rendering ──────────────────────
export type ToolOutputMap = {
  'ai-paraphraser': ParaphraserOutput;
  'grammar-checker': GrammarOutput;
  'ai-humanizer': HumanizerOutput;
  'ai-detector': DetectorOutput;
};

// Helper: narrow output_data to a specific tool's shape
export function narrowOutput<S extends ToolSlug>(
  slug: S,
  output: Record<string, unknown>,
): ToolOutputMap[S] {
  // At runtime the backend guarantees the shape — we cast here as a single
  // trusted boundary rather than scattering `as` throughout the UI.
  void slug; // slug kept for discoverability / future runtime validation
  return output as unknown as ToolOutputMap[S];
}
