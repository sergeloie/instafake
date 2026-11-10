import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { all, put, releaseBlobUrl, remove, storeBlob } from './db';
import { resizeImage } from './lib/images';
import { seedIfNeeded } from './seed';
import type { Comment, Commenter, Gallery, Photo, User } from './types';

interface AppState {
  users: User[];
  galleries: Gallery[];
  photos: Photo[];
  comments: Comment[];
  commenters: Commenter[];
}

const emptyState: AppState = {
  users: [],
  galleries: [],
  photos: [],
  comments: [],
  commenters: [],
};

export interface NewUserInput {
  username: string;
  name: string;
  bio: string;
  avatar: File | null;
}

export interface PhotoUpload {
  file: File;
  caption: string;
}

export interface AuthorView {
  id: string;
  username: string;
  name: string;
  avatarId: string | null;
  hue: number;
}

interface AppContextValue extends AppState {
  ready: boolean;
  error: string | null;
  following: string[];
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
  createUser: (input: NewUserInput) => Promise<User>;
  createGallery: (userId: string, title: string, description: string) => Promise<Gallery>;
  addPhotos: (userId: string, galleryId: string | null, uploads: PhotoUpload[]) => Promise<Photo[]>;
  updateCaption: (photoId: string, caption: string) => Promise<void>;
  toggleLike: (photoId: string) => Promise<void>;
  addComment: (photoId: string, authorId: string, text: string) => Promise<Comment>;
  createCommenter: (input: { username: string; name?: string }) => Promise<Commenter>;
  deletePhoto: (photoId: string) => Promise<void>;
  deleteGallery: (galleryId: string) => Promise<void>;
  getAuthor: (authorId: string) => AuthorView | null;
}

const AppContext = createContext<AppContextValue | null>(null);
const FOLLOW_KEY = 'instafake.following';

