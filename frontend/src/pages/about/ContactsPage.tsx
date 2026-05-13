import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { Mail, MapPin, MessageCircleMore, Phone, Timer } from 'lucide-react';
import type { SiteContactSettings } from '../../entities/site';
import { getSiteContactSettings } from '../../features/site/siteApi';

function getMapUrl(address: string) {
  return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=17`;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<SiteContactSettings | null>(null);
  const mapUrl = useMemo(() => (contacts ? getMapUrl(contacts.address) : ''), [contacts]);

  useEffect(() => {
    void getSiteContactSettings().then(setContacts);
  }, []);

  if (!contacts) {
    return (
      <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h2">Контакты</Typography>
        <Typography variant="body1" color="text.secondary">
          Свяжитесь с нами удобным способом или приезжайте в магазин.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, background: 'rgba(255,255,255,0.88)' }}>
          <CardContent sx={{ display: 'grid', gap: 1.5 }}>
            <ContactRow icon={<Phone size={18} />} title="Телефон" value={contacts.phone} href={`tel:${contacts.phone}`} />
            <ContactRow icon={<Mail size={18} />} title="Почта" value={contacts.email} href={`mailto:${contacts.email}`} />
            <ContactRow icon={<MapPin size={18} />} title="Адрес" value={contacts.address} />
            <ContactRow icon={<Timer size={18} />} title="Время работы" value={contacts.workingHours} />

            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ color: 'primary.main', mt: 0.2 }}>
                <MessageCircleMore size={18} />
              </Box>
              <Box sx={{ display: 'grid', gap: 0.35 }}>
                <Typography variant="body2" color="text.secondary">
                  Мессенджеры
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button component="a" href={contacts.vkUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<MessageCircleMore size={16} />}>
                VK
              </Button>
              <Button component="a" href={contacts.telegramUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<MessageCircleMore size={16} />}>
                Telegram
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1.15, overflow: 'hidden', minHeight: 420 }}>
          <Box
            component="iframe"
            src={mapUrl}
            title="Карта магазина Flowoff"
            sx={{ width: '100%', height: 420, border: 0, display: 'block' }}
          />
        </Card>
      </Stack>
    </Box>
  );
}

function ContactRow({
  icon,
  title,
  value,
  href,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const content = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ color: 'primary.main', mt: 0.2 }}>{icon}</Box>
      <Box sx={{ display: 'grid', gap: 0.35 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );

  if (!href) {
    return content;
  }

  return (
    <Box component="a" href={href} sx={{ color: 'inherit', textDecoration: 'none' }}>
      {content}
    </Box>
  );
}
