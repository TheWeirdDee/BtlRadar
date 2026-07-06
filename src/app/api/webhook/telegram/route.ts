// src/app/api/webhook/telegram/route.ts
// Serverless Telegram bot webhook handler.
// Automatically deployed with the Next.js app on Vercel.
// Integrates Telegram bot directly into Next.js api routes, avoiding standalone process deployment constraints.

import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

// Pure logic imports from the bot module to share definitions
import { detectChain, scanContract, formatVerdict } from '../../../../../telegram-bot/lib';

export const runtime = 'nodejs';

// Initialize the bot instance locally in the API route context
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://btl-radar.vercel.app';

// Configure bot text scanner
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const detected = detectChain(text);

  if (!detected) return; // No address detected — skip

  const { address, chain } = detected;

  // Send initial loading response
  const scanMsg = await ctx.reply(
    `🔍 Scanning ${address.slice(0, 6)}...${address.slice(-4)} on ${chain}...\n\nAgents initializing via BTL Runtime...`,
    { reply_parameters: { message_id: ctx.message.message_id } }
  );

  try {
    const result = await scanContract(APP_URL, address, chain);
    const formatted = formatVerdict(result, address, chain);

    // Edit message with final formatted Markdown verdict
    await ctx.telegram.editMessageText(ctx.chat.id, scanMsg.message_id, undefined, formatted, {
      parse_mode: 'Markdown',
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Telegram scan failed:', error);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      scanMsg.message_id,
      undefined,
      '❌ Scan failed. Please try again or visit btl-radar.vercel.app'
    );
  }
});

// Bot start command
bot.start((ctx) => {
  ctx.reply(
    `👋 *BTL Radar Bot*\n\nPaste any EVM or Solana contract address and I'll scan it with three AI agents via BTL Runtime.\n\nJust send the address — no commands needed.\n\nExample:\n\`0x4d224452801ACEd8B2F0aebE155379bb5D594381\`\n\nor add me to your group and I'll scan every CA posted.`,
    { parse_mode: 'Markdown' }
  );
});

// Bot help command
bot.help((ctx) => {
  ctx.reply(
    `*BTL Radar — Commands*\n\n• Just paste any contract address to scan it\n• Works in DMs and groups\n• Supports EVM (0x...) and Solana addresses\n\nFor full analysis: btl-radar.vercel.app`,
    { parse_mode: 'Markdown' }
  );
});

export async function POST(request: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 500 });
  }

  try {
    const body = await request.json();
    // Handle the update synchronously via Telegraf's engine
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[webhook] Telegram processing error:', error);
    return NextResponse.json({ error: 'Failed to process update' }, { status: 500 });
  }
}
