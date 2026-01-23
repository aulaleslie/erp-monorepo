import { api } from '@/lib/api';

export interface TagSuggestion {
  id: string;
  name: string;
  usageCount: number;
  lastUsedAt: string | null;
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

export const tagsService = {
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
