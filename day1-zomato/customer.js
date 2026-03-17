// customer.js — Mac 🍎
require("dotenv").config();
const { createClient } = require("redis");
console.log(process.env.REDIS_HOST,"redis_host");
const publisher = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD,
});

const subscriber = publisher.duplicate();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function placeOrder() {
  await publisher.connect();
  await subscriber.connect();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 Zomato App — Mac 🍎");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Listen for updates
  await subscriber.subscribe("zomato:updates", (message) => {
    const update = JSON.parse(message);
    const time = new Date().toLocaleTimeString();

    console.log(`[${time}] 🔔 ${update.status}`);
    console.log(`         ${update.message}\n`);

    if (update.driver) {
      console.log(`         🛵 Driver : ${update.driver.name}`);
      console.log(`         ⭐ Rating : ${update.driver.rating}`);
      console.log(`         ⏱️  ETA    : ${update.eta}\n`);
    }
  });

  // Place ONE clear order
  const order = {
    orderId: `ORD${Date.now()}`,
    customer: "Rahul",
    restaurant: "Burger King",
    items: ["Whopper", "Fries"],
    amount: 450,
    placedAt: new Date().toLocaleTimeString(),
  };

  console.log("🍕 Placing order...");
  console.log(`   Order ID   : ${order.orderId}`);
  console.log(`   Restaurant : ${order.restaurant}`);
  console.log(`   Items      : ${order.items.join(", ")}`);
  console.log(`   Amount     : ₹${order.amount}`);
  console.log(`   Time       : ${order.placedAt}\n`);

  const startTime = Date.now();

  await publisher.publish(
    "zomato:orders",
    JSON.stringify({ ...order, startTime }),
  );

  console.log("✅ Order sent!");
  console.log("⏳ Waiting for driver...\n");
}

placeOrder().catch(console.error);
