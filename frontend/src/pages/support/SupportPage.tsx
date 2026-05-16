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
import { Link as RouterLink } from 'react-router-dom';
import { Lock, Paperclip, Send, X } from 'lucide-react';
import type { Order } from '../../entities/cart';
import type { SupportRequest } from '../../entities/support';
import { useAuth } from '../../features/auth/AuthContext';
import {
  addSupportRequestMessage,
  createSupportRequest,
  getMySupportRequests,
} from '../../features/support/supportApi';
import { apiRequest, ApiError } from '../../shared/api';
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

function isClosedStatus(status: string) {
  return status === 'Закрыто';
}

export function SupportPage() {
  const { session } = useAuth();
  const token = session?.token ?? null;
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || session?.role !== 'Customer') {
      return;
    }

    setIsLoading(true);
    void Promise.all([getMySupportRequests(token), apiRequest<Order[]>('/Orders/my', { token })])
      .then(([nextRequests, nextOrders]) => {
        setRequests(nextRequests);
        setOrders(nextOrders);
      })
      .catch((error) => {
        const nextMessage = error instanceof ApiError ? error.message : 'Не удалось загрузить обращения в поддержку.';
        setFeedback({ severity: 'error', message: nextMessage });
      })
      .finally(() => setIsLoading(false));
  }, [token, session?.role]);

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

  const availableOrders = useMemo(() => orders.filter((order) => order.status !== 'Отменен'), [orders]);

  async function reloadRequests(nextSelectedId?: string | null) {
    if (!token) {
      return;
    }

    const nextRequests = await getMySupportRequests(token);
    setRequests(nextRequests);
    setSelectedRequest(nextSelectedId ? nextRequests.find((item) => item.id === nextSelectedId) ?? null : null);
  }

  async function handleCreateRequest() {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await createSupportRequest(
        {
          subject: subject.trim(),
          orderId: orderId || null,
          message: message.trim(),
          files,
        },
        token,
      );

      setSubject('');
      setOrderId('');
      setMessage('');
      setFiles([]);
      if (createFileInputRef.current) {
        createFileInputRef.current.value = '';
      }

      await reloadRequests(created.id);
      setFeedback({ severity: 'success', message: 'Обращение отправлено в поддержку.' });
      setFeedback(null);
    } catch (error) {
      const nextMessage = error instanceof ApiError ? error.message : 'Не удалось отправить обращение.';
      setFeedback({ severity: 'error', message: nextMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendReply() {
    if (!token || !selectedRequest) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updated = await addSupportRequestMessage(
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

      await reloadRequests(updated.id);
      setFeedback(null);
      setFeedback({ severity: 'success', message: 'Сообщение отправлено.' });
    } catch (error) {
      const nextMessage = error instanceof ApiError ? error.message : 'Не удалось отправить сообщение.';
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

  function renderFiles(filesToRender: File[], onRemove: (index: number) => void) {
    if (filesToRender.length === 0) {
      return null;
    }

    return (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {filesToRender.map((file, index) => (
          <Chip
            key={`${file.name}-${index}`}
            label={file.name}
            onDelete={() => onRemove(index)}
            deleteIcon={<X size={14} />}
            variant="outlined"
          />
        ))}
      </Stack>
    );
  }

  if (!session) {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <Typography variant="h4">Поддержка доступна после входа</Typography>
            <Typography color="text.secondary">Войдите в аккаунт, чтобы отправить обращение и следить за ответами.</Typography>
            <Button component={RouterLink} to="/account" variant="contained" startIcon={<Lock size={16} />}>
              Войти в аккаунт
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (session.role !== 'Customer') {
    return (
      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography>Раздел поддержки для обращений клиентов доступен только покупателям.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Typography variant="h1">Поддержка</Typography>
        <Typography variant="body1" color="text.secondary">
          Чем подробнее вы опишете ситуацию, тем быстрее мы сможем помочь.
        </Typography>
      </Box>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">Новое обращение</Typography>
          </Box>

          <TextField label="Тема обращения" value={subject} onChange={(event) => setSubject(event.target.value)} fullWidth />

          <FormControl fullWidth>
            <InputLabel id="support-order-label">Заказ</InputLabel>
            <Select
              labelId="support-order-label"
              label="Заказ"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            >
              <MenuItem value="">Без привязки к заказу</MenuItem>
              {availableOrders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  Заказ #{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Сообщение"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <input
            ref={createFileInputRef}
            type="file"
            multiple
            hidden
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <Button variant="outlined" color="inherit" startIcon={<Paperclip size={16} />} onClick={() => createFileInputRef.current?.click()}>
              Прикрепить файлы
            </Button>
            <Button variant="contained" startIcon={<Send size={16} />} onClick={() => void handleCreateRequest()} disabled={isSubmitting}>
              {isSubmitting ? 'Отправляем...' : 'Отправить обращение'}
            </Button>
          </Stack>

          {renderFiles(files, (index) => setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index)))}
        </CardContent>
      </Card>

      <Card sx={{ background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(14px)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography variant="h5">Мои обращения</Typography>
          </Box>

          {isLoading ? <Typography color="text.secondary">Загружаем обращения...</Typography> : null}

          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {requests.map((request) => (
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
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent sx={{ display: 'grid', gap: 1.25 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'grid', gap: 0.35 }}>
                      <Typography variant="h6">{request.subject}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Создано {formatDate(request.createdAtUtc)}
                        {request.orderNumber ? ` • Заказ #${String(request.orderNumber).padStart(6, '0')}` : ''}
                      </Typography>
                    </Box>
                    <Chip label={request.status} color="success" variant="outlined" sx={{ width: 'fit-content' }} />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {request.messages[request.messages.length - 1]?.messageText || 'В обращении пока нет текста сообщения.'}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            {!isLoading && requests.length === 0 ? (
              <Typography color="text.secondary">У вас пока нет обращений в поддержку.</Typography>
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
                <Chip label={selectedRequest.status} color="success" variant="outlined" sx={{ width: 'fit-content' }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.orderNumber ? `Заказ #${String(selectedRequest.orderNumber).padStart(6, '0')} • ` : ''}
                  Обновлено {formatDate(selectedRequest.updatedAtUtc)}
                </Typography>
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
                          : alpha('#ffffff', 0.9),
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

              {!isClosedStatus(selectedRequest.status) ? (
                <>
                  <Divider />
                  <Box sx={{ display: 'grid', gap: 1.25, flexShrink: 0 }}>
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      multiple
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(event) => setReplyFiles(Array.from(event.target.files ?? []))}
                    />

                    {renderFiles(replyFiles, (index) =>
                      setReplyFiles((current) => current.filter((_, currentIndex) => currentIndex !== index)),
                    )}

                    <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
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
                  </Box>
                </>
              ) : null}
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
