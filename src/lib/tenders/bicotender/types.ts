export type BicoTender = {
  id: string;
  url: string;
  title: string;
  customer?: string;
  customerInn?: string;
  price?: number;
  currency?: string;
  publishedAt?: string;
  deadline?: string;
  region?: string;
  category?: string;
  status?: string;
  source: "bicotender";
  raw: unknown;
};

export type TenderSearchOptions = {
  keywords?: string[];
  minPrice?: number;
  maxPrice?: number;
  activeOnly?: boolean;
  limit?: number;
};

export type BicoClientOptions = {
  apiUrl?: string;
  token?: string;
  timeoutMs?: number;
};
