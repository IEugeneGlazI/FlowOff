import type { SiteContactSettings } from '../../entities/site';
import { apiRequest } from '../../shared/api';

export async function getSiteContactSettings() {
  return apiRequest<SiteContactSettings>('/site/contact-settings');
}

export async function updateSiteContactSettings(payload: SiteContactSettings, token: string) {
  return apiRequest<SiteContactSettings>('/site/contact-settings', {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}
