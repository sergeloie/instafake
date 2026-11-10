import { useBlobUrl } from '../lib/useBlobUrl';

export function LocalImage({ imageId, alt, className }: { imageId: string; alt: string; className?: string }) {
  const url = useBlobUrl(imageId);
  if (!url) {
    return <span className={['local-image', className ?? ''].filter(Boolean).join(' ')} role="img" aria-label={alt} />;
  }
  return <img className={className} src={url} alt={alt} loading="lazy" draggable={false} />;
}
