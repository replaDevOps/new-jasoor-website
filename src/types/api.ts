// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser { id: string; status: string; }
export interface AuthResponse { token: string; refreshToken: string; user: AuthUser; }
export interface MutationResult { success: boolean; message: string; }

// ─── Business ─────────────────────────────────────────────────────────────────
export interface Category { id: string; name: string; arabicName: string; isDigital?: boolean; }

export interface BusinessListItem {
  id: string;
  businessTitle: string;
  description: string;
  image?: string;
  revenue: number;
  profit: number;
  price: number;
  capitalRecovery: number;
  isByTakbeer: boolean;
  isSaved: boolean;
  businessStatus: string;
  multiple?: number;
  savedBy?: Array<{ id: string }>;
  category: { name: string; arabicName: string };
  city?: string;
  district?: string;
  reference?: string;
}

export interface AssetItem {
  id?: string; isActive?: boolean; name: string;
  price: number; purchaseYear: number; quantity: number;
}

export interface BusinessDocument {
  id?: string; title: string; fileName: string;
  filePath: string; fileType: string; description?: string;
}

export interface BusinessDetail {
  id: string; businessTitle: string; isSupportVerified?: boolean;
  image?: string;
  reference?: string; district?: string; city?: string; description?: string;
  foundedDate?: string; growthOpportunities?: string; isByTakbeer: boolean;
  isAbleInActive?: boolean; multiple?: number; numberOfEmployees?: string;
  price: number; profit: number; profitMargen?: number; profittime?: string;
  reason?: string; capitalRecovery: number; revenue: number; revenueTime?: string;
  supportSession?: number; supportDuration?: number; businessStatus: string;
  url?: string; isStatsVerified?: boolean;
  category: Category;
  savedBy?: Array<{ id: string }>; seller?: { id: string };
  assets: AssetItem[]; liabilities: AssetItem[]; inventoryItems: AssetItem[];
  documents: BusinessDocument[];
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface NavUser {
  id: string; name: string; email: string; phone?: string;
  city?: string; district?: string; status: string;
  documents?: BusinessDocument[];
}

// ─── Offers ───────────────────────────────────────────────────────────────────
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MEETING' | 'COUNTERED';
export interface Offer {
  id: string; price: number; status: OfferStatus; createdAt: string;
  createdBy?: string; isProceedToPay?: boolean; commission?: number;
  business: { id: string; businessTitle: string; price: number; businessStatus?: string; seller?: { id: string; name: string } };
  buyer?: { id: string; name?: string };
}

// ─── Meetings ─────────────────────────────────────────────────────────────────
export type MeetingStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'REJECTED' | 'READY';
export interface Meeting {
  id: string; createdAt: string; requestedDate?: string; requestedEndDate?: string;
  receiverAvailabilityDate?: string; adminAvailabilityDate?: string;
  status: MeetingStatus; meetingLink?: string;
  requestedTo?: { id?: string; name: string }; requestedBy?: { id: string; name: string };
  business: { id?: string; businessTitle: string; price: number; businessStatus?: string; seller?: { id: string } };
  offer?: { id: string; price: number };
}

// ─── Deals ────────────────────────────────────────────────────────────────────
export interface Deal {
  id: string; status: string; price: number; createdAt: string;
  isDsaSeller?: boolean; isDsaBuyer?: boolean; isPaymentVedifiedSeller?: boolean;
  isDocVedifiedSeller?: boolean; isDocVedifiedAdmin?: boolean; isCommissionVerified?: boolean;
  isPaymentVedifiedAdmin?: boolean; isBuyerCompleted?: boolean; isSellerCompleted?: boolean;
  isDocVedifiedBuyer?: boolean; isCommissionUploaded?: boolean;
  ndaPdfPath?: string; arabicNdaPdfPath?: string;
  buyer: { id: string; name: string };
  business: { id: string; businessTitle: string; seller?: { id: string; name: string }; documents?: BusinessDocument[] };
  offer?: { id: string; price: number; status: string; commission?: number };
}

// ─── Bank ─────────────────────────────────────────────────────────────────────
export interface BankAccount {
  id: string; bankName: string; accountNumber: string; accountTitle: string;
  iban?: string; cardNumber?: string; cardType?: string; isActive?: boolean; createdAt?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string; name: string; message: string; createdAt: string;
  isRead: boolean; user?: { id: string; name: string };
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export interface UploadResponse { fileName: string; fileUrl: string; fileType: string; }
export interface DocumentInput { title: string; fileName: string; filePath: string; fileType: string; description?: string; }

// ─── Setting ──────────────────────────────────────────────────────────────────
export interface AppSetting { commissionRate: number; faceBook?: string; instagram?: string; whatsApp?: string; }
