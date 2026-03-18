// zomato.backend.js — Ubuntu 🐧
require('dotenv').config({ quiet: true });
const { createClient } = require('redis');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Redis Connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
const subscriber = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD
});

const publisher = subscriber.duplicate();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Drivers Pool
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
const drivers = [
  {
    id:        'DRV001',
    name:      'Ramesh Kumar',
    rating:    4.8,
    eta:       '12 mins',
    vehicle:   'Honda Activa',
    available: true
  },
  {
    id:        'DRV002',
    name:      'Suresh Singh',
    rating:    4.5,
    eta:       '15 mins',
    vehicle:   'TVS Jupiter',
    available: true
  },
  {
    id:        'DRV003',
    name:      'Mahesh Yadav',
    rating:    4.9,
    eta:       '8 mins',
    vehicle:   'Bajaj Pulsar',
    available: true
  },
  {
    id:        'DRV004',
    name:      'Dinesh Sharma',
    rating:    4.7,
    eta:       '10 mins',
    vehicle:   'Honda Shine',
    available: true
  },
  {
    id:        'DRV005',
    name:      'Rajesh Verma',
    rating:    4.6,
    eta:       '18 mins',
    vehicle:   'Hero Splendor',
    available: true
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Random Driver Picker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pickRandomDriver() {

  // Filter only available drivers
  const availableDrivers = drivers.filter(
    driver => driver.available === true
  );

  // No drivers available
  if (availableDrivers.length === 0) {
    return null;
  }

  // Pick completely random driver
  // from available pool
  const randomIndex = Math.floor(
    Math.random() * availableDrivers.length
  );

  const selectedDriver = availableDrivers[randomIndex];

  // Mark driver as busy
  // so same driver not assigned twice
  const driverInPool = drivers.find(
    d => d.id === selectedDriver.id
  );
  driverInPool.available = false;

  console.log(`\n🔍 Available drivers: ${availableDrivers.length}`);
  console.log(`✅ Randomly picked: ${selectedDriver.name}`);

  return selectedDriver;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Free Driver After Delivery
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
function freeDriver(driverId) {
  const driver = drivers.find(d => d.id === driverId);
  if (driver) {
    driver.available = true;
    console.log(`\n🔓 ${driver.name} is available again!`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Show All Drivers Status
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showDriverStatus() {
  console.log('\n📊 Driver Status:');
  drivers.forEach(driver => {
    // Green dot for available or true, red dot for busy or false
    const status = driver.available
      ? '🟢 Available'
      : '🔴 Busy';
    console.log(
      `   ${driver.name} → ${status}`
    );
  });
  console.log();
}

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Process Each Order
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function processOrder(order) {
  const receivedAt = new Date().toLocaleTimeString();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[${receivedAt}] 🔔 NEW ORDER!`);
  console.log(`   Order ID   : ${order.orderId}`);
  console.log(`   Customer   : ${order.customer}`);
  console.log(`   Location   : ${order.location}`);
  console.log(`   Restaurant : ${order.restaurant}`);
  console.log(`   Items      : ${order.items.join(', ')}`);
  console.log(`   Amount     : ₹${order.amount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Show current driver status
  showDriverStatus();

  // Step 1 — Confirm order
  console.log('⚡ Step 1: Confirming order...');
  await sleep(1000);
  console.log(`✅ ${order.restaurant} confirmed!\n`);

  await publisher.publish(
    'zomato:updates',
    JSON.stringify({
      orderId: order.orderId,
      status:  'ORDER_CONFIRMED',
      message: `${order.restaurant} confirmed! ✅`
    })
  );

  // Step 2 — Pick random driver
  console.log('⚡ Step 2: Finding nearest driver...');
  await sleep(2000);

  const driver = pickRandomDriver();

  // No driver available
  if (!driver) {
    console.log('❌ No drivers available right now!');

    await publisher.publish(
      'zomato:updates',
      JSON.stringify({
        orderId: order.orderId,
        status:  'NO_DRIVER',
        message: 'No drivers available. Please wait... ⏳'
      })
    );
    return;
  }

  const assignedAt  = new Date().toLocaleTimeString();
  const totalTime   = (
    (Date.now() - order.startTime) / 1000
  ).toFixed(1);

  console.log(`\n✅ Driver assigned!`);
  console.log(`   Name    : ${driver.name}`);
  console.log(`   Rating  : ⭐ ${driver.rating}`);
  console.log(`   Vehicle : ${driver.vehicle}`);
  console.log(`   ETA     : ${driver.eta}`);
  console.log(`   Time    : ${assignedAt}`);
  console.log(`\n🎯 Assignment time: ${totalTime}s\n`);

  await publisher.publish(
    'zomato:updates',
    JSON.stringify({
      orderId:   order.orderId,
      status:    'DRIVER_ASSIGNED 🎉',
      message:   `${driver.name} is heading your way!`,
      driver: {
        name:    driver.name,
        rating:  driver.rating,
        vehicle: driver.vehicle,
      },
      eta:       driver.eta,
      totalTime: `${totalTime} seconds`
    })
  );

  // Step 3 — Simulate delivery
  // then free driver
  await sleep(5000);
  freeDriver(driver.id);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏳ Ready for next order...\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Start Backend
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function startBackend() {
  await subscriber.connect();
  await publisher.connect();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 Zomato Backend — Ubuntu 🐧');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ${drivers.length} drivers ready`);

  showDriverStatus();

  console.log('⏳ Waiting for orders...\n');

  await subscriber.subscribe(
    'zomato:orders',
    async (message) => {
      const order = JSON.parse(message);
      await processOrder(order);
    }
  );
}

startBackend().catch(console.error);

// ---

// ## How Random Driver Picker Works
// ```
// drivers pool:
// [Ramesh, Suresh, Mahesh, Dinesh, Rajesh]
// All available = true
//         │
//         ▼
// Order comes in
//         │
//         ▼
// Filter available drivers only:
// [Ramesh, Suresh, Mahesh, Dinesh, Rajesh]
//         │
//         ▼
// Pick random index:
// Math.random() * 5 = 2
// → Mahesh selected! 🎯
//         │
//         ▼
// Mark Mahesh as busy:
// available = false
//         │
//         ▼
// Next order comes:
// [Ramesh, Suresh, Dinesh, Rajesh]
// Mahesh excluded ✅
//         │
//         ▼
// After delivery:
// Mahesh available = true again ✅
// ```

// ---

// ## The Output You Will See
// ```
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏢 Zomato Backend — Ubuntu 🐧
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ 5 drivers ready

// 📊 Driver Status:
//    Ramesh Kumar → 🟢 Available
//    Suresh Singh → 🟢 Available
//    Mahesh Yadav → 🟢 Available
//    Dinesh Sharma→ 🟢 Available
//    Rajesh Verma → 🟢 Available

// ⏳ Waiting for orders...

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [10:30:00] 🔔 NEW ORDER!
//    Customer   : Priya
//    Restaurant : KFC
//    Amount     : ₹342
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📊 Driver Status:
//    Ramesh Kumar → 🟢 Available
//    Suresh Singh → 🟢 Available
//    Mahesh Yadav → 🟢 Available
//    Dinesh Sharma→ 🟢 Available
//    Rajesh Verma → 🟢 Available

// ⚡ Step 1: Confirming order...
// ✅ KFC confirmed!

// ⚡ Step 2: Finding nearest driver...

// 🔍 Available drivers: 5
// ✅ Randomly picked: Dinesh Sharma

// ✅ Driver assigned!
//    Name    : Dinesh Sharma
//    Rating  : ⭐ 4.7
//    Vehicle : Honda Shine
//    ETA     : 10 mins

// 🎯 Assignment time: 3.1s

// 🔓 Dinesh Sharma is available again!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏳ Ready for next order...