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
