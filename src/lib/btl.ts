// BTL Runtime API client
// Single interface between the app and the BTL Runtime gateway.
// Every agent call (screener, forensic, judge) goes through callBTL.

const BTL_ENDPOINT = 'https://api.badtheorylabs.com/v1/chat/completions';

export interface BTLMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BTLResult {
  content: string;
  benchmarkCost: number;
  customerCharge: number;
  saved: number;
  promptTokens: number;
  completionTokens: number;
}

// GPT-4o list pricing, used to estimate the benchmark ("what this scan would
// have cost on a single frontier model") when the gateway reports $0 —
// grant-covered deepseek-direct routes return x-btl-benchmark-cost: 0.
const GPT4O_INPUT_PER_TOKEN = 2.5 / 1_000_000;
const GPT4O_OUTPUT_PER_TOKEN = 10 / 1_000_000;

// Models often wrap JSON in markdown fences or prepend prose (especially
// reasoning models). Pull out the first {...} block instead of trusting
// the raw string.
export function extractJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

export async function callBTL(
  model: string,
  messages: BTLMessage[],
  maxTokens?: number
): Promise<BTLResult> {
  const response = await fetch(BTL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.BTL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`BTL API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();

  const promptTokens = data.usage?.prompt_tokens ?? 0;
  const completionTokens = data.usage?.completion_tokens ?? 0;
  const customerCharge = parseFloat(response.headers.get('x-btl-customer-charge') || '0');

  let benchmarkCost = parseFloat(response.headers.get('x-btl-benchmark-cost') || '0');
  if (benchmarkCost === 0) {
    benchmarkCost =
      promptTokens * GPT4O_INPUT_PER_TOKEN + completionTokens * GPT4O_OUTPUT_PER_TOKEN;
  }

  let saved = parseFloat(response.headers.get('x-btl-saved') || '0');
  if (saved === 0) {
    saved = Math.max(benchmarkCost - customerCharge, 0);
  }

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    benchmarkCost,
    customerCharge,
    saved,
    promptTokens,
    completionTokens,
  };
}
