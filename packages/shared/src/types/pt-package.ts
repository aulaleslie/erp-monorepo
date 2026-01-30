export enum PtPackageStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXHAUSTED = 'EXHAUSTED',
  CANCELLED = 'CANCELLED',
}

export interface PtSessionPackage {
  id: string;
  tenantId: string;
  memberId: string;
  trainerId: string;
  itemId: string;
  itemName: string;
  status: PtPackageStatus;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string | null;
  price: number;
  sourceDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
  trainer?: {
    id: string;
    fullName: string;
  };
}

export interface CreatePtPackageDto {
  memberId: string;
  itemId: string;
  trainerId: string;
  totalSessions?: number;
  startDate?: string;
  expiryDate?: string;
}
