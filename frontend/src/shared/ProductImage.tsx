import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  sx?: SxProps<Theme>;
  imgSx?: SxProps<Theme>;
  label?: string;
};

export function ProductImage({
  src,
  alt,
  sx,
  imgSx,
  label = 'Изображение отсутствует',
}: ProductImageProps) {
  if (src) {
    const imageStyles = [
      {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      },
      ...(imgSx ? [imgSx] : []),
      ...(sx ? [sx] : []),
    ];

    return (
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={imageStyles as SxProps<Theme>}
      />
    );
  }

  const placeholderStyles = [
    {
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      px: 1,
      py: 1,
      color: 'text.secondary',
      backgroundColor: '#f3f7f4',
      overflow: 'hidden',
    },
    ...(sx ? [sx] : []),
  ];

  return (
    <Box
      role="img"
      aria-label={alt}
      sx={placeholderStyles as SxProps<Theme>}
    >
      <Typography
        variant="caption"
        sx={{
          maxWidth: '100%',
          fontSize: '0.72rem',
          lineHeight: 1.2,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
