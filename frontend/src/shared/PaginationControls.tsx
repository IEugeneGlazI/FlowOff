import { Pagination, Stack } from '@mui/material';

export function PaginationControls({
  page,
  pageCount,
  totalCount,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return null;
  }

  void totalCount;
  void pageSize;

  return (
    <Stack direction="row" spacing={1.25} sx={{ justifyContent: 'center', alignItems: 'center', pt: 0.5 }}>
      <Pagination
        page={page}
        count={pageCount}
        color="primary"
        shape="rounded"
        onChange={(_, nextPage) => onChange(nextPage)}
      />
    </Stack>
  );
}
