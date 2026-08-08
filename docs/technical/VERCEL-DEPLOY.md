# VERCEL DEPLOYMENT GUIDE

Step-by-step instructions for deploying the TRUST FALL web application (`apps/web`) to Vercel.

---

## Prerequisites

- Vercel CLI installed (`npm install -g vercel`) or Vercel dashboard access.
- Monorepo configured with Turborepo (`apps/web` package).

---

## 1. Quick Deploy via Vercel CLI

From the workspace root:

```bash
# Login to Vercel
vercel login

# Deploy apps/web to Vercel production
vercel --cwd apps/web --prod
```

---

## 2. Vercel Dashboard Settings

If deploying via GitHub integration on Vercel Dashboard:

- **Root Directory**: `apps/web`
- **Framework Preset**: `Next.js`
- **Build Command**: `pnpm --filter @trust-fall/web build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

---

## 3. Environment Variables

Configure the following environment variables in Vercel settings:

| Variable | Value | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_RPC_URL` | `https://api.devnet.solana.com` | Base Solana Devnet RPC |
| `NEXT_PUBLIC_PROGRAM_ID` | `7JhuY8EbFKruHcUT1dp7DCXmuvu8NkAfuP4NbGdKs2SR` | Deployed Anchor Program ID |
| `NEXT_PUBLIC_ER_RPC` | `https://devnet-eu.magicblock.app` | MagicBlock Ephemeral Rollup |
| `NEXT_PUBLIC_MINT` | `6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy` | Devnet USDC Mint |
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-backend.up.railway.app` | Production NestJS Backend |

---

## 4. Cold-Load Verification

After deployment:

1. Open the Vercel production URL in an **Incognito / Clean Browser Profile** (no wallet extension).
2. Click **QUICK PLAY**.
3. Verify that the ephemeral guest wallet initializes, party creates, CPU bots fill, state delegates to MagicBlock ER, and floor 1 opens with your private clue in **under 20 seconds**.
