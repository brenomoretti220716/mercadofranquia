export interface FranchiseData {
  name: string | null;
  headquarter?: string | null;
  totalUnits?: number | null;
  description?: string | null;

  // Midias
  videoUrl?: string | null;
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  galleryUrls?: string | null;

  // Investment Range (numeric - parsed from scraped text)
  minimumInvestment?: number | null;
  maximumInvestment?: number | null;

  // Capital (numeric)
  setupCapital?: number | null;
  workingCapital?: number | null;

  // Store area (numeric, in m²)
  storeArea?: number | null;

  // ROI Range (numeric, in months - parsed from scraped text)
  minimumReturnOnInvestment?: number | null;
  maximumReturnOnInvestment?: number | null;

  // Revenue and fees (numeric)
  averageMonthlyRevenue?: number | null;
  franchiseFee?: number | null;

  // Percentages (numeric, 0-100)
  royalties?: number | null;
  advertisingFee?: number | null;

  // Calculation bases (keep as strings for flexibility)
  calculationBaseRoyaltie?: string | null;
  calculationBaseAdFee?: string | null;

  // Contato
  website?: string | null;
  email?: string | null;
  phone?: string | null;

  // Metadados
  scrapedWebsite: string;
  lastScrapedAt: Date;

  // Com IA
  businessType?: string | null;
  segment?: string | null;
  subsegment?: string | null;
  brandFoundationYear?: string | null;
  franchiseStartYear?: string | null;
  abfSince?: string | null;
  isAbfAssociated?: boolean | null;
}
