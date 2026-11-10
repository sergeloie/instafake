import { useEffect, useState } from 'react';
import { cachedBlobUrl, loadBlobUrl } from '../db';

export function useBlobUrl(imageId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => cachedBlobUrl(imageId));
  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      return;
    }
    const cached = cachedBlobUrl(imageId);
    if (cached) {
      setUrl(cached);
      return;
    }
    let alive = true;
    loadBlobUrl(imageId).then((loaded) => {
      if (alive) setUrl(loaded);
    });
    return () => {
      alive = false;
    };
  }, [imageId]);
  return url;
}
