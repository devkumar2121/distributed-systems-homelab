// zomato.backend.js — Ubuntu 🐧
require('dotenv').config();
const { createClient } = require('redis');

const subscriber = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD
});

const publisher = subscriber.duplicate();

// Available drivers
const drivers = [
  { name: 'Ramesh Kumar', rating: 4.8, eta: '12 mins' },
  { name: 'Suresh Singh', rating: 4.5, eta: '15 mins' },
  { name: 'Mahesh Yadav', rating: 4.9, eta: '8 mins'  },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBackend() {
  await subscriber.connect();
  await publisher.connect();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 Zomato Backend — Ubuntu 🐧');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏳ Waiting for orders...\n');

  await subscriber.subscribe(
    'zomato:orders',
    async (message) => {
      const order = JSON.parse(message);
      const receivedAt = new Date().toLocaleTimeString();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[${receivedAt}] 🔔 NEW ORDER!`);
      console.log(`   From    : ${order.customer}`);
      console.log(`   Place   : ${order.restaurant}`);
      console.log(`   Amount  : ₹${order.amount}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Step 1 — Confirm order (1 second)
      console.log('⚡ Step 1: Confirming order...');
      await sleep(1000);
      console.log('✅ Order confirmed!\n');

      await publisher.publish(
        'zomato:updates',
        JSON.stringify({
          orderId: order.orderId,
          status: 'ORDER_CONFIRMED',
          message: `${order.restaurant} confirmed! ✅`
        })
      );

      // Step 2 — Assign driver (2 seconds)
      console.log('⚡ Step 2: Finding nearest driver...');
      await sleep(2000);

      // Pick best rated driver
      const driver = drivers.reduce((best, d) =>
        d.rating > best.rating ? d : best
      );

      const assignedAt = new Date().toLocaleTimeString();
      const totalTime = (Date.now() - order.startTime) / 1000;

      console.log(`✅ Driver assigned: ${driver.name}`);
      console.log(`   Rating  : ⭐ ${driver.rating}`);
      console.log(`   ETA     : ${driver.eta}`);
      console.log(`   Time    : ${assignedAt}`);
      console.log(`\n🎯 Total assignment time: ${totalTime}s\n`);

      await publisher.publish(
        'zomato:updates',
        JSON.stringify({
          orderId: order.orderId,
          status: 'DRIVER_ASSIGNED 🎉',
          message: `${driver.name} is on the way!`,
          driver: {
            name: driver.name,
            rating: driver.rating,
          },
          eta: driver.eta,
          totalTime: `${totalTime} seconds`
        })
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏳ Ready for next order...\n');
    }
  );
}

startBackend().catch(console.error);
```

// ---

// ## The Perfect Output For Instagram

// ### Ubuntu screen shows:
// ```
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏢 Zomato Backend — Ubuntu 🐧
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ Waiting for orders...

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [10:30:00] 🔔 NEW ORDER!
//    From    : Rahul
//    Place   : Burger King
//    Amount  : ₹450
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ⚡ Step 1: Confirming order...
// ✅ Order confirmed!

// ⚡ Step 2: Finding nearest driver...
// ✅ Driver assigned: Mahesh Yadav
//    Rating  : ⭐ 4.9
//    ETA     : 8 mins
//    Time    : 10:30:03

// 🎯 Total assignment time: 3.2s
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ```

// ### Mac screen shows:
// ```
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 Zomato App — Mac 🍎
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🍕 Placing order...
//    Order ID   : ORD1234567
//    Restaurant : Burger King
//    Items      : Whopper, Fries
//    Amount     : ₹450
//    Time       : 10:30:00

// ✅ Order sent!
// ⏳ Waiting for driver...

// [10:30:01] 🔔 ORDER_CONFIRMED
//            Burger King confirmed! ✅

// [10:30:03] 🔔 DRIVER_ASSIGNED 🎉
//            Mahesh Yadav is on the way!

//            🛵 Driver : Mahesh Yadav
//            ⭐ Rating : 4.9
//            ⏱️  ETA    : 8 mins
// ```

// **This is exactly what you post! 🔥**

// ---

// ## Your Day 1 Slide Content
// ```
// Slide 1 — Hook:
// "How Zomato assigns your
//  delivery partner in
//  under 10 seconds 🍕"

// Slide 2 — The Problem:
// "1 lakh orders during lunch rush
//  Every order needs a driver
//  assigned in under 10 seconds
//  How is this possible? 🤯"

// Slide 3 — The Architecture:
// Simple diagram:
// Mac (Customer) → Redis → Ubuntu (Backend)

// Slide 4 — Mac Terminal:
// Screenshot of customer.js running
// Order being placed

// Slide 5 — Ubuntu Terminal:
// Screenshot of backend running
// Driver being assigned

// Slide 6 — Split Screen:
// Both terminals visible
// Order flowing between them

// Slide 7 — The Timer:
// "Total assignment time: 3.2s ⚡
//  Under 10 seconds ✅"

// Slide 8 — Key Learning:
// "Redis Pub/Sub =
//  Instant communication
//  between machines
//  No polling. No waiting.
//  Pure real time. 🔥"

// Slide 9 — CTA:
// "Tomorrow I show what happens
//  when the driver goes offline
//  mid delivery 😱
//  Follow to see it 👀"
// ```

// ---

// ## Run It Right Now
// ```
// Step 1 → Create simplified files
// Step 2 → Ubuntu: node zomato.backend.js
// Step 3 → Mac: node customer.js
// Step 4 → Screen record both terminals
// Step 5 → Post tonight! 🚀