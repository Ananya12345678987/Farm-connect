/** Static site content. Copy lives here so pages stay layout-only. */

export const NAV_LINKS = [
  { id: "home", label: "Home", to: "/", hash: "#top" },
  { id: "how", label: "How it works", to: "/", hash: "#how-it-works" },
  { id: "farmers", label: "For farmers", to: "/", hash: "#for-farmers" },
  { id: "buyers", label: "For buyers", to: "/", hash: "#for-buyers" },
  { id: "about", label: "About", to: "/about" },
];

export const ROLES = [
  {
    id: "farmer",
    title: "Farmer",
    tagline: "You grow it",
    description:
      "List what is ready this week, set your own rate, and talk to buyers directly.",
    action: "Join as a farmer",
    route: "/farmer-register",
    accent: "forest",
  },
  {
    id: "buyer",
    title: "Buyer",
    tagline: "You source it",
    description:
      "Browse harvests by region and grade, then buy from the grower who raised it.",
    action: "Join as a buyer",
    route: "/buyer-register",
    accent: "lime",
  },
  {
    id: "admin",
    title: "Administrator",
    tagline: "You keep it honest",
    description:
      "Verify growers, watch listing quality, and keep the marketplace trustworthy.",
    action: "Administrator access",
    route: "/admin-register",
    accent: "ink",
  },
];

export const VALUE_POINTS = [
  {
    id: "direct",
    title: "One hop, not five",
    body: "A buyer sees the grower's name, their village, and their asking rate. Nothing is routed through a chain of agents who each take a cut.",
  },
  {
    id: "pricing",
    title: "The farmer sets the number",
    body: "Rates are entered by the person who grew the crop and stay visible until they change it. No silent markdowns at the gate.",
  },
  {
    id: "verified",
    title: "Growers are checked before they sell",
    body: "Land records and a field visit are confirmed at sign-up, so a buyer knows a listing belongs to a real farm.",
  },
  {
    id: "simple",
    title: "Built for a phone on a field bund",
    body: "Listing a crop takes four fields and about a minute, on a mid-range Android over a patchy connection.",
  },
];

export const STEPS = [
  {
    id: 1,
    title: "A farmer signs up",
    body: "Land details and a mobile number. A field officer verifies the farm within two working days.",
  },
  {
    id: 2,
    title: "They list what is ready",
    body: "Crop, grade, quantity, and the rate they want. The listing goes live the moment it is saved.",
  },
  {
    id: 3,
    title: "Buyers search by what they need",
    body: "Filter by crop, region, quantity, and organic status. Every result names the farm behind it.",
  },
  {
    id: 4,
    title: "They deal with each other",
    body: "Buyer and farmer agree quantity and pickup in the thread. FarmConnect records it and stays out of the way.",
  },
];

export const STATS = [
  { id: "farmers", value: 500, suffix: "+", label: "Verified farmers", caption: "across 25 districts" },
  { id: "products", value: 1200, suffix: "+", label: "Live listings", caption: "updated every morning" },
  { id: "connections", value: 2000, suffix: "+", label: "Buyer connections", caption: "made since launch" },
  { id: "regions", value: 25, suffix: "+", label: "Regions covered", caption: "five states and growing" },
];

export const FARMER_BENEFITS = [
  { id: "list", title: "List a harvest in a minute", body: "Crop, quantity, grade, rate. Saved and live." },
  { id: "reach", title: "Reach buyers outside your mandi", body: "Traders in other districts see your listing the same day." },
  { id: "price", title: "Hold your own price", body: "Your rate stays up until you change it." },
  { id: "track", title: "See who is looking", body: "Views, saves, and enquiries per listing." },
  { id: "grow", title: "Build repeat buyers", body: "Buyers who bought once can find you again by name." },
];

export const BUYER_BENEFITS = [
  { id: "source", title: "Source straight from the farm", body: "Every listing names the grower and the village." },
  { id: "grade", title: "Know the grade before you commit", body: "Moisture, size, and harvest date on every lot." },
  { id: "region", title: "Buy by region", body: "Filter to the districts you can actually collect from." },
  { id: "repeat", title: "Keep your growers", body: "Save farms you trust and reorder next season." },
];

export const PLATFORM_FEATURES = [
  {
    id: "listings",
    title: "Listings that expire",
    body: "A lot disappears when it is sold or when the harvest window closes, so buyers never chase stale stock.",
  },
  {
    id: "records",
    title: "A record of every deal",
    body: "Quantity, rate, and date are logged for both sides — useful at loan time and at audit time.",
  },
  {
    id: "regional",
    title: "Kannada, Hindi, and English",
    body: "The farmer-facing side reads in the language the farmer already uses on their phone.",
  },
  {
    id: "offline",
    title: "Tolerant of bad signal",
    body: "Listings draft locally and sync when the connection returns, instead of failing on submit.",
  },
];

export const ABOUT = {
  mission:
    "Give a farmer the same view of the market that a trader has always had.",
  vision:
    "A market where the person who grew the crop is the person who names its price.",
  story: [
    "A tomato that leaves Kolar at ₹8 a kilo reaches a city kitchen at ₹40. The farmer sees the first number. Four intermediaries share the difference, and none of them grew anything.",
    "FarmConnect exists to shorten that line. A farmer lists what is ready. A buyer searches for what they need. They find each other by name, agree a rate between themselves, and the crop moves once instead of five times.",
    "We are not a trading company and we do not take a position on anyone's crop. We verify that farms are real, keep listings current, and record what was agreed. The trade itself belongs to the two people making it.",
  ],
};

export const FOOTER_LINKS = [
  {
    id: "platform",
    heading: "Platform",
    items: [
      { label: "Home", to: "/" },
      { label: "How it works", to: "/#how-it-works" },
      { label: "For farmers", to: "/#for-farmers" },
      { label: "For buyers", to: "/#for-buyers" },
      { label: "About", to: "/about" },
    ],
  },
  {
    id: "account",
    heading: "Account",
    items: [
      { label: "Log in", to: "/login" },
      { label: "Register as a farmer", to: "/farmer-register" },
      { label: "Register as a buyer", to: "/buyer-register" },
      { label: "Administrator access", to: "/admin-register" },
    ],
  },
];