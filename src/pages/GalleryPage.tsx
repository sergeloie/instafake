import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LocalImage } from '../components/LocalImage';
import { UploadModal } from '../components/UploadModal';
import { formatCount, timeAgo } from '../lib/format';
import { navigate, photoPath, profilePath } from '../router';
import { photosForGallery, useApp } from '../store';

export function GalleryPage({ username, galleryId }: { username: string; galleryId: string }) {
  const { users, galleries, photos, deleteGallery } = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => users.find((item) => item.username === username), [users, username]);
  const gallery = useMemo(
    () => galleries.find((item) => item.id === galleryId && item.userId === user?.id),
    [galleries, galleryId, user],
  );
  const galleryPhotos = useMemo(() => (gallery ? photosForGallery(photos, gallery.id) : []), [gallery, photos]);
  const cover = galleryPhotos[0]?.imageId ?? null;

  if (!user || !gallery) {
    return (
      <div className="page">
        <EmptyState
          icon="image"
          title="Галерея не найдена"
          text="Возможно, её удалили. Профиль пользователя подскажет, что осталось."
          action={
            <a className="btn btn-secondary" href="#/people">
              Все профили
            </a>
          }
        />
      </div>
    );
  }

  async function handleDelete() {
    if (!gallery || !user) return;
    setBusy(true);
    setError(null);
    try {
      await deleteGallery(gallery.id);
      navigate(profilePath(user.username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить галерею');
      setBusy(false);
    }
  }

  return (
    <div className="page gallery-page">
      <a className="back-link" href={`#${profilePath(user.username)}`}>
        <Icon name="back" size={18} /> {user.username}
      </a>

      <header className="gallery-head">
        <span className="gallery-cover">
          {cover ? <LocalImage imageId={cover} alt={gallery.title} /> : <Icon name="image" size={30} />}
        </span>
        <div className="gallery-info">
          <h1>{gallery.title}</h1>
          <p className="gallery-desc">{gallery.description || 'Без описания'}</p>
          <span className="gallery-meta">
            {galleryPhotos.length} фото · создана {timeAgo(gallery.createdAt)}
          </span>
          <div className="gallery-actions">
            <button type="button" className="btn btn-primary" onClick={() => setUploadOpen(true)}>
              <Icon name="plus" size={18} /> Добавить фото
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => setConfirmOpen(true)}
              aria-label="Удалить галерею"
            >
              <Icon name="trash" size={20} />
            </button>
          </div>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      {galleryPhotos.length > 0 ? (
        <div className="grid">
          {galleryPhotos.map((photo) => (
            <button
              type="button"
              key={photo.id}
              className="grid-cell"
              onClick={() => navigate(photoPath(photo.id))}
              aria-label={photo.caption || 'Открыть фотографию'}
            >
              <LocalImage imageId={photo.imageId} alt={photo.caption || 'Фото'} />
              <span className="grid-overlay">
                <span>
                  <Icon name="heart" filled size={18} /> {formatCount(photo.likes)}
                </span>
                <span>{photo.caption || 'Без описания'}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="camera"
          title="В галерее пока нет фото"
          text="Добавьте изображения с компьютера — они сохранятся в IndexedDB и останутся доступны офлайн."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setUploadOpen(true)}>
              <Icon name="plus" size={18} /> Добавить фото
            </button>
          }
        />
      )}

      <footer className="gallery-owner">
        <Avatar name={user.name} username={user.username} imageId={user.avatarId} size={28} />
        <span>
          Галерея пользователя{' '}
          <a href={`#${profilePath(user.username)}`}>@{user.username}</a>
        </span>
      </footer>

      {uploadOpen ? (
        <UploadModal userId={user.id} galleryId={gallery.id} onClose={() => setUploadOpen(false)} />
      ) : null}

      {confirmOpen ? (
        <ConfirmDialog
          title="Удалить галерею?"
          text={`«${gallery.title}» и все её фотографии (${galleryPhotos.length}) будут удалены из этого браузера. Это действие нельзя отменить.`}
          busy={busy}
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
