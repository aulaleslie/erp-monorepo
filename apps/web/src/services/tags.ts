import { api } from '@/lib/api';

export interface TagSuggestion {
  id: string;
  name: string;
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface TagAssignmentParams {
  resourceType: string;
  resourceId: string;
  tags: string[];
}

export interface TagAssignmentResult {
  assigned: TagSuggestion[];
}

export interface TagRemovalResult {
  removed: Array<Pick<TagSuggestion, 'id' | 'name'>>;
}

export interface TagListQuery {
  page?: number;
  limit?: number;
  query?: string;
  includeInactive?: boolean;
}

export interface TagUpdateDto {
  name?: string;
  isActive?: boolean;
}

export interface PaginatedTags {
  items: TagSuggestion[];
  total: number;
  page: number;
  limit: number;
}

export const tagsService = {
  async list(query: TagListQuery): Promise<PaginatedTags> {
    const response = await api.get<PaginatedTags>('/tags/manage', {
      params: query,
    });
    return response.data;
  },

  async update(tagId: string, dto: TagUpdateDto): Promise<TagSuggestion> {
    const response = await api.patch<TagSuggestion>(`/tags/${tagId}`, dto);
    return response.data;
  },
  async suggest(query?: string): Promise<TagSuggestion[]> {
    const response = await api.get<TagSuggestion[]>('/tags', {
      params: query ? { query } : {},
    });
    return response.data;
  },

  async assign(params: TagAssignmentParams): Promise<TagAssignmentResult> {
    const response = await api.post<TagAssignmentResult>('/tags/assign', params);
    return response.data;
  },

  async remove(params: TagAssignmentParams): Promise<TagRemovalResult> {
    // Delete requests typically take the data in the config for axios if not using URL params,
    // but the backend controller expects @Body() for TagAssignmentDto.
    // Axios delete with body:
    const response = await api.delete<TagRemovalResult>('/tags/assign', {
      data: params,
    });
    return response.data;
  },
};
