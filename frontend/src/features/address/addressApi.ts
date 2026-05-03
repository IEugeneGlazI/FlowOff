import type { AddressSuggestion } from '../../entities/address';
import { apiRequest } from '../../shared/api';

export async function getAddressSuggestions(query: string, token: string) {
  const params = new URLSearchParams({ query });
  return apiRequest<AddressSuggestion[]>(`/address-suggestions?${params.toString()}`, {
    token,
  });
}
