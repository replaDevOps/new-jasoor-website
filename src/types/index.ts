import {
  BusinessStatus,
  CampaignGroup,
  DealStatus,
  MeetingStatus,
  OfferStatus,
  PopulationDensity,
  SortOrder,
  UserStatus,
} from "../enum";
import { User } from "../entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface CreateRoleInput {
  name: string;
  viewDashboard?: boolean;
  viewListings?: boolean;
  editListings?: boolean;
  approveRejectListings?: boolean;
  viewMeetingRequests?: boolean;
  scheduleMeetings?: boolean;
  editMeetingDetails?: boolean;
  cancelMeetings?: boolean;
  viewDeals?: boolean;
  trackDealProgress?: boolean;
  verifyDocuments?: boolean;
  finalizeDeal?: boolean;
  viewFinanceDashboard?: boolean;
  downloadFinancialReports?: boolean;
  viewWebsitePages?: boolean;
  editArticle?: boolean;
  deleteArticle?: boolean;
  publishArticle?: boolean;
  viewAlerts?: boolean;
  manageRoles?: boolean;
}

export interface UpdateRoleInput {
  id: string;
  name: string;
  isActive: boolean;
  viewDashboard?: boolean;
  viewListings?: boolean;
  editListings?: boolean;
  approveRejectListings?: boolean;
  viewMeetingRequests?: boolean;
  scheduleMeetings?: boolean;
  editMeetingDetails?: boolean;
  cancelMeetings?: boolean;
  viewDeals?: boolean;
  trackDealProgress?: boolean;
  verifyDocuments?: boolean;
  finalizeDeal?: boolean;
  viewFinanceDashboard?: boolean;
  downloadFinancialReports?: boolean;
  viewWebsitePages?: boolean;
  editArticle?: boolean;
  deleteArticle?: boolean;
  publishArticle?: boolean;
  viewAlerts?: boolean;
  manageRoles?: boolean;
}

export interface CreateUserInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  picture: string;
  district: string;
  city: string;
  otp: number;

  isActive: boolean;
  isProfileCompleted: boolean;
  lastLoginDate: string;
  refreshToken: string;
  roleId: string;
  documents: [CreateDocumentInput];
}

export interface UpdateUserInput {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  picture: string;
  district: string;
  city: string;
  otp: number;
  status: UserStatus;

