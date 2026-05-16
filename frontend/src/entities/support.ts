export type SupportAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  createdAtUtc: string;
};

export type SupportMessage = {
  id: string;
  authorUserId: string;
  authorRole: string;
  authorFullName: string;
  authorEmail: string;
  messageText: string;
  createdAtUtc: string;
  attachments: SupportAttachment[];
};

export type SupportRequest = {
  id: string;
  customerId: string;
  customerFullName: string;
  customerEmail: string;
  orderId?: string | null;
  orderNumber?: number | null;
  subject: string;
  status: string;
  statusReferenceId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  closedAtUtc?: string | null;
  messages: SupportMessage[];
};
