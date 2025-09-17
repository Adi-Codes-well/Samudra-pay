// Data Models for Carbon Credit Verification Platform
// Defines all data structures used in the platform

export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'project_manager' | 'nccr_verifier' | 'buyer';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  ecosystemType: 'mangrove' | 'saltmarsh' | 'seagrass' | 'coastal_wetland';
  area: number;
  coordinates?: string;
  communityPartners?: string;
  expectedCarbonCapture?: number;
  managerId: string;
  managerName?: string;
  managerEmail?: string;
  status: 'registered' | 'mrv_submitted' | 'approved' | 'rejected';
  createdAt: string;
  onChainTxHash?: string;
}

export interface MRVData {
  id: string;
  projectId: string;
  managerId: string;
  rawData: {
    satelliteData: string;
    communityReports: string;
    sensorReadings: string;
    iotData: string;
    notes: string;
  };
  files: UploadedFile[];
  status: 'pending_ml_processing' | 'pending_verification' | 'approved' | 'rejected';
  submittedAt: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  mlResults?: {
    carbon_estimate: number;
    biomass_health_score: number;
    evidenceCid: string;
  };
  onChainTxHash?: string;
}

export interface UploadedFile {
  name: string;
  originalName: string;
  size: number;
  type: string;
  category: 'photo' | 'iot_data' | 'document';
  path: string;
  url?: string;
  uploadedAt: string;
}

export interface MLVerification {
  projectId: string;
  mlScore: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
  timestamp: string;
  verifierId: string;
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  amount: number;
  ownerId?: string; // User who owns this credit
  paymentConfirmationId?: string; 
  isRetired: boolean;
  retiredBy?: string;
  retiredAt?: string;
  retirementReason?: string;
  healthScore: number;
  evidenceCid: string;
  verifiedAt: string;
  mrvId: string;
  onChainTxHash?: string;
}

export interface CreditRetirement {
  id: string;
  creditId: string;
  buyerId: string;
  amount: number;
  reason: string;
  retiredAt: string;
  onChainTxHash: string;
}

export interface CreditPurchase {
  id: string;
  creditId: string;
  buyerId: string;
  amount: number;
  purchasedAt: string;
  onChainTxHash?: string;
}

export interface CreditTransaction { 
  id: string;
  creditId: string;
  userId: string;
  paymentId: string;
  quantity: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PublicStats {
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  totalProjects: number;
  projects: Project[];
}

// Form interfaces for create/update operations
export interface CreateProjectRequest {
  name: string;
  description: string;
  location: string;
  ecosystemType: 'mangrove' | 'saltmarsh' | 'seagrass' | 'coastal_wetland';
  area: number;
  coordinates?: string;
  communityPartners?: string;
  expectedCarbonCapture?: number;
}

export interface CreateMRVRequest {
  projectId: string;
  rawData: {
    satelliteData: string;
    communityReports: string;
    sensorReadings: string;
    iotData: string;
    notes: string;
  };
  files: UploadedFile[];
}

export interface ApprovalRequest {
  approved: boolean;
  notes: string;
}

export interface RetireCreditRequest {
  creditId: string;
  reason: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'project_manager' | 'nccr_verifier' | 'buyer';
}

export interface MLVerificationRequest {
  projectId: string;
  projectData: Project;
}

// API Response interfaces
export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface MRVListResponse {
  pendingMrv: MRVData[];
}

export interface CreditsListResponse {
  availableCredits: CarbonCredit[];
}

export interface MLVerificationResponse {
  verification: MLVerification;
}

export interface FileUploadResponse {
  files: UploadedFile[];
  message: string;
}