  isActive: boolean;
  isProfileCompleted: boolean;
  lastLoginDate: string;
  refreshToken: string;
  roleId: string;
  documents: [CreateDocumentInput];
  language: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Decoded {
  userId: string;
  // role: Role;
  pin: number;
  branchId?: string;
}

export interface PermissionRequirements {
  [key: string]: boolean;
}

export interface CreateDocumentInput {
  title: string;
  fileName: string;
  fileType: string;
  filePath: string;
  description: string;
  businessId?: string;
}
export interface UpdateDocumentInput {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  filePath: string;
  description?: string;
  businessId: string;
}
export interface CreateNotificationInput {
  title: string;
  description: string;
  type: string;
  userId: string;
  applicationId: string;
  isRead: boolean;
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface UpdateNotificationInput {
  id: string;
  title: string;
  description: string;
  type: string;
  userId: string;
  applicationId: string;
  isRead: boolean;
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthYearInput {
  year: number;
  localBusinessGrowth: number;
}

export interface CategoryGrowthInput {
  regionName: string;
  years: GrowthYearInput[];
  populationDensity: PopulationDensity;
  industryDemand: PopulationDensity;
}

export interface UpdateGrowthYearInput {
  id: string;
  year: number;
  localBusinessGrowth: number;
}

export interface UpdateCategoryGrowthInput {
  id: string;
  regionName: string;
  years: UpdateGrowthYearInput[];
  populationDensity: PopulationDensity;
  industryDemand: PopulationDensity;
}

export interface CreateCategoryInput {
  name: string;
  arabicName: string;
  isDigital?: boolean;
  icon?: string;
  status?: BusinessStatus;
  growthRecords?: CategoryGrowthInput[];
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  arabicName: string;
  isDigital?: boolean;
  icon?: string;
  status?: BusinessStatus;
  growthRecords?: UpdateCategoryGrowthInput[];
}

export interface CreateInput {
  name: string;
  quantity: number;
  purchaseYear: number;
  price: number;
  businessId: string;
}

export interface UpdateInput {
  id: string;
  name?: string;
  quantity?: number;
  purchaseYear?: number;
  price?: number;
  businessId?: string;
  isActive?: boolean;
}

export interface CreateBusinessInput {
  businessTitle: string;
  district?: string;
  city?: string;
  foundedDate?: Date;
  numberOfEmployees?: string;
  description?: string;
  url?: string;
  revenue?: number;
  revenueTime?: string;
  profitMargen?: number;
  profittime?: string;
  profit?: number;
  price?: number;
  capitalRecovery?: number;
  multiple?: number;
  supportDuration?: number;
  supportSession?: number;
  growthOpportunities?: string;
  reason?: string;
  isByTakbeer: boolean;
  categoryId: string;
  userId: string;
  assets?: CreateInput[];
  liabilities?: CreateInput[];
  inventoryItems?: CreateInput[];
  documents?: CreateDocumentInput[];
  createdBy?: string;
}

export interface UpdateBusinessInput {
  id: string;
  businessTitle?: string;
  distirct?: string;
  city?: string;
  foundedDate?: Date;
  numberOfEmployees?: string;
  description?: string;
  url?: string;
  revenue?: number;
  revenueTime?: string;
  profitMargen?: number;
  profittime?: string;
  profit?: number;
  price?: number;
  capitalRecovery?: number;
  multiple?: number;
  supportDuration?: number;
  supportSession?: number;
  growthOpportunities?: string;
  reason?: string;
  isByTakbeer: boolean;
  categoryId: string;
  meetingDate?: Date;
  businessStatus?: BusinessStatus;
  isStatsVerified?: boolean;
  isSupportVerified?: boolean;
  savedById: string;
  isSold?: boolean;
  createdBy?: string;
}

export interface UpdateBusinessProcessInput {
  id: string;
  jasoorPaymentBankRecipt: CreateDocumentInput;
  buyerPaymentBankRecipt: CreateDocumentInput;
  commercialRegistrationNumber: CreateDocumentInput;
  ownershipTransferLetter: CreateDocumentInput;
}

export interface BusinessFilterInput {
  district: string;
  city: string;
  priceRange: number[];
  revenueRange: number[];
  profitRange: number[];
  profitMargenRange: number[];
  employeesRange: string;
  operationalYearRange: string;
  hasAssets: boolean;
  multiple: number;
  startDate: string;
  endDate: string;
  businessStatus: BusinessStatus;
  categoryId: string;
}

export interface AdminBusinessFilterInput {
  startDate: string;
  endDate: string;
  businessStatus: BusinessStatus;
  categoryId: string;
}

export interface CategoryFilterInput {
  isDigital: boolean;
  name: string;
  status: BusinessStatus;
}

export interface BusinessSortInput {
  price: SortOrder;
}

export interface CreateOfferInput {
  businessId: string;
  price: number;
  message: string;
  parentOfferId: string;
  status: OfferStatus;
  isProceedToPay: boolean;
}

export interface UpdateOfferInput {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  price: number;
}

export interface CounterOfferInput {
  parentOfferId: string;
  price: number;
  message: string;
}

export interface AcceptEndaInput {
  userId: string;
  businessId: string;
  ndaVersion: string;
  acceptNdaTerms: boolean;
  acceptPlatformTerms: boolean;
  acceptCommission: boolean;
  commissionRate: number;
  signatureText: string;
}

export interface CreateMeetingInput {
  businessId: string;
  offerId: string;
  requestedDate: string;
  requestedEndDate?: string;
}

export interface UpdateMeetingInput {
  id: string;
  requestedDate: string;
  requestedEndDate: string;
  receiverAvailabilityDate: string;
  adminAvailabilityDate: string;
  isApproved: boolean;
  status: MeetingStatus;
  meetingLink: string;
  offerPrice: number;
}

export interface BankInput {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  isActive: boolean;
  isAdmin: boolean;
}

export interface CreateDealInput {
  offerId: string;
  meetingId?: string;
  businessId: string;
  buyerId: string;
  price: number;
}

export interface UpdateDealInput {
  id: string;
  price: number;
  isCommissionUploaded: boolean;
  isCommissionVerified: boolean;
  isPaymentVedifiedAdmin: boolean;
  isDocVedifiedBuyer: boolean;
  isDsaSeller: boolean;
  isDsaBuyer: boolean;
  isPaymentVedifiedSeller: Boolean;
  isDocVedifiedSeller: Boolean;
  isDocVedifiedAdmin: Boolean;
  isSellerCompleted: boolean;
  isBuyerCompleted: boolean;
  status: DealStatus;
  buyerNote: string;
  sellerNote: string;
  documentUploaded?: boolean; // true when buyer uploads payment document
}

export interface UserFilterInput {
  district: string;
  city: string;
  name: string;
  createdType: string;
  status: UserStatus | null;
}

export interface DealFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CampaignFilter {
  limit: number;
  offset: number;
  search: string;
  group: CampaignGroup;
  district: string;
  status: boolean;
}

export interface TermsInput {
  term?: any;
  ndaTerm?: any;
  policy?: any;
  dsaTerms?: any;
  arabicTerm: any;
  arabicNdaTerm: any;
  arabicPolicy: any;
  arabicDsaTerms?: any;
}

export interface CreateFAQ {
  question: string;
  arabicQuestion: string;
  answer: string;
  arabicAnswer: string;
}

export interface CreateArticle {
  title: string;
  arabicTitle: string;
  image: string;
  body: any;
  arabicBody: any;
}
