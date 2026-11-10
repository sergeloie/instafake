import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'people' }
  | { name: 'profile'; username: string }
  | { name: 'gallery'; username: string; galleryId: string }
  | { name: 'photo'; photoId: string }
  | { name: 'unknown'; path: string };

export function parseRoute(path: string): Route {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return { name: 'home' };
  if (segments[0] === 'people') return { name: 'people' };
  if (segments[0] === 'p' && segments[1]) return { name: 'photo', photoId: decodeURIComponent(segments[1]) };
  if (segments[0] === 'u' && segments[1]) {
    const username = decodeURIComponent(segments[1]);
    if (segments[2] === 'g' && segments[3]) {
      return { name: 'gallery', username, galleryId: decodeURIComponent(segments[3]) };
    }
    return { name: 'profile', username };
  }
  return { name: 'unknown', path };
}

export function navigate(path: string): void {
  const target = path.startsWith('/') ? path : `/${path}`;
  if (window.location.hash.slice(1) === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = target;
}

export function profilePath(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}

export function galleryPath(username: string, galleryId: string): string {
  return `/u/${encodeURIComponent(username)}/g/${encodeURIComponent(galleryId)}`;
}

export function photoPath(photoId: string): string {
  return `/p/${encodeURIComponent(photoId)}`;
}

export function useHashPath(): string {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}
