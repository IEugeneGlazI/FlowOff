import type { StatusReference } from '../../entities/catalog';
import type { SupportRequest } from '../../entities/support';
import { apiRequest } from '../../shared/api';

function buildSupportFormData(payload: {
  subject?: string;
  orderId?: string | null;
  message?: string;
  files?: File[];
}) {
  const formData = new FormData();

  if (payload.subject) {
    formData.append('subject', payload.subject);
  }

  if (payload.orderId) {
    formData.append('orderId', payload.orderId);
  }

  if (payload.message) {
    formData.append('message', payload.message);
  }

  for (const file of payload.files ?? []) {
    formData.append('files', file);
  }

  return formData;
}

export async function getMySupportRequests(token: string) {
  return apiRequest<SupportRequest[]>('/SupportRequests/my', { token });
}

export async function getAllSupportRequests(token: string) {
  return apiRequest<SupportRequest[]>('/SupportRequests', { token });
}

export async function createSupportRequest(
  payload: { subject: string; orderId?: string | null; message?: string; files?: File[] },
  token: string,
) {
  return apiRequest<SupportRequest>('/SupportRequests', {
    method: 'POST',
    token,
    body: buildSupportFormData(payload),
  });
}

export async function addSupportRequestMessage(
  requestId: string,
  payload: { message?: string; files?: File[] },
  token: string,
) {
  return apiRequest<SupportRequest>(`/SupportRequests/${requestId}/messages`, {
    method: 'POST',
    token,
    body: buildSupportFormData(payload),
  });
}

export async function updateSupportRequestStatus(requestId: string, status: string, token: string) {
  return apiRequest<SupportRequest>(`/SupportRequests/${requestId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export async function getSupportRequestStatuses() {
  return apiRequest<StatusReference[]>('/SupportRequestStatuses');
}
