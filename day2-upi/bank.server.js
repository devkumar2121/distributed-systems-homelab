// Two modes:
// Mode 1: WITHOUT Redis lock (shows the bug)
// Mode 2: WITH Redis lock (shows the fix)
// ubntu: node bank.server.js
// mac: node upi.client.js

const express = require("express");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const redis = createClient({
  socket: { host: process.env.REDIS_HOST, port: 6379 },
  password: process.env.REDIS_PASSWORD,
});

// Bank account
let balance = 1000;

// ─── WITHOUT LOCK (buggy) ───────────────
app.post("/pay-without-lock", async (req, res) => {
  const { amount, txnId } = req.body;

  console.log(`\n💸 [${txnId}] Request: deduct ₹${amount}`);
  console.log(`   Balance before: ₹${balance}`);

  // Simulate processing delay
  await sleep(100);

  if (balance >= amount) {
    balance -= amount;
    console.log(`✅ [${txnId}] Paid! Balance: ₹${balance}`);
    res.json({ success: true, balance });
  } else {
    console.log(`❌ [${txnId}] Insufficient balance`);
    res.json({ success: false, balance });
  }
});

// ─── WITH REDIS LOCK (fixed) ─────────────
app.post("/pay-with-lock", async (req, res) => {
  const { amount, txnId } = req.body;
  const lockKey = `lock:account:ACC001`;

  console.log(`\n💸 [${txnId}] Request: deduct ₹${amount}`);

  // Try to acquire lock atomically
//   NX: only set if not exists, EX: expire after 5 seconds to prevent deadlock
  const locked = await redis.set(lockKey, txnId, { NX: true, EX: 5 });

  if (!locked) {
    console.log(`🚫 [${txnId}] BLOCKED — account locked!`);
    return res.json({
      success: false,
      reason: "Double payment prevented! ✅",
    });
  }

  try {
    console.log(`🔒 [${txnId}] Lock acquired`);
    console.log(`   Balance before: ₹${balance}`);

    await sleep(100);

    if (balance >= amount) {
      balance -= amount;
      console.log(`✅ [${txnId}] Paid! Balance: ₹${balance}`);
      res.json({ success: true, balance });
    } else {
      res.json({ success: false, reason: "Insufficient" });
    }
  } finally {
    await redis.del(lockKey);
    console.log(`🔓 [${txnId}] Lock released`);
  }
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function start() {
  await redis.connect();
  // Reset balance
  balance = 1000;
  app.listen(3000, () => {
    console.log("🏦 Bank Server running");
    console.log(`💰 Balance: ₹${balance}`);
  });
}

start();
