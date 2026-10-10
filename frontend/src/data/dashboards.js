import { PRODUCTS } from "./products";

const pick = (...ids) => ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

/* ============================================================
   Farmer — Shivamma Gowda, Gowda Thota, Kolar
   ============================================================ */

export const FARMER = {
  user: {
    name: "Shivamma Gowda",
    farm: "Gowda Thota",
    location: "Kolar, Karnataka",
    initials: "SG",
    verified: true,
  },
  stats: [
    { id: "listings", label: "Live listings", value: 7, delta: +2, deltaLabel: "vs last week", format: "count" },
    { id: "orders", label: "Active orders", value: 4, delta: +1, deltaLabel: "vs last week", format: "count" },
    { id: "revenue", label: "Revenue this season", value: 412000, delta: +18, deltaLabel: "vs last season", format: "inr" },
    { id: "buyers", label: "Buyer connections", value: 23, delta: +5, deltaLabel: "vs last month", format: "count" },
  ],
  sales: [
    { label: "Apr", value: 42000 },
    { label: "May", value: 51000 },
    { label: "Jun", value: 38000 },
    { label: "Jul", value: 64000 },
    { label: "Aug", value: 79000 },
    { label: "Sep", value: 96000 },
  ],
  listings: pick("p-tomato-kolar", "p-spinach-dharwad", "p-onion-nashik"),
  orders: [
    { id: "FC-2291", buyer: "Anand Traders", item: "Nati tomatoes", quantity: "400 kg", value: 11200, status: "confirmed", date: "2026-09-13" },
    { id: "FC-2288", buyer: "Green Basket Retail", item: "Organic palak", quantity: "60 kg", value: 2520, status: "in transit", date: "2026-09-12" },
    { id: "FC-2280", buyer: "Hubballi Fresh Mart", item: "Nati tomatoes", quantity: "250 kg", value: 7000, status: "awaiting pickup", date: "2026-09-11" },
    { id: "FC-2274", buyer: "Sharma Vegetables", item: "Red onions, medium", quantity: "900 kg", value: 21600, status: "paid", date: "2026-09-09" },
  ],
  activity: [
    { id: "a1", text: "Anand Traders confirmed order FC-2291", time: "2 hours ago", kind: "order" },
    { id: "a2", text: "Your palak listing was saved by 3 buyers", time: "5 hours ago", kind: "save" },
    { id: "a3", text: "Payment of ₹21,600 received for FC-2274", time: "Yesterday", kind: "payment" },
    { id: "a4", text: "Tomato listing crossed 100 views", time: "2 days ago", kind: "view" },
  ],
};

/* ============================================================
   Buyer — Anand Traders, Hubballi
   ============================================================ */

export const BUYER = {
  user: {
    name: "Anand Kulkarni",
    business: "Anand Traders",
    location: "Hubballi, Karnataka",
    initials: "AK",
    verified: true,
  },
  stats: [
    { id: "orders", label: "Active orders", value: 6, delta: +2, deltaLabel: "vs last week", format: "count" },
    { id: "saved", label: "Saved listings", value: 14, delta: +3, deltaLabel: "vs last week", format: "count" },
    { id: "purchases", label: "Spent this season", value: 286000, delta: +9, deltaLabel: "vs last season", format: "inr" },
    { id: "farmers", label: "Farms you buy from", value: 11, delta: +1, deltaLabel: "vs last month", format: "count" },
  ],
  recentlyViewed: pick("p-mango-ratnagiri", "p-millet-bagalkot", "p-rice-raichur"),
  recommended: pick("p-turmeric-erode", "p-groundnut-anand", "p-banana-theni"),
  orders: [
    { id: "FC-2291", farm: "Gowda Thota", item: "Nati tomatoes", quantity: "400 kg", value: 11200, status: "confirmed", date: "2026-09-13" },
    { id: "FC-2286", farm: "Naik Siridhanya", item: "Foxtail millet", quantity: "8 quintal", value: 41600, status: "in transit", date: "2026-09-12" },
    { id: "FC-2279", farm: "Velan Spice Fields", item: "Turmeric fingers", quantity: "3 quintal", value: 42600, status: "awaiting pickup", date: "2026-09-10" },
  ],
  connections: [
    { id: "f1", name: "Shivamma Gowda", farm: "Gowda Thota", location: "Kolar, Karnataka", orders: 9, initials: "SG" },
    { id: "f2", name: "Kavita Naik", farm: "Naik Siridhanya", location: "Bagalkot, Karnataka", orders: 4, initials: "KN" },
    { id: "f3", name: "Lakshmi Velan", farm: "Velan Spice Fields", location: "Erode, Tamil Nadu", orders: 3, initials: "LV" },
  ],
};

