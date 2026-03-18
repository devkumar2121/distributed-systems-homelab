
# Distributed Systems Homelab 🏠

Simulating how India's biggest apps
work — on 2 real machines at home.

No AWS. No cloud. No monthly bills.

## Setup

🍎 M1 Mac → Redis Master
🐧 Lenovo Ubuntu → Worker
🔐 Tailscale → Private VPN

## Simulations

| Day | Problem | Tech |
|-----|---------|------|
| Day 1 | Zomato order assignment | Redis Pub/Sub |
| Day 2 | UPI double payment fix | Redis Lock |
| Day 3 | WhatsApp offline messages | Redis Lists |

## Tech Stack

- Node.js
- Redis (Docker)
- Tailscale
- Docker

## Follow Along

Instagram: @distributed.dev

## Run Locally
```bash
# Clone repo
git clone https://github.com/YOURUSERNAME/distributed-systems-homelab

# Install dependencies
cd day-wise-simulation
npm install

# Setup .env
cp .env.example .env