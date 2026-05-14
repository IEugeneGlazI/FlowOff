import type { AdminAnalytics } from '../../entities/analytics';
import { apiRequest } from '../../shared/api';

export async function getAdminAnalytics(
  token: string,
  params?: { dateFrom?: string; dateTo?: string },
) {
  const searchParams = new URLSearchParams();

  if (params?.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom);
  }

  if (params?.dateTo) {
    searchParams.set('dateTo', params.dateTo);
  }

  const query = searchParams.toString();
  return apiRequest<AdminAnalytics>(`/admin/statistics${query ? `?${query}` : ''}`, { token });
}