function readFollowing(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 30);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const stateRef = useRef<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>(readFollowing);

  const commit = useCallback((updater: (previous: AppState) => AppState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await seedIfNeeded();
        const [users, galleries, photos, comments, commenters] = await Promise.all([
          all<User>('users'),
          all<Gallery>('galleries'),
          all<Photo>('photos'),
          all<Comment>('comments'),
          all<Commenter>('commenters'),
        ]);
        if (!alive) return;
        commit(() => ({ users, galleries, photos, comments, commenters }));
        setReady(true);
      } catch (cause) {
        if (!alive) return;
        setError(cause instanceof Error ? cause.message : 'Не удалось прочитать локальную базу');
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [commit]);

  const toggleFollow = useCallback((userId: string) => {
    setFollowing((previous) => {
      const next = previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId];
      try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      } catch {
        // приватный режим может запрещать localStorage — подписки останутся только в памяти
      }
      return next;
    });
  }, []);

  const isFollowing = useCallback((userId: string) => following.includes(userId), [following]);

  const createUser = useCallback(
    async (input: NewUserInput) => {
      const username = normalizeUsername(input.username);
      if (username.length < 3) {
        throw new Error('Имя пользователя: минимум 3 символа — латиница, цифры, точка или подчёркивание');
      }
      if (stateRef.current.users.some((user) => user.username === username)) {
        throw new Error(`@${username} уже занят`);
      }
      let avatarId: string | null = null;
      if (input.avatar) {
        const blob = await resizeImage(input.avatar, 480, 0.9);
        avatarId = await storeBlob(blob);
      }
      const user: User = {
        id: crypto.randomUUID(),
        username,
        name: input.name.trim() || username,
        bio: input.bio.trim(),
        avatarId,
        createdAt: Date.now(),
        followers: 60 + Math.floor(Math.random() * 880),
        following: 40 + Math.floor(Math.random() * 260),
      };
      await put('users', user);
      commit((previous) => ({ ...previous, users: [...previous.users, user] }));
      return user;
    },
    [commit],
  );

  const createGallery = useCallback(
    async (userId: string, title: string, description: string) => {
      const gallery: Gallery = {
        id: crypto.randomUUID(),
        userId,
        title: title.trim(),
        description: description.trim(),
        createdAt: Date.now(),
      };
      await put('galleries', gallery);
      commit((previous) => ({ ...previous, galleries: [...previous.galleries, gallery] }));
      return gallery;
    },
    [commit],
  );

  const addPhotos = useCallback(
    async (userId: string, galleryId: string | null, uploads: PhotoUpload[]) => {
      const created: Photo[] = [];
      for (const upload of uploads) {
        const blob = await resizeImage(upload.file, 1800, 0.86);
        const imageId = await storeBlob(blob);
        const photo: Photo = {
          id: crypto.randomUUID(),
          userId,
          galleryId,
          imageId,
          caption: upload.caption.trim(),
          location: '',
          createdAt: Date.now() - created.length,
          likes: 0,
          liked: false,
        };
        await put('photos', photo);
        created.push(photo);
      }
      if (created.length > 0) {
        commit((previous) => ({ ...previous, photos: [...previous.photos, ...created] }));
      }
      return created;
    },
    [commit],
  );

  const updateCaption = useCallback(
    async (photoId: string, caption: string) => {
      const photo = stateRef.current.photos.find((item) => item.id === photoId);
      if (!photo) return;
      const next: Photo = { ...photo, caption: caption.trim() };
      await put('photos', next);
      commit((previous) => ({
        ...previous,
        photos: previous.photos.map((item) => (item.id === photoId ? next : item)),
      }));
    },
    [commit],
  );

  const toggleLike = useCallback(
    async (photoId: string) => {
      const photo = stateRef.current.photos.find((item) => item.id === photoId);
      if (!photo) return;
      const next: Photo = {
        ...photo,
        liked: !photo.liked,
        likes: Math.max(0, photo.likes + (photo.liked ? -1 : 1)),
      };
      await put('photos', next);
      commit((previous) => ({
        ...previous,
        photos: previous.photos.map((item) => (item.id === photoId ? next : item)),
      }));
    },
    [commit],
  );

  const addComment = useCallback(
    async (photoId: string, authorId: string, text: string) => {
      const comment: Comment = {
        id: crypto.randomUUID(),
        photoId,
        authorId,
        text: text.trim(),
        createdAt: Date.now(),
      };
      await put('comments', comment);
      commit((previous) => ({ ...previous, comments: [...previous.comments, comment] }));
      return comment;
    },
    [commit],
  );

  const createCommenter = useCallback(
    async (input: { username: string; name?: string }) => {
      const base = normalizeUsername(input.username) || 'guest';
      const taken = new Set([
        ...stateRef.current.commenters.map((commenter) => commenter.username),
        ...stateRef.current.users.map((user) => user.username),
      ]);
      let username = base;
      let suffix = 1;
      while (taken.has(username)) {
        suffix += 1;
        username = `${base}${suffix}`.slice(0, 30);
      }
      const fallbackName =
        base
          .split(/[._]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') || 'Гость';
      const commenter: Commenter = {
        id: crypto.randomUUID(),
        username,
        name: input.name?.trim() || fallbackName,
        hue: Math.floor(Math.random() * 360),
        avatarId: null,
      };
      await put('commenters', commenter);
      commit((previous) => ({ ...previous, commenters: [...previous.commenters, commenter] }));
      return commenter;
    },
    [commit],
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      const photo = stateRef.current.photos.find((item) => item.id === photoId);
      if (!photo) return;
      const comments = stateRef.current.comments.filter((comment) => comment.photoId === photoId);
      await remove('comments', comments.map((comment) => comment.id));
      await remove('photos', photoId);
      await remove('blobs', photo.imageId);
      releaseBlobUrl(photo.imageId);
      commit((previous) => ({
        ...previous,
        photos: previous.photos.filter((item) => item.id !== photoId),
        comments: previous.comments.filter((comment) => comment.photoId !== photoId),
      }));
    },
    [commit],
  );

  const deleteGallery = useCallback(
    async (galleryId: string) => {
      const photos = stateRef.current.photos.filter((photo) => photo.galleryId === galleryId);
      const photoIds = new Set(photos.map((photo) => photo.id));
      const comments = stateRef.current.comments.filter((comment) => photoIds.has(comment.photoId));
      await remove('comments', comments.map((comment) => comment.id));
      await remove('photos', photos.map((photo) => photo.id));
      await remove('blobs', photos.map((photo) => photo.imageId));
      await remove('galleries', galleryId);
      for (const photo of photos) releaseBlobUrl(photo.imageId);
      commit((previous) => ({
        ...previous,
        galleries: previous.galleries.filter((gallery) => gallery.id !== galleryId),
        photos: previous.photos.filter((photo) => photo.galleryId !== galleryId),
        comments: previous.comments.filter((comment) => !photoIds.has(comment.photoId)),
      }));
    },
    [commit],
  );

  const getAuthor = useCallback((authorId: string): AuthorView | null => {
    const commenter = stateRef.current.commenters.find((item) => item.id === authorId);
    if (commenter) {
      return {
        id: commenter.id,
        username: commenter.username,
        name: commenter.name,
        avatarId: commenter.avatarId,
        hue: commenter.hue,
      };
    }
    const user = stateRef.current.users.find((item) => item.id === authorId);
    if (user) {
      return { id: user.id, username: user.username, name: user.name, avatarId: user.avatarId, hue: 204 };
    }
    return null;
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      ready,
      error,
      following,
      isFollowing,
      toggleFollow,
      createUser,
      createGallery,
      addPhotos,
      updateCaption,
      toggleLike,
      addComment,
      createCommenter,
      deletePhoto,
      deleteGallery,
      getAuthor,
    }),
    [
      state,
      ready,
      error,
      following,
      isFollowing,
      toggleFollow,
      createUser,
      createGallery,
      addPhotos,
      updateCaption,
      toggleLike,
      addComment,
      createCommenter,
      deletePhoto,
      deleteGallery,
      getAuthor,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp должен вызываться внутри AppProvider');
  return context;
}

export function commentsFor(comments: Comment[], photoId: string): Comment[] {
  return comments.filter((comment) => comment.photoId === photoId).sort((a, b) => a.createdAt - b.createdAt);
}

export function photosForUser(photos: Photo[], userId: string): Photo[] {
  return photos.filter((photo) => photo.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function galleriesForUser(galleries: Gallery[], userId: string): Gallery[] {
  return galleries.filter((gallery) => gallery.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function photosForGallery(photos: Photo[], galleryId: string): Photo[] {
  return photos.filter((photo) => photo.galleryId === galleryId).sort((a, b) => b.createdAt - a.createdAt);
}


export function photoCountByUser(photos: Photo[], userId: string): number {
  return photos.filter((photo) => photo.userId === userId).length;
}
