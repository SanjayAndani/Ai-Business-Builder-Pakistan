export interface BrandData {
  names: string[];
  taglines: string[];
  positioning: string;
  logoUrl?: string;
}

export interface PlanData {
  audience: string;
  productIdea: string;
  pricing: string;
  launch: string;
  risks: string[];
  growth: string[];
}

export interface MarketingData {
  captions: string[];
  adCopy: string;
  hashtags: string[];
  slogans: string[];
}

export interface WebsiteData {
  hero: string;
  subheading: string;
  about: string;
  services: string[];
  cta: string;
  contact: string;
  faq: { q: string; a: string }[];
}

export interface Financials {
  startupCosts: { item: string; amount: string }[];
  monthlyExpenses: { item: string; amount: string }[];
  revenueTargets: string;
}

export interface Analysis {
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  competitors: { name: string; description: string }[];
}

export interface Operations {
  legal: string[];
  team: string[];
  timeline: { week: string; tasks: string[] }[];
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
}

export interface BusinessPlanResponse {
  brand: BrandData;
  plan: PlanData;
  marketing: MarketingData;
  website: WebsiteData;
  financials: Financials;
  analysis: Analysis;
  operations: Operations;
  code: {
    files: CodeFile[];
  };
}