/* ============================================================
   Admin — platform view
   ============================================================ */

export const ADMIN = {
  user: { name: "Meera Rao", role: "Platform administrator", initials: "MR", verified: true },
  stats: [
    { id: "farmers", label: "Verified farmers", value: 512, delta: +24, deltaLabel: "this month", format: "count" },
    { id: "buyers", label: "Active buyers", value: 347, delta: +31, deltaLabel: "this month", format: "count" },
    { id: "listings", label: "Live listings", value: 1243, delta: +112, deltaLabel: "this month", format: "count" },
    { id: "gmv", label: "Traded value", value: 18400000, delta: +14, deltaLabel: "vs last month", format: "inr" },
  ],
  growth: [
    { label: "Apr", value: 186 },
    { label: "May", value: 241 },
    { label: "Jun", value: 298 },
    { label: "Jul", value: 372 },
    { label: "Aug", value: 441 },
    { label: "Sep", value: 512 },
  ],
  categorySplit: [
    { label: "Vegetables", value: 38, tone: "forest" },
    { label: "Grains & pulses", value: 27, tone: "lime" },
    { label: "Fruits", value: 21, tone: "amber" },
    { label: "Spices", value: 14, tone: "clay" },
  ],
  pendingFarmers: [
    { id: "u-901", name: "Rahul Deshpande", farm: "Deshpande Krushi", location: "Sangli, Maharashtra", applied: "2026-09-14", status: "pending" },
    { id: "u-899", name: "Fatima Sheikh", farm: "Sheikh Bagayat", location: "Bijapur, Karnataka", applied: "2026-09-13", status: "pending" },
    { id: "u-895", name: "Gurpreet Singh", farm: "Singh Kheti", location: "Ludhiana, Punjab", applied: "2026-09-12", status: "in review" },
    { id: "u-890", name: "Thomas Kurian", farm: "Kurian Estate", location: "Wayanad, Kerala", applied: "2026-09-11", status: "verified" },
  ],
  flaggedListings: [
    { id: "l-4471", product: "Alphonso mangoes", farm: "Kadam Aamrai", reason: "Price 3x district median", raised: "2026-09-14", severity: "high" },
    { id: "l-4460", product: "Sona Masuri rice", farm: "Hiremath Bhoomi", reason: "Quantity unchanged for 21 days", raised: "2026-09-12", severity: "low" },
    { id: "l-4452", product: "Groundnuts, bold grade", farm: "Solanki Farms", reason: "Duplicate of listing l-4390", raised: "2026-09-11", severity: "medium" },
  ],
  activity: [
    { id: "ad1", text: "Gurpreet Singh uploaded revised land records", time: "40 minutes ago", kind: "verify" },
    { id: "ad2", text: "Listing l-4471 flagged by the pricing monitor", time: "3 hours ago", kind: "flag" },
    { id: "ad3", text: "24 farmers verified in Dharwad district", time: "Yesterday", kind: "verify" },
    { id: "ad4", text: "September regional report generated", time: "2 days ago", kind: "report" },
  ],
  reports: [
    { id: "r1", name: "District price spread", period: "September 2026", size: "412 KB" },
    { id: "r2", name: "Farmer verification log", period: "September 2026", size: "128 KB" },
    { id: "r3", name: "Listing quality audit", period: "Q3 2026", size: "1.1 MB" },
  ],
};