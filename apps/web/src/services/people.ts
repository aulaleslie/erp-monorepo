import { api } from '@/lib/api';
import { PaginatedResponse } from '@/services/types';
import { PeopleStatus, PeopleType } from '@gym-monorepo/shared';

export interface PersonLinkedUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface PersonListItem {
  id: string;
  code: string;
  fullName: string;
  type: PeopleType;
  email: string | null;
  phone: string | null;
  status: PeopleStatus;
  tags?: string[];
  departmentId: string | null;
  userId: string | null;
  user: PersonLinkedUser | null;
}

export interface InvitablePerson {
  id: string;
  type: PeopleType;
  fullName: string;
  email: string | null;
  phone: string | null;
  tags?: string[];
}

export interface InvitableUser {
  id: string;
  email: string;
  fullName?: string;
}

interface PeopleListParams {
  page: number;
  limit: number;
  search?: string;
  type?: PeopleType | '';
  status?: PeopleStatus | '';
}

interface InvitableParams {
  page: number;
  limit: number;
  search?: string;
  type?: PeopleType | '';
}

interface InvitableUsersParams {
  page: number;
  limit: number;
  search?: string;
}

export interface CreatePersonData {
  fullName: string;
  type: PeopleType;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
  departmentId?: string | null;
  userId?: string | null;
}

export interface UpdatePersonData {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  status?: PeopleStatus;
  tags?: string[];
  departmentId?: string | null;
}

export interface CreateUserForStaffData {
  email: string;
  fullName?: string;
  tempPassword: string;
  attachToTenant?: boolean;
  roleId?: string;
}

export const peopleService = {
  async get(id: string) {
    const response = await api.get<PersonListItem>(`/people/${id}`);
    return response.data;
  },

  async create(data: CreatePersonData) {
    const response = await api.post<PersonListItem>('/people', data);
    return response.data;
  },

  async update(id: string, data: UpdatePersonData) {
    const response = await api.put<PersonListItem>(`/people/${id}`, data);
    return response.data;
  },

  async list(params: PeopleListParams) {
    const query: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
    };

    if (params.search) {
      query.search = params.search;
    }

    if (params.type) {
      query.type = params.type;
    }

    if (params.status) {
      query.status = params.status;
    }

    const response = await api.get<PaginatedResponse<PersonListItem>>(
      '/people',
      { params: query }
    );

    return response.data;
  },

  async remove(personId: string) {
    await api.delete(`/people/${personId}`);
  },

  async inviteExisting(personId: string) {
    const response = await api.post<PersonListItem>('/people/invite', {
      personId,
    });

    return response.data;
  },

  async getInvitable(params: InvitableParams) {
    const query: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
    };

    if (params.search) {
      query.search = params.search;
    }

    if (params.type) {
      query.type = params.type;
    }

    const response = await api.get<{
      items: InvitablePerson[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>('/people/invitable', {
      params: query,
    });

    return response.data;
  },

  async getInvitableUsersForStaff(params: InvitableUsersParams) {
    const query: Record<string, unknown> = {
      page: params.page,
      limit: params.limit,
    };

    if (params.search) {
      query.search = params.search;
    }

    const response = await api.get<{
      items: InvitableUser[];
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }>('/people/staff/invitable-users', {
      params: query,
    });

    return response.data;
  },

  async linkUser(personId: string, userId: string) {
    const response = await api.put<PersonListItem>(
      `/people/${personId}/link-user`,
      { userId }
    );
    return response.data;
  },

  async unlinkUser(personId: string) {
    const response = await api.put<PersonListItem>(
      `/people/${personId}/unlink-user`
    );
    return response.data;
  },

  async createUserForStaff(personId: string, data: CreateUserForStaffData) {
    const response = await api.post<PersonListItem>(
      `/people/${personId}/create-user`,
      data
    );
    return response.data;
  },
};
