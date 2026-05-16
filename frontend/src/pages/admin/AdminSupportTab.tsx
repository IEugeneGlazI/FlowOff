import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Paperclip, Send } from 'lucide-react';
import type { StatusReference } from '../../entities/catalog';
import type { SupportRequest } from '../../entities/support';
import {
  addSupportRequestMessage,
  getAllSupportRequests,
  getSupportRequestStatuses,
  updateSupportRequestStatus,
} from '../../features/support/supportApi';
import { ApiError } from '../../shared/api';
import { formatDate } from '../../shared/format';

export function getStatusColor(status: string): 'default' | 'warning' | 'info' | 'success' {
  if (status === 'Новое') {
    return 'warning';
  }

  if (status === 'В работе') {
    return 'info';
  }

  if (status === 'Ожидает ответа пользователя') {
    return 'warning';
  }

  return 'success';
}

export function AdminSupportTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [statuses, setStatuses] = useState<StatusReference[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([getAllSupportRequests(token), getSupportRequestStatuses()])
      .then(([nextRequests, nextStatuses]) => {
        setRequests(nextRequests);
        setStatuses(nextStatuses);
      })
      .catch((error) => {
        const nextMessage = error instanceof ApiError ? error.message : 'Не удалось загрузить обращения.';
        setFeedback({ severity: 'error', message: nextMessage });
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
      });
    });
  }, [selectedRequest?.id, selectedRequest?.messages.length]);

  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = !statusFilter || request.status === statusFilter;
      const matchesSearch =
        !needle ||
        request.subject.toLowerCase().includes(needle) ||
        request.customerFullName.toLowerCase().includes(needle) ||
        request.customerEmail.toLowerCase().includes(needle) ||
        (request.orderNumber ? String(request.orderNumber).includes(needle) : false);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  async function reloadRequests(nextSelectedId?: string | null) {
    const nextRequests = await getAllSupportRequests(token);
    setRequests(nextRequests);

    if (nextSelectedId) {
      const nextSelected = nextRequests.find((item) => item.id === nextSelectedId) ?? null;
      setSelectedRequest(nextSelected);
      setStatusDraft(nextSelected?.status ?? '');
      return;
    }

    setSelectedRequest(null);
    setStatusDraft('');
  }

  async function handleSaveStatus() {
    if (!selectedRequest || !statusDraft) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await updateSupportRequestStatus(selectedRequest.id, statusDraft, token);
      await reloadRequests(selectedRequest.id);
      setFeedback({ severity: 'success', message: 'Статус обращения обновлён.' });
    } catch (error) {
      const nextMessage = error instanceof ApiError ? error.message : 'Не удалось обновить статус.';
      setFeedback({ severity: 'error', message: nextMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendReply() {
    if (!selectedRequest) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await addSupportRequestMessage(
        selectedRequest.id,
        {
          message: replyMessage.trim(),
          files: replyFiles,
        },
        token,
      );

      setReplyMessage('');
      setReplyFiles([]);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }

      await reloadRequests(selectedRequest.id);
      setFeedback({ severity: 'success', message: 'Ответ отправлен пользователю.' });
    } catch (error) {
      const nextMessage = error instanceof ApiError ? error.message : 'Не удалось отправить ответ.';
      setFeedback({ severity: 'error', message: nextMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReplyKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (isSubmitting || (!replyMessage.trim() && replyFiles.length === 0)) {
      return;
    }

    void handleSendReply();
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Card
        sx={{
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,251,247,0.84) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(24,38,31,0.06)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.75 }, display: 'grid', gap: 2.25 }}>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">Поддержка</Typography>
            <Typography variant="body2" color="text.secondary">
              Просматривайте обращения клиентов, меняйте статусы и отвечайте прямо из панели администратора.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5}>
            <TextField
              label="Поиск по теме, клиенту или заказу"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: { xs: '100%', xl: 420 } }}
            />

            <FormControl sx={{ minWidth: 240 }}>
              <InputLabel id="support-status-filter-label">Статус</InputLabel>
              <Select
                labelId="support-status-filter-label"
                label="Статус"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="">Все статусы</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {isLoading ? <Typography color="text.secondary">Загружаем обращения...</Typography> : null}

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {filteredRequests.map((request) => (
              <Card
                key={request.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                  ':hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 14px 32px rgba(38, 54, 45, 0.08)',
                    borderColor: 'rgba(92, 143, 115, 0.34)',
                  },
                }}
                onClick={() => {
                  setSelectedRequest(request);
                  setStatusDraft(request.status);
                }}
              >
                <CardContent sx={{ display: 'grid', gap: 1.25 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gap: 0.35 }}>
                      <Typography variant="h6">{request.subject}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.customerFullName || request.customerEmail}
                        {request.orderNumber ? ` • Заказ #${String(request.orderNumber).padStart(6, '0')}` : ''}
                      </Typography>
                    </Box>
                    <Chip label={request.status} color="success" variant="outlined" sx={{ width: 'fit-content' }} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Последнее обновление {formatDate(request.updatedAtUtc)}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            {!isLoading && filteredRequests.length === 0 ? (
              <Typography color="text.secondary">По текущим фильтрам обращения не найдены.</Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              height: { xs: 'min(92vh, 860px)', md: 'min(88vh, 900px)' },
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box component="span" sx={{ pr: 1 }}>
            {selectedRequest?.subject}
          </Box>
          {selectedRequest ? <Chip label={selectedRequest.status} color="success" variant="outlined" sx={{ flexShrink: 0, mt: 0.25 }} /> : null}
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 1,
            pb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {selectedRequest ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ display: 'none' }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.customerFullName || selectedRequest.customerEmail}
                  {selectedRequest.orderNumber ? ` • Заказ #${String(selectedRequest.orderNumber).padStart(6, '0')}` : ''}
                </Typography>
                <Chip label={selectedRequest.status} color="success" variant="outlined" sx={{ width: 'fit-content' }} />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <FormControl fullWidth>
                  <InputLabel id="support-status-draft-label">Новый статус</InputLabel>
                  <Select
                    labelId="support-status-draft-label"
                    label="Новый статус"
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value)}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status.id} value={status.name}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button variant="contained" onClick={() => void handleSaveStatus()} disabled={isSubmitting}>
                  Сохранить статус
                </Button>
              </Stack>

              <Box
                ref={messagesContainerRef}
                sx={{
                  minHeight: 0,
                  flex: 1,
                  overflowY: 'auto',
                  pr: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                }}
              >
                {selectedRequest.messages.map((supportMessage) => (
                  <Card
                    key={supportMessage.id}
                    variant="outlined"
                    sx={{
                      flexShrink: 0,
                      borderRadius: 2,
                      boxShadow: 'none',
                      bgcolor:
                        supportMessage.authorRole === 'Administrator'
                          ? alpha('#e8f4ee', 0.9)
                          : alpha('#ffffff', 0.92),
                    }}
                  >
                    <CardContent sx={{ display: 'grid', gap: 0.85 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {supportMessage.authorFullName || supportMessage.authorEmail || supportMessage.authorRole}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(supportMessage.createdAtUtc)}
                        </Typography>
                      </Stack>

                      {supportMessage.messageText ? <Typography variant="body2">{supportMessage.messageText}</Typography> : null}

                      {supportMessage.attachments.length > 0 ? (
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {supportMessage.attachments.map((attachment) => (
                            <Chip
                              key={attachment.id}
                              component={Link}
                              href={attachment.fileUrl}
                              target="_blank"
                              clickable
                              label={attachment.fileName}
                              variant="outlined"
                              sx={{ textDecoration: 'none' }}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
                <Box ref={messagesEndRef} />
              </Box>

              <Divider />

              <input
                ref={replyFileInputRef}
                type="file"
                multiple
                hidden
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) => setReplyFiles(Array.from(event.target.files ?? []))}
              />

              <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch', flexShrink: 0 }}>
                <IconButton
                  color="inherit"
                  onClick={() => replyFileInputRef.current?.click()}
                  aria-label="Прикрепить"
                  sx={{
                    width: 56,
                    minHeight: 56,
                    height: 'auto',
                    border: '1px solid rgba(24, 38, 31, 0.12)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  <Paperclip size={18} />
                </IconButton>

                <TextField
                  label="Ответ"
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  multiline
                  minRows={1}
                  maxRows={6}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <IconButton
                  color="primary"
                  onClick={() => void handleSendReply()}
                  disabled={isSubmitting}
                  aria-label="Отправить"
                  sx={{
                    width: 56,
                    minHeight: 56,
                    height: 'auto',
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    flexShrink: 0,
                    ':hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                  }}
                >
                  <Send size={18} />
                </IconButton>
              </Stack>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {feedback?.severity === 'error' ? (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ borderRadius: 2 }}>
          {feedback.message}
        </Alert>
      ) : null}
    </Box>
  );
}
