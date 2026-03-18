// customer.js — Mac 🍎
require("dotenv").config({ quiet: true });
const { createClient } = require("redis");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Redis Connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
const publisher = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD,
});

const subscriber = publisher.duplicate();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data Arrays
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
const customers = [
  "Rahul",
  "Priya",
  "Amit",
  "Sneha",
  "Vikram",
  "Anita",
  "Rohit",
  "Pooja",
];

const locations = [
  "Connaught Place, Delhi",
  "Bandra, Mumbai",
  "Koramangala, Bangalore",
  "Sector 18, Noida",
  "Salt Lake, Kolkata",
  "Jubilee Hills, Hyderabad",
  "Anna Nagar, Chennai",
  "Kothrud, Pune",
];

const restaurants = [
  "Burger King",
  "McDonalds",
  "Pizza Hut",
  "Dominos",
  "KFC",
  "Subway",
  "Barbeque Nation",
  "Haldirams",
];

const menuItems = {
  "Burger King": ["Whopper", "Fries", "Onion Rings", "Coke"],
  McDonalds: ["Big Mac", "McFries", "Nuggets", "Sprite"],
  "Pizza Hut": ["Margherita", "Garlic Bread", "Pepsi"],
  Dominos: ["Pepperoni Pizza", "Pasta", "Coke"],
  KFC: ["Chicken Bucket", "Coleslaw", "Pepsi"],
  Subway: ["Veggie Sub", "Meatball Sub", "Cookies"],
  "Barbeque Nation": ["Seekh Kebab", "Paneer Tikka", "Naan"],
  Haldirams: ["Chole Bhature", "Samosa", "Lassi"],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Random Order Generator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateRandomOrder() {
  const customer = customers[Math.floor(Math.random() * customers.length)];

  const location = locations[Math.floor(Math.random() * locations.length)];

  const restaurant =
    restaurants[Math.floor(Math.random() * restaurants.length)];

  const allItems = menuItems[restaurant];
  const selectedItems = allItems.sort(() => Math.random() - 0.5).slice(0, 2);

  const amount = Math.floor(Math.random() * (800 - 150 + 1) + 150);

  return {
    orderId: `ORD${Date.now()}`,
    customer: customer,
    location: location,
    restaurant: restaurant,
    items: selectedItems,
    amount: amount,
    placedAt: new Date().toLocaleTimeString(),
    startTime: Date.now(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main App
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function startCustomerApp() {
  await publisher.connect();
  await subscriber.connect();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 Zomato App — Mac 🍎");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Listen for updates from Ubuntu
  await subscriber.subscribe("zomato:updates", (message) => {
    const update = JSON.parse(message);
    const time = new Date().toLocaleTimeString();

    console.log(`[${time}] 🔔 ${update.status}`);
    console.log(`         ${update.message}`);

    if (update.driver) {
      console.log(`         🛵 Driver : ${update.driver.name}`);
      console.log(`         ⭐ Rating : ${update.driver.rating}`);
      console.log(`         ⏱️  ETA    : ${update.eta}`);
    }

    if (update.totalTime) {
      console.log(`         ⚡ Time   : ${update.totalTime}`);
    }

    console.log();
  });

  // Place random orders every 15 seconds
  let orderCount = 0;

  while (true) {
    orderCount++;
    const order = generateRandomOrder();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🍕 Order #${orderCount}`);
    console.log(`   Order ID   : ${order.orderId}`);
    console.log(`   Customer   : ${order.customer}`);
    console.log(`   Location   : ${order.location}`);
    console.log(`   Restaurant : ${order.restaurant}`);
    console.log(`   Items      : ${order.items.join(", ")}`);
    console.log(`   Amount     : ₹${order.amount}`);
    console.log(`   Time       : ${order.placedAt}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await publisher.publish("zomato:orders", JSON.stringify(order));

    console.log("✅ Order sent to Zomato!");
    console.log("⏳ Waiting for driver...\n");

    // Wait 15 seconds before next order
    await sleep(15000);
  }
}

startCustomerApp().catch(console.error);

// ---

// ## What Changes Every Order
// ```
// Order 1:
// Customer   : Priya
// Location   : Bandra, Mumbai
// Restaurant : KFC
// Items      : Chicken Bucket, Pepsi
// Amount     : ₹342

// Order 2:
// Customer   : Vikram
// Location   : Koramangala, Bangalore
// Restaurant : Dominos
// Items      : Pepperoni Pizza, Coke
// Amount     : ₹567

// Order 3:
// Customer   : Sneha
// Location   : Sector 18, Noida
// Restaurant : Haldirams
// Items      : Chole Bhature, Lassi
// Amount     : ₹218

// Every order completely different! 🔥
// ```

// ---

// ## Why This is Better For Instagram
// ```
// Without random generator:
// Every order shows:
// "Rahul, Burger King, Whopper"
//         │
//         ▼
// Boring. Looks fake.
// Like a tutorial 😐

// With random generator:
// Every order is different!
//         │
//         ▼
// Looks REAL
// Looks like actual
// Zomato backend
// processing live orders! 🔥
