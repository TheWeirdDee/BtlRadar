# X Account Setup for BTL Radar

Do this before July 3rd. Takes about 20 minutes.

---

## Step 1: Create the X account

1. Go to x.com
2. Sign up with a new email (use something like btlradar@gmail.com)
3. Username: **@BTLRadar**
4. Display name: **BTL Radar**
5. Bio: `Three agents. One gateway. Zero rugs. Tag me with any contract address. Powered by @BadTheoryLabs Runtime.`
6. Profile picture: use a simple dark square with "BTL RADAR" in monospace white text (match the brand)
7. Link: btl-radar.vercel.app

---

## Step 2: Apply for X API access

1. Go to developer.twitter.com
2. Sign in with @BTLRadar account
3. Apply for **Free tier** access
4. Project name: "BTL Radar — Token Security Bot"
5. Description: "A crypto token security bot that analyzes contract addresses for rug pull risk using AI agents. Built for the BTL Runtime Hackathon."
6. Use case: "Automated security scanning and public alerts for crypto tokens"
7. Wait for approval (usually within a few hours)

---

## Step 3: Create an App

1. In developer portal → Projects & Apps → New App
2. App name: BTL Radar
3. Environment: Production
4. Enable Read and Write permissions
5. Enable User authentication
6. Save your keys:
   - API Key → `X_API_KEY`
   - API Key Secret → `X_API_SECRET`
   - Bearer Token → `X_BEARER_TOKEN`
   - Access Token → `X_ACCESS_TOKEN`
   - Access Token Secret → `X_ACCESS_SECRET`

---

## Step 4: First tweet (post this on July 3rd at hackathon kickoff)

```
🚨 BTL RADAR is live.

Tag @BTLRadar with any EVM or Solana contract address.
Three AI agents — routed through @BadTheoryLabs Runtime — will tell you if it's a rug before you lose money.

Built in 48h for the @BadTheoryLabs hackathon.

btl-radar.vercel.app
```

---

## Rate limits on free tier

- 1,500 tweets/month
- Read up to 10,000 tweets/month
- This is enough for the hackathon demo

The X bot polls for mentions every 60 seconds to stay within rate limits.

---

## Note on approval timing

X API approval can take anywhere from 1 hour to 24 hours. Apply immediately — don't wait until July 3rd. If the bot isn't approved in time, the web app and Telegram bot are enough to win. The X bot is the bonus layer.
