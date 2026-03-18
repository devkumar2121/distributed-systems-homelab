# Day 1 — Zomato Order Assignment 🍕

> How does Zomato assign your delivery partner
> in under 10 seconds during lunch rush?

Simulated on 2 real machines at home.
No AWS. No cloud. Zero cost. 🔥

---

## The Real World Problem
```
1 lakh orders hit Zomato
during lunch rush 🚨

Every order needs:
→ Restaurant notified
→ Driver assigned
→ Customer updated

All in under 10 seconds!

How is this possible?
```

---

## Why Redis Pub/Sub?

3 options to solve this:
```
❌ Option 1 — HTTP Polling
Backend checks for new orders every second
→ 1 lakh requests/second
→ Server collapses 💀

❌ Option 2 — Database Polling
Check DB every second for new orders
→ DB gets hammered
→ Everything slows down 💀

✅ Option 3 — Redis Pub/Sub
Customer publishes order ONCE
Backend receives it INSTANTLY
→ Zero polling
→ Zero wasted requests
→ Pure real time ⚡
```

**Why Redis Pub/Sub specifically:**

| Feature | Benefit |
|---------|---------|
| ⚡ Microsecond latency | Message delivered in < 1ms |
| 🔥 Zero DB load | Pure in-memory speed |
| 📡 One to many | One order → multiple services notified |
| 💪 Massive scale | Millions of messages/second |

---

## My Setup
```
M1 Mac 🍎                    Ubuntu Lenovo 🐧
─────────────────────────    ──────────────────
Redis Master (Docker)        Worker/Consumer
customer.js                  zomato.backend.js
(places orders)              (assigns drivers)
        │                          │
        │      Tailscale VPN       │
        └──────────────────────────┘
              100.x.x.1       100.x.x.2
              (Mac IP)        (Ubuntu IP)
```

**Mac** → Redis host (Docker container)
**Ubuntu** → Redis client (connects via Tailscale)
**Both** → Talk to SAME Redis instance ✅

---

## How Pub/Sub Works Here

### Step 1 — Both Connect to Same Redis
```
Mac connects to:
redis://localhost:6379
→ Its OWN Docker Redis ✅

Ubuntu connects to:
redis://MAC_TAILSCALE_IP:6379
→ Mac's Docker Redis via Tailscale ✅

Both talking to SAME Redis! ✅
```

### Step 2 — The 2 Channels
```
Channel 1: 'zomato:orders'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mac       → PUBLISHES order
Ubuntu    → SUBSCRIBES receives order

Channel 2: 'zomato:updates'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ubuntu    → PUBLISHES driver assigned
Mac       → SUBSCRIBES receives update
```

### Step 3 — Full Flow
```
Mac 🍎 (customer.js)
        │
        │ publisher.publish(
        │   'zomato:orders',
        │   JSON.stringify(order)
        │ )
        ▼
Redis on Mac Docker 🐳
('zomato:orders' channel)
        │
        │ instantly broadcasted
        ▼
Ubuntu 🐧 (zomato.backend.js)
        │
        │ receives order
        │ picks random driver
        │ assigns driver
        │
        │ publisher.publish(
        │   'zomato:updates',
        │   JSON.stringify(update)
        │ )
        ▼
Redis on Mac Docker 🐳
('zomato:updates' channel)
        │
        ▼
Mac 🍎 (customer.js)
receives driver update! ✅
```

---

## Project Structure
```
day1-zomato/
├── customer.js         ← runs on Mac 🍎
├── zomato.backend.js   ← runs on Ubuntu 🐧
├── package.json
├── .env.example
└── README.md
```

---

## How to Run

### Prerequisites
```bash
# Both machines need Node.js
node --version  # v18+

# Ubuntu needs Redis CLI
sudo apt install redis-tools -y

# Mac needs Docker running
docker ps
```

### Step 1 — Clone Repo
```bash
git clone https://github.com/YOURUSERNAME/distributed-systems-homelab.git
cd distributed-systems-homelab/day1-zomato
npm install
```

### Step 2 — Setup .env

**On Mac:**
```bash
cp .env.example .env
```
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
MACHINE=MAC
```

**On Ubuntu:**
```bash
cp .env.example .env
```
```env
REDIS_HOST=MAC_TAILSCALE_IP
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
MACHINE=UBUNTU
```

### Step 3 — Start Redis on Mac
```bash
docker run -d \
  --name redis-master \
  --restart always \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server \
  --requirepass yourpassword \
  --bind 0.0.0.0
```

### Step 4 — Run Simulation
```bash
# Terminal 1 — Ubuntu (start first)
node zomato.backend.js

# Terminal 2 — Mac (start second)
node customer.js
```

---

## Expected Output

### Mac Terminal 🍎
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Zomato App — Mac 🍎
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🍕 Order #1
   Order ID   : ORD1234567
   Customer   : Priya
   Location   : Bandra, Mumbai
   Restaurant : KFC
   Items      : Chicken Bucket, Pepsi
   Amount     : ₹342
   Time       : 10:30:00

✅ Order sent to Zomato!
⏳ Waiting for driver...

[10:30:01] 🔔 ORDER_CONFIRMED
           KFC confirmed! ✅

[10:30:03] 🔔 DRIVER_ASSIGNED 🎉
           Dinesh Sharma is heading your way!
           🛵 Driver : Dinesh Sharma
           ⭐ Rating : 4.7
           ⏱️  ETA    : 10 mins
           ⚡ Time   : 3.1 seconds
```

### Ubuntu Terminal 🐧
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Zomato Backend — Ubuntu 🐧
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 5 drivers ready

📊 Driver Status:
   Ramesh Kumar  → 🟢 Available
   Suresh Singh  → 🟢 Available
   Mahesh Yadav  → 🟢 Available
   Dinesh Sharma → 🟢 Available
   Rajesh Verma  → 🟢 Available

⏳ Waiting for orders...

━━━━━━━━━━━━━━━━━━━━━━━━━━━
[10:30:00] 🔔 NEW ORDER!
   Customer   : Priya
   Restaurant : KFC
   Amount     : ₹342
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Step 1: Confirming order...
✅ KFC confirmed!

⚡ Step 2: Finding nearest driver...
🔍 Available drivers: 5
✅ Randomly picked: Dinesh Sharma

✅ Driver assigned!
   Name    : Dinesh Sharma
   Rating  : ⭐ 4.7
   Vehicle : Honda Shine
   ETA     : 10 mins

🎯 Assignment time: 3.1s
```

---

## Key Concepts Learned
```
1. Redis Pub/Sub
   → Real time messaging
   → No polling needed
   → Instant delivery ⚡

2. Publisher
   → Sends messages to channel
   → Does not know who receives

3. Subscriber
   → Listens to channel
   → Receives instantly

4. Channels
   → Like WhatsApp groups
   → Multiple subscribers possible
   → Zero latency
```

---

## Tech Stack

- **Runtime:** Node.js
- **Messaging:** Redis Pub/Sub
- **Network:** Tailscale VPN
- **Container:** Docker

---

## Follow Along

📸 Instagram: [@distributed.dev](https://instagram.com/distributed.dev)

New simulation every Mon • Wed • Fri 🗓️

---

## License

MIT — Learn freely 🚀