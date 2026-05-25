# CirclePay NG

**Pay Nigerian utility bills with USDC on Arc Testnet. No P2P wahala, no CEX stress.**

CirclePay NG lets you buy airtime, data bundles, and electricity tokens directly with USDC — powered by Arc Network's native USDC gas mechanics and Circle's Paymaster for optional gasless transactions.

---

## ✨ Features

| Feature | Status |
|---|---|
| 🔌 Connect MetaMask / Rabby / Rainbow | ✅ |
| 💰 USDC Balance display + live NGN equivalent | ✅ |
| 📤 Send USDC to any address | ✅ |
| 📥 Receive USDC with QR code | ✅ |
| 📱 Airtime top-up (MTN, Airtel, Glo, 9mobile) | ✅ |
| 🌐 Data bundles (all networks) | ✅ |
| ⚡ Electricity tokens (10 DISCOs) | ✅ |
| 💱 USDC ↔ Naira live rate converter | ✅ |
| 📈 USDC Staking (25% APY on testnet) | ✅ |
| ⛽ Gasless mode (Circle Paymaster) | ✅ |
| 📜 Transaction history | ✅ |
| 🌙 Dark mode by default, mobile-first | ✅ |

---

## 🚀 Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <your-repo-url> CirclePay-ng
cd CirclePay-ng
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` — the minimum you need to run locally:

```env
# WalletConnect (get free at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# VTpass sandbox (get at https://vtpass.com.ng/developers)
VTPASS_API_URL=https://sandbox.vtpass.com.ng/api
VTPASS_API_KEY=your_api_key
VTPASS_PUBLIC_KEY=your_public_key
VTPASS_SECRET_KEY=your_secret_key

# Leave these as placeholders for now (populated after contract deploy)
NEXT_PUBLIC_USDC_ADDRESS=0x0000000000000000000000000000000000000001
NEXT_PUBLIC_STAKING_CONTRACT=0x0000000000000000000000000000000000000002
NEXT_PUBLIC_PAYMENT_CONTRACT=0x0000000000000000000000000000000000000003
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — connect your wallet and explore!

---

## 💧 Getting Test USDC

Arc Testnet uses USDC as the native gas token. To get test USDC:

