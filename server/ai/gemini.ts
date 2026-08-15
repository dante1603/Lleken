import { GoogleGenAI } from '@google/genai';
import type { InlineImage } from './image';

export const GEMINI_MODEL = 'gemini-2.5-flash';

const GEMINI_PRICING_USD_PER_1M = {
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
} as const;

export interface AiGenerationResponse {
  text?: string;
  usageMetadata?: Record<string, unknown>;
}

export interface AiGateway {
  generateContent(input: {
    model: string;
    contents: Array<string | InlineImage>;
    config: { responseMimeType: 'application/json' };
  }): Promise<AiGenerationResponse>;
}

type GeminiUsageRecord = {
  timestamp: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

const geminiUsageRecords: GeminiUsageRecord[] = [];

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing Gemini API key');
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export function createGeminiGateway(): AiGateway {
  return {
    async generateContent(input) {
      return getGeminiClient().models.generateContent(input) as unknown as AiGenerationResponse;
    },
  };
}

function estimateGeminiCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = GEMINI_PRICING_USD_PER_1M[model as keyof typeof GEMINI_PRICING_USD_PER_1M];
  return pricing
    ? (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
    : 0;
}

export function recordGeminiUsage(operation: string, model: string, response: AiGenerationResponse) {
  const usage = response.usageMetadata;
  const inputTokens = Number(usage?.promptTokenCount || 0);
  const totalTokens = Number(usage?.totalTokenCount || 0);
  const candidateTokens = Number(usage?.candidatesTokenCount || 0);
  const thoughtsTokens = Number(usage?.thoughtsTokenCount || 0);
  const outputTokens = candidateTokens + thoughtsTokens || Math.max(0, totalTokens - inputTokens);
  const record = {
    timestamp: new Date().toISOString(),
    operation,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: estimateGeminiCost(model, inputTokens, outputTokens),
  };
  geminiUsageRecords.unshift(record);
  geminiUsageRecords.splice(100);
  console.info('Gemini usage:', record);
}

export function summarizeGeminiUsage() {
  const totals = geminiUsageRecords.reduce((summary, record) => {
    summary.calls += 1;
    summary.inputTokens += record.inputTokens;
    summary.outputTokens += record.outputTokens;
    summary.totalTokens += record.totalTokens;
    summary.estimatedCostUsd += record.estimatedCostUsd;
    return summary;
  }, { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 });

  return {
    model: GEMINI_MODEL,
    pricingUsdPer1M: GEMINI_PRICING_USD_PER_1M,
    totals,
    recent: geminiUsageRecords.slice(0, 25),
  };
}
