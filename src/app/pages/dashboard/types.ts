// ─────────────────────────────────────────────────────────────────────────────
// Dashboard shared types
// ─────────────────────────────────────────────────────────────────────────────

export type TabType = 'dashboard' | 'listings' | 'offers' | 'deals' | 'meetings' | 'alerts' | 'settings';
export type ViewMode = 'dashboard' | 'create-listing' | 'edit-listing';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'sent';
export type DealStatus  = 'in-progress' | 'completed';
export type ListingStatus = 'active' | 'under-review' | 'sold';

export interface Listing {
  id: number;
  title: string;
  titleEn: string;
  location: string;
  locationEn: string;
  price: string;
  status: ListingStatus;
  views: number;
  offers: number;
  favorites: number;
  image: string;
}

export interface Offer {
  id: number;
  listingTitle: string;
  listingTitleEn: string;
  buyerName: string;
  buyerNameEn: string;
  listingPrice: string;
  offerPrice: string;
  date: string;
  status: OfferStatus;
  type: string;
  direction: 'received' | 'sent';
}

export interface Meeting {
  id: number;
  with: string;
  withEn: string;
  role: string;
  roleEn: string;
  reqDate: string;
  recDate: string;
  prefDate: string;
  schedDate: string;
  status: 'scheduled' | 'past';
  link: string | null;
}

export interface DealStep {
  id: number;
  title: string;
  desc: string;
  status: 'verified' | 'signed' | 'pending';
}

export interface Deal {
  id: string;
  title: string;
  titleEn: string;
  seller: string;
  sellerEn: string;
  buyer: string;
  buyerEn: string;
  finalOffer: string;
  status: DealStatus;
  finalizedDate: string;
  startDate: string;
  expectedDate: string;
  progress: number;
  currentStep: number;
  steps: DealStep[];
  files: { name: string; size: string }[];
}

export interface Alert {
  id: number;
  title: string;
  desc: string;
  time: string;
  type: string;
}
