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
  preferredTrainerId: string | null;
  itemId: string;
  itemName: string;
  status: PtPackageStatus;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string | null;
  pricePaid: number;
  sourceDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
  preferredTrainer?: {
    id: string;
    fullName: string;
  };
}

export interface CreatePtPackageDto {
  memberId: string;
  itemId: string;
  preferredTrainerId?: string;
  totalSessions?: number;
  startDate: string;
  expiryDate?: string;
  pricePaid?: number;
  notes?: string;
}

export interface UpdatePtPackageDto {
  preferredTrainerId?: string | null;
  notes?: string;
}
