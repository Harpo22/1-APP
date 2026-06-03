// Shared option lists & category definitions.

export const PAYMENT_METHODS = ["Card", "Cash", "Bank Transfer"];

export const PERSONAL_INCOME_CATEGORIES = [
  "Salary",
  "Side Income",
  "Bonus",
  "Other Income",
];

export const PERSONAL_EXPENSE_CATEGORIES = [
  "Food",
  "Fuel",
  "Bills",
  "Gym / Health",
  "Supplements",
  "Clothes",
  "Entertainment",
  "Nights Out",
  "Subscriptions",
  "Random Spending",
  "Wasted Money",
  "Savings",
  "Investments",
  "Other",
];

// Categories that move money into wealth rather than out of it.
export const WEALTH_CATEGORIES = ["Savings", "Investments"];

export const BUSINESS_REVENUE_CATEGORIES = [
  "Website Builds",
  "Monthly Retainers",
  "Google Business Services",
  "Content Packages",
  "Consulting",
  "One-Off Projects",
  "Other Revenue",
];

export const BUSINESS_EXPENSE_CATEGORIES = [
  "Domains",
  "Hosting",
  "Claude",
  "Cursor",
  "Vercel",
  "Advertising",
  "Marketing",
  "Equipment",
  "Training",
  "Contractors",
  "Travel",
  "Fuel",
  "Office",
  "Other",
];

export const RECURRING_REVENUE_CATEGORIES = ["Monthly Retainers", "Google Business Services"];

export const WASTE_VERDICTS = ["Worth It", "Not Worth It", "Lesson Learned"];

export const WASTE_TRIGGERS = [
  "Bored",
  "Stressed",
  "Social Pressure",
  "Impulse",
  "Celebration",
  "Habit",
  "Other",
];

export const ASSET_FIELDS = [
  { key: "cash", label: "Cash" },
  { key: "savings", label: "Savings" },
  { key: "investments", label: "Investments" },
  { key: "crypto", label: "Crypto" },
  { key: "vehicles", label: "Vehicles" },
  { key: "businessValue", label: "Business Value" },
  { key: "other", label: "Other Assets" },
];

export const LIABILITY_FIELDS = [
  { key: "loans", label: "Loans" },
  { key: "creditCards", label: "Credit Cards" },
  { key: "otherDebt", label: "Other Debt" },
];

export const FUND_FIELDS = [
  { key: "emergencyFund", label: "Emergency Fund Balance" },
  { key: "houseDeposit", label: "House Deposit Fund" },
  { key: "investmentFund", label: "Investment Fund" },
  { key: "retirementFund", label: "Retirement Fund" },
];

export const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
];

export const PIPELINE_FIELDS = {
  leads: [
    { key: "newLeads", label: "New Leads" },
    { key: "contacted", label: "Contacted" },
    { key: "interested", label: "Interested" },
    { key: "followUp", label: "Follow Up Required" },
  ],
  sales: [
    { key: "callsBooked", label: "Calls Booked" },
    { key: "proposalsSent", label: "Proposals Sent" },
    { key: "dealsClosed", label: "Deals Closed" },
    { key: "projectsDelivered", label: "Projects Delivered" },
  ],
  revenue: [
    { key: "revenueClosed", label: "Revenue Closed", money: true },
    { key: "revenuePending", label: "Revenue Pending", money: true },
    { key: "mrr", label: "Monthly Recurring Revenue", money: true },
  ],
};

// ---- Mission Control customisable cards ----
// Each card is computed in MissionControl by id.
export const MISSION_CARDS = [
  { id: "netWorth", label: "Net Worth" },
  { id: "freedom", label: "Freedom Progress" },
  { id: "wealthScore", label: "Wealth Score" },
  { id: "monthlyIncome", label: "Monthly Income" },
  { id: "businessRevenue", label: "Business Revenue" },
  { id: "savings", label: "Savings This Month" },
  { id: "wasted", label: "Wasted This Month" },
  { id: "businessProfit", label: "Business Profit" },
  { id: "cashAvailable", label: "Cash Available" },
  { id: "businessCash", label: "Business Cash" },
  { id: "revenueVelocity", label: "Revenue Velocity" },
  { id: "cashRunway", label: "Cash Runway" },
];

export const DEFAULT_MISSION_LAYOUT = MISSION_CARDS.map((c) => ({ id: c.id, visible: true }));

// ---- CEO Daily Brief ----
export const CEO_BRIEF_METRICS = MISSION_CARDS;

export const CEO_BUSINESS_METRICS = [
  { id: "revenue", label: "Revenue" },
  { id: "profit", label: "Profit" },
  { id: "mrr", label: "Recurring Revenue" },
  { id: "leads", label: "New Leads" },
  { id: "conversion", label: "Conversion Rate" },
  { id: "outstanding", label: "Outstanding Invoices" },
];

export const DEFAULT_CEO_BRIEF = {
  metrics: ["netWorth", "monthlyIncome", "freedom", "wealthScore"],
  showAlerts: true,
  goals: [], // legacy goal ids; empty = top goals by progress
  businessMetrics: ["revenue", "profit", "leads"],
};

export const SNAPSHOT_TYPES = ["monthly", "quarterly", "yearly", "manual"];
