import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { MessageCircleMore } from 'lucide-react';
import type { SiteContactSettings } from '../../entities/site';
import { getSiteContactSettings } from '../../features/site/siteApi';

const features = [
  {
    title: 'Свежие цветы каждый день',
    description: 'Подбираем аккуратные и выразительные сочетания для праздников, признаний и тёплых повседневных поводов.',
  },
  {
    title: 'Авторская сборка',
    description: 'Каждый букет собирается вручную с вниманием к форме, оттенкам и общему настроению композиции.',
  },
  {
    title: 'Бережная доставка',
    description: 'Следим за тем, чтобы цветы доехали до получателя в хорошем состоянии и сохранили свежий вид.',
  },
  {
    title: 'Понятный сервис',
    description: 'Помогаем выбрать букет, быстро отвечаем на вопросы и делаем оформление заказа простым и удобным.',
  },
  {
    title: 'Композиции для разных случаев',
    description: 'Собираем букеты для дней рождения, благодарности, романтических моментов и просто без повода.',
  },
  {
    title: 'Честный подход',
    description: 'Делаем акцент на качестве цветов, аккуратной подаче и реальном удобстве для каждого клиента.',
  },
];

const steps = [
  {
    index: '1',
    title: 'Выбираете букет',
    description: 'Изучаете каталог на сайте или пишете нам, если хотите подобрать что-то под конкретный повод.',
  },
  {
    index: '2',
    title: 'Собираем композицию',
    description: 'Флорист вручную подготавливает букет, сохраняя аккуратную форму и продуманное сочетание оттенков.',
  },
  {
    index: '3',
    title: 'Передаём получателю',
    description: 'Организуем самовывоз или доставку по Иваново, чтобы букет приехал вовремя и в хорошем состоянии.',
  },
];

export function AboutPage() {
  const [contacts, setContacts] = useState<SiteContactSettings | null>(null);

  useEffect(() => {
    void getSiteContactSettings().then(setContacts);
  }, []);

  return (
    <Box sx={{ display: 'grid', gap: 2.5, py: { xs: 2, md: 3 } }}>
      <Card
        sx={{
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(230,244,236,0.92) 100%)',
          border: '1px solid rgba(24,38,31,0.06)',
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, md: 4 },
            display: 'grid',
            gap: 2.5,
            textAlign: 'center',
            justifyItems: 'center',
          }}
        >
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h2" sx={{ maxWidth: '14ch' }}>
              Flowoff
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '40ch', fontWeight: 500 }}>
              Современный цветочный магазин с акцентом на свежесть, аккуратную подачу и понятный сервис
            </Typography>
          </Stack>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '72ch', lineHeight: 1.85 }}>
            Flowoff — это место, где букеты собирают не по шаблону, а с вниманием к настроению, поводу и человеку, которому они предназначены.
            Для нас важны свежие цветы, гармоничные сочетания и ощущение, что композиция выглядит уместно, современно и действительно красиво.
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '72ch', lineHeight: 1.85 }}>
            Мы создаём букеты для поздравлений, признаний, благодарности и тёплых повседневных жестов. Наша задача — сделать выбор и заказ
            цветов простым, а результат таким, который приятно дарить и получать.
          </Typography>
        </CardContent>
      </Card>

      <SectionTitle title="Как мы работаем" />
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        {steps.map((step) => (
          <Card key={step.index} variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>
            <CardContent sx={{ display: 'grid', gap: 1.25 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                }}
              >
                {step.index}
              </Avatar>
              <Typography variant="h6">{step.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <SectionTitle title="Почему выбирают нас" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        {features.map((feature) => (
          <Card key={feature.title} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ display: 'grid', gap: 0.8 }}>
              <Typography variant="h6">{feature.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="h5">Мы на связи</Typography>
          <Typography variant="body2" color="text.secondary">
            Подписывайтесь и пишите в мессенджеры
          </Typography>
          {contacts ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component="a"
                href={contacts.vkUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                startIcon={<MessageCircleMore size={16} />}
              >
                VK
              </Button>
              <Button
                component="a"
                href={contacts.telegramUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                startIcon={<MessageCircleMore size={16} />}
              >
                Telegram
              </Button>
            </Stack>
          ) : (
            <CircularProgress size={24} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Typography variant="h4">{title}</Typography>;
}
