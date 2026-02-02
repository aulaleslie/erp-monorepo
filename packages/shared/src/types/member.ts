export enum MemberStatus {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  INACTIVE = 'INACTIVE',
}

export interface Member {
  id: string;
  tenantId: string;
  code: string;
  personId: string;
  status: MemberStatus;
  notes: string | null;
  agreedToTerms: boolean;
  agreedAt: string | null;
  currentExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  person?: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateMemberDto {
  personId?: string;
  person?: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
  agreedToTerms?: boolean;
}

export interface UpdateMemberDto {
  status?: MemberStatus;
  notes?: string;
  agreedToTerms?: boolean;
}