1. **Circle Faucet** (primary): [https://faucet.circle.com](https://faucet.circle.com)
   - Select "Arc Testnet"
   - Enter your wallet address
   - Receive 10 USDC for testing

2. **Add Arc Testnet to MetaMask**:
   ```
   Network Name:  Arc Testnet
   RPC URL:       https://rpc.arc-testnet.io
   Chain ID:      1234
   Symbol:        USDC
   Explorer:      https://explorer.arc-testnet.io
   ```

3. **Import USDC token**: After connecting to Arc Testnet in MetaMask, import the USDC contract address from your `.env.local`.

---

## 📦 Smart Contract Deployment

### Prerequisites

```bash
# Install Hardhat dependencies
npm install

# Create a deployer wallet (or use existing MetaMask private key)
# NEVER use a mainnet wallet with real funds for testnet deployment
```

### Step 1: Configure deployer

Add to `.env.local`:
```env
DEPLOYER_PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY_NEVER_MAINNET
TREASURY_WALLET_ADDRESS=0xYOUR_TREASURY_WALLET
```

### Step 2: Compile contracts

```bash
npm run compile
# or: npx hardhat compile
```

### Step 3: Run tests locally first

```bash
npx hardhat test
```

Expected output:
```
  CirclePay Contracts
    CirclePayStaking
      ✔ should allow staking USDC
      ✔ should revert stake of 0
      ✔ should accumulate rewards over time
      ✔ should pay out rewards on unstake
      ✔ should update APY (owner only)
      ✔ should revert APY > 100%
      ✔ should not let non-owner update APY
    CirclePayPayment
      ✔ should process a payment and emit ServicePaid
      ✔ should forward net amount to treasury
      ✔ should reject payment below minimum
      ✔ should allow admin to mark payment completed
      ✔ should allow refund by admin

  12 passing
```

### Step 4: Deploy to Arc Testnet

```bash
npm run deploy:testnet
# or: npx hardhat run scripts/deploy.js --network arc-testnet
```

Output will look like:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CirclePay NG — Contract Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Network:   arc-testnet
👛 Deployer:  0xYourAddress
💰 Balance:   25.00 USDC

✅ CirclePayStaking:  0xABC...
✅ CirclePayPayment:  0xDEF...

📋 Add these to your .env.local:

NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_STAKING_CONTRACT=0xABC...
NEXT_PUBLIC_PAYMENT_CONTRACT=0xDEF...
```

### Step 5: Update `.env.local` and restart

Paste the contract addresses from the deploy output into `.env.local`, then restart your dev server:

```bash
npm run dev
```

### Step 6: Fund the staking reward pool

After deployment, fund the reward pool so stakers can earn:

```js
// In Hardhat console: npx hardhat console --network arc-testnet
const staking = await ethers.getContractAt("CirclePayStaking", "0xYOUR_STAKING_ADDRESS");
const usdc    = await ethers.getContractAt("MockUSDC", "0xUSDC_ADDRESS");

// Approve and fund with 1000 USDC
await usdc.approve(staking.address, ethers.parseUnits("1000", 6));
await staking.fundRewardPool(ethers.parseUnits("1000", 6));
console.log("Reward pool funded!");
```

---

## 🧾 VTU API Integration Notes

CirclePay NG uses **VTpass** ([vtpass.com.ng](https://vtpass.com.ng)) for Nigerian VTU services.

### Why VTpass?
- Best-in-class API documentation
- Sandbox environment for testing
- Supports all major Nigerian telcos and 10+ DISCOs
- Stable uptime, competitive pricing

### Getting API credentials

1. Register at [vtpass.com.ng/developers](https://vtpass.com.ng/developers)
2. Go to Settings → API Access
3. Copy your **API Key**, **Public Key**, and **Secret Key**
4. Use sandbox URL for development: `https://sandbox.vtpass.com.ng/api`

### Test credentials (sandbox)

In VTpass sandbox, any valid Nigerian phone and meter number will work. Use:
- Phone: `08011111111` (MTN test number)
- Amount: any valid amount
- Meter: `1111111111111` (prepaid test meter)

### Payment flow architecture

```
User (USDC) → Smart Contract → ServicePaid Event
                                      ↓
                            Backend API Route
                                      ↓
                              VTpass API Call
                                      ↓
                            Service Delivered
                          (airtime/data/token)
```

In production, the backend listens for `ServicePaid` events on-chain and calls VTpass automatically. For the MVP, the API route handles both the USDC deduction preview and the VTpass call in sequence.

### Supported services

| Service | VTpass ID | Status |
|---|---|---|
| MTN Airtime | `mtn` | ✅ |
| Airtel Airtime | `airtel` | ✅ |
| Glo Airtime | `glo` | ✅ |
| 9mobile Airtime | `etisalat` | ✅ |
| MTN Data | `mtn-data` | ✅ |
| Airtel Data | `airtel-data` | ✅ |
| Glo Data | `glo-data` | ✅ |
| 9mobile Data | `etisalat-data` | ✅ |
| IKEDC (Ikeja Electric) | `ikeja-electric` | ✅ |
| EKEDC (Eko Electric) | `eko-electric` | ✅ |
| IBEDC (Ibadan) | `ibadan-electric` | ✅ |
| AEDC (Abuja) | `abuja-electric` | ✅ |
| + 6 more DISCOs | see `vtu-data.ts` | ✅ |

---

## 🏗️ Project Structure

```
CirclePay-ng/
├── contracts/
│   ├── CirclePayStaking.sol     # USDC staking contract (25% APY)
│   ├── CirclePayPayment.sol     # Payment processor contract
│   └── MockUSDC.sol          # Test USDC (local testing only)
│
├── scripts/
│   └── deploy.js             # Hardhat deployment script
│
├── test/
│   └── CirclePay.test.js        # Contract unit tests
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── wallet/       # Wallet page
│   │   │   ├── pay/          # Bill payment page
│   │   │   ├── stake/        # Staking page
│   │   │   └── convert/      # USDC ↔ NGN converter
│   │   ├── api/
│   │   │   ├── vtpass/       # VTpass API routes
│   │   │   │   ├── airtime/
│   │   │   │   ├── data/
│   │   │   │   └── electricity/
│   │   │   └── rates/        # Exchange rate API
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── wallet/           # WalletBalance, SendModal, ReceiveModal, History
│   │   ├── payment/          # AirtimeForm, DataForm, ElectricityForm
│   │   ├── staking/          # StakingStats, StakePanel, StakingHistory
│   │   ├── AppHeader.tsx
│   │   ├── BottomNav.tsx
│   │   ├── ConnectPrompt.tsx
│   │   ├── GasFeeDisplay.tsx
│   │   ├── Providers.tsx
│   │   └── SuccessScreen.tsx
│   │
│   └── lib/
│       ├── chains.ts          # Arc Testnet chain definition
│       ├── contracts.ts       # ABIs and addresses
│       ├── wagmi.ts           # Wagmi + RainbowKit config
│       ├── store.ts           # Zustand global state
│       ├── utils.ts           # Utility functions
│       ├── vtu-data.ts        # Nigerian telco/DISCO data
│       └── hooks/
│           ├── useUSDCBalance.ts
│           ├── useUSDCTransfer.ts
│           └── useStaking.ts
│
├── hardhat.config.js
├── .env.example
├── package.json
└── README.md
```

---

## 🛡️ Security Notes

- **No private keys in frontend** — all sensitive operations go through API routes
- **Input validation** on all user inputs (phone, meter, amount, address)
- **Testnet only** — this MVP is not audited for mainnet use
- **Treasury wallet** separation — payments go to a dedicated treasury
- **Refund mechanism** — admin can issue refunds for failed VTpass deliveries
- **Contract ownership** — transferable; use a multisig for production

---

## 🔭 Future Roadmap

### Phase 2 — Production Ready
- [ ] Smart contract audit (Certik / Code4rena)
- [ ] Mainnet deployment on Arc
- [ ] More VTU providers (DSTV, GOtv, StarTimes, internet subscription)
- [ ] Cable TV subscriptions (DStv, GOtv)
- [ ] Internet data (Spectranet, Smile)

### Phase 3 — Expanded Finance
- [ ] Recurring payments / subscriptions (pay airtime monthly automatically)
- [ ] Bill splitting (send airtime to multiple numbers in one tx)
- [ ] Savings goals (lock USDC until a target date)
- [ ] USDC loans (collateral-backed, yield from staking pool)
- [ ] Business accounts (bulk airtime purchases)

### Phase 4 — Ecosystem
- [ ] Mobile app (React Native / PWA)
- [ ] Agent network (physical cash-out points)
- [ ] Crypto payroll (receive salary in USDC, pay bills automatically)
- [ ] Multi-stablecoin support (cNGN, USDT, DAI)
- [ ] Arc Name Service integration (pay to `john.arc` not `0x123...`)

---

## 🤝 Contributing

PRs welcome! Please open an issue first to discuss major changes.

```bash
# Fork, clone, and create a branch
git checkout -b feat/your-feature

# Make changes, run tests
npx hardhat test
npm run build

# Submit PR
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

Built with ❤️ for Nigeria, powered by [Arc Network](https://arc.io) and [Circle USDC](https://circle.com/usdc).
