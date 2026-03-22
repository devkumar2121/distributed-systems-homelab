// Simulates double click on Pay button (mac)
const axios = require("axios");

const BANK = `http://${process.env.UBUNTU_IP}:3000`;

async function simulateDoublePayment(endpoint) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📱 GPay — Double Click Simulation`);
  console.log(`   Paying ₹800 to Swiggy`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Send SAME payment TWICE simultaneously
  // This simulates user double clicking Pay
  const [r1, r2] = await Promise.all([
    axios
      .post(`${BANK}/${endpoint}`, {
        amount: 800,
        txnId: "TXN001",
      })
      .catch((e) => ({ data: { error: e.message } })),
    axios
      .post(`${BANK}/${endpoint}`, {
        amount: 800,
        txnId: "TXN001",
      })
      .catch((e) => ({ data: { error: e.message } })),
  ]);

  console.log("\n📊 RESULTS:");
  console.log(`Payment 1: ${JSON.stringify(r1.data)}`);
  console.log(`Payment 2: ${JSON.stringify(r2.data)}`);
}

async function run() {
  // Round 1 — WITHOUT lock (shows bug)
  console.log("🔴 ROUND 1: Without Redis Lock");
  await simulateDoublePayment("pay-without-lock");

  await new Promise((r) => setTimeout(r, 2000));

  // Round 2 — WITH lock (shows fix)
  console.log("\n🟢 ROUND 2: With Redis Lock");
  await simulateDoublePayment("pay-with-lock");
}

run();

// ---

// ## The Dramatic Output

// ### WITHOUT Redis Lock (Bug) 😱
// ```
// Mac terminal:
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 GPay — Double Click Simulation
//    Paying ₹800 to Swiggy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📊 RESULTS:
// Payment 1: { success: true, balance: 200 }
// Payment 2: { success: true, balance: -600 }
//            ↑
//            NEGATIVE BALANCE! 💀

// Ubuntu terminal:
// 💸 [TXN001] Request: deduct ₹800
//    Balance before: ₹1000
// 💸 [TXN001] Request: deduct ₹800
//    Balance before: ₹1000  ← read same value!
// ✅ [TXN001] Paid! Balance: ₹200
// ✅ [TXN001] Paid! Balance: -₹600 💀
// ```

// ### WITH Redis Lock (Fixed) ✅
// ```
// Mac terminal:
// 📊 RESULTS:
// Payment 1: { success: true, balance: 200 }
// Payment 2: { success: false,
//              reason: 'Double payment prevented! ✅' }

// Ubuntu terminal:
// 💸 [TXN001] Request: deduct ₹800
// 🔒 [TXN001] Lock acquired
//    Balance before: ₹1000
// 🚫 [TXN001] BLOCKED — account locked!
// ✅ [TXN001] Paid! Balance: ₹200
// 🔓 [TXN001] Lock released
