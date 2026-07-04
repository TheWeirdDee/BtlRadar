// x-bot/index.ts
// BTL Radar X Bot
// Monitors mentions of @BTLRadar containing a contract address
// Responds with a quote tweet verdict

import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { detectChain, scanContract, formatTweet } from './lib';

const client = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://btl-radar.vercel.app';

let lastCheckedId: string | undefined;

async function checkMentions() {
  try {
    const me = await client.v2.me();

    const mentions = await client.v2.userMentionTimeline(me.data.id, {
      since_id: lastCheckedId,
      max_results: 10,
      'tweet.fields': ['text', 'author_id', 'id'],
    });

    if (!mentions.data?.data?.length) return;

    for (const tweet of mentions.data.data) {
      if (lastCheckedId && tweet.id <= lastCheckedId) continue;

      const detected = detectChain(tweet.text);
      if (!detected) continue;

      const { address, chain } = detected;

      try {
        const result = await scanContract(APP_URL, address, chain);
        const tweetText = formatTweet(result, address, chain);

        await client.v2.reply(tweetText, tweet.id);
        console.log(`Replied to ${tweet.id} for ${address}`);
      } catch (err) {
        console.error(`Failed to process tweet ${tweet.id}:`, err);
      }
    }

    // Update last checked ID
    if (mentions.data?.data?.[0]) {
      lastCheckedId = mentions.data.data[0].id;
    }
  } catch (err) {
    console.error('Error checking mentions:', err);
  }
}

// Poll every 60 seconds (X free tier rate limit)
console.log('BTL Radar X bot running...');
checkMentions();
setInterval(checkMentions, 60000);
