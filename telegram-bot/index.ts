// telegram-bot/index.ts
// BTL Radar Telegram Bot
// Usage: tag @BTLRadarBot with any contract address in a group or DM

import 'dotenv/config';
import http from 'http';
import { Telegraf } from 'telegraf';
import { detectChain, scanContract, formatVerdict } from './lib';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://btl-radar.vercel.app';

// Handle direct messages and group mentions
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const detected = detectChain(text);

  if (!detected) return; // No contract address found — ignore silently

  const { address, chain } = detected;

  // Send "scanning" message
  const scanMsg = await ctx.reply(
    `🔍 Scanning ${address.slice(0, 6)}...${address.slice(-4)} on ${chain}...\n\nAgents initializing via BTL Runtime...`,
    { reply_parameters: { message_id: ctx.message.message_id } }
  );

  try {
    const result = await scanContract(APP_URL, address, chain);
    const formatted = formatVerdict(result, address, chain);

    // Edit the scanning message with the result
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

// Start command
bot.start((ctx) => {
  ctx.reply(
    `👋 *BTL Radar Bot*\n\nPaste any EVM or Solana contract address and I'll scan it with three AI agents via BTL Runtime.\n\nJust send the address — no commands needed.\n\nExample:\n\`0x4f2a...8c91\`\n\nor add me to your group and I'll scan every CA posted.`,
    { parse_mode: 'Markdown' }
  );
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    `*BTL Radar — Commands*\n\n• Just paste any contract address to scan it\n• Works in DMs and groups\n• Supports EVM (0x...) and Solana addresses\n\nFor full analysis: btl-radar.vercel.app`,
    { parse_mode: 'Markdown' }
  );
});

// Launch bot (optional webhook support for deployment)
if (process.env.WEBHOOK_URL) {
  const port = Number(process.env.PORT) || 3001;
  const webhookUrl = process.env.WEBHOOK_URL.endsWith('/')
    ? `${process.env.WEBHOOK_URL}telegram-bot`
    : `${process.env.WEBHOOK_URL}/telegram-bot`;

  bot.telegram.setWebhook(webhookUrl);
  
  // Telegraf v4: webhookCallback returns a standard request listener middleware
  const server = http.createServer(bot.webhookCallback('/telegram-bot'));
  server.listen(port, () => {
    console.log(`BTL Radar Telegram bot listening on port ${port} via webhook ${webhookUrl}...`);
  });
} else {
  bot.launch();
  console.log('BTL Radar Telegram bot running via long polling...');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
