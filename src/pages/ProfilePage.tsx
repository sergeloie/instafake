import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { CreateGalleryModal } from '../components/CreateGalleryModal';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LocalImage } from '../components/LocalImage';
import { formatCount, timeAgo } from '../lib/format';
import { galleryPath, navigate, photoPath } from '../router';
import { commentsFor, galleriesForUser, photosForUser, useApp } from '../store';

export function ProfilePage({ username }: { username: string }) {
  const { users, galleries, photos, comments } = useApp();
  const [tab, setTab] = useState<'posts' | 'galleries'>('posts');
  const [galleryOpen, setGalleryOpen] = useState(false);

  const user = useMemo(() => users.find((item) => item.username === username), [users, username]);
  const userPhotos = useMemo(() => (user ? photosForUser(photos, user.id) : []), [photos, user]);
  const userGalleries = useMemo(() => (user ? galleriesForUser(galleries, user.id) : []), [galleries, user]);
  const covers = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const photo of [...photos].sort((a, b) => a.createdAt - b.createdAt)) {
      if (photo.galleryId) map.set(photo.galleryId, photo.imageId);
    }
    return map;
  }, [photos]);

  if (!user) {
    return (
      <div className="page">
        <EmptyState
          icon="users"
          title="Профиль не найден"
          text={`Пользователя @${username} нет в этой локальной галерее.`}
          action={
            <a className="btn btn-secondary" href="#/people">
              Все профили
            </a>
          }
        />
      </div>
    );
  }

  const firstGallery = userGalleries[0];

  return (
    <div className="page profile-page">
      <header className="profile-head">
        <Avatar name={user.name} username={user.username} imageId={user.avatarId} size={150} className="profile-avatar" />
        <div className="profile-info">
          <div className="profile-title">
            <h1>{user.username}</h1>
            <button type="button" className="btn btn-secondary" onClick={() => setGalleryOpen(true)}>
              <Icon name="plus" size={16} /> Новая галерея
            </button>
          </div>
          <ul className="profile-stats">
            <li>
              <strong>{userPhotos.length}</strong>
              <span>публикаций</span>
            </li>
            <li>
              <strong>{formatCount(user.followers)}</strong>
              <span>подписчиков</span>
            </li>
            <li>
              <strong>{formatCount(user.following)}</strong>
              <span>подписок</span>
            </li>
          </ul>
          <div className="profile-bio">
            <strong>{user.name}</strong>
            <p>{user.bio || 'Без описания'}</p>
          </div>
        </div>
      </header>

      {userGalleries.length > 0 ? (
        <div className="highlights" aria-label="Галереи">
          {userGalleries.map((gallery) => {
            const cover = covers.get(gallery.id) ?? null;
            const count = photos.filter((photo) => photo.galleryId === gallery.id).length;
            return (
              <a className="highlight" key={gallery.id} href={`#${galleryPath(user.username, gallery.id)}`}>
                <span className="highlight-ring">
                  <span className="highlight-cover">
                    {cover ? <LocalImage imageId={cover} alt={gallery.title} /> : <Icon name="image" size={24} />}
                  </span>
                </span>
                <span className="highlight-title">{gallery.title}</span>
                <span className="highlight-count">{count} фото</span>
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="tabs" role="tablist" aria-label="Содержимое профиля">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'posts'}
          className={`tab${tab === 'posts' ? ' is-active' : ''}`}
          onClick={() => setTab('posts')}
        >
          <Icon name="grid" size={16} /> Публикации
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'galleries'}
          className={`tab${tab === 'galleries' ? ' is-active' : ''}`}
          onClick={() => setTab('galleries')}
        >
          <Icon name="image" size={16} /> Галереи
          <span className="tab-count">{userGalleries.length}</span>
        </button>
      </div>

      {tab === 'posts' ? (
        userPhotos.length > 0 ? (
          <div className="grid">
            {userPhotos.map((photo) => (
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
                  <span>
                    <Icon name="comment" size={18} /> {commentsFor(comments, photo.id).length}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="camera"
            title="Пока ни одного кадра"
            text={
              firstGallery
                ? 'Откройте галерею и загрузите первые фотографии — они появятся в сетке профиля.'
                : 'Создайте галерею и добавьте в неё фотографии — они появятся в сетке профиля.'
            }
            action={
              firstGallery ? (
                <a className="btn btn-primary" href={`#${galleryPath(user.username, firstGallery.id)}`}>
                  Открыть «{firstGallery.title}»
                </a>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setGalleryOpen(true)}>
                  Создать галерею
                </button>
              )
            }
          />
        )
      ) : userGalleries.length > 0 ? (
        <div className="albums">
          {userGalleries.map((gallery) => {
            const cover = covers.get(gallery.id) ?? null;
            const count = photos.filter((photo) => photo.galleryId === gallery.id).length;
            return (
              <a className="album" key={gallery.id} href={`#${galleryPath(user.username, gallery.id)}`}>
                <span className="album-cover">
                  {cover ? (
                    <LocalImage imageId={cover} alt={gallery.title} />
                  ) : (
                    <span className="album-cover-empty">
                      <Icon name="image" size={26} />
                    </span>
                  )}
                </span>
                <span className="album-text">
                  <strong>{gallery.title}</strong>
                  <small>{gallery.description || 'Без описания'}</small>
                  <span className="album-meta">
                    {count} фото · {timeAgo(gallery.createdAt)}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="image"
          title="Галерей ещё нет"
          text="Галерея — это подборка фотографий: «Плёнка 35 мм», «Ночной город», «Дом и растения»."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setGalleryOpen(true)}>
              Создать галерею
            </button>
          }
        />
      )}

      {galleryOpen ? (
        <CreateGalleryModal
          userId={user.id}
          onClose={() => setGalleryOpen(false)}
          onCreated={(gallery) => {
            setTab('galleries');
            navigate(galleryPath(user.username, gallery.id));
          }}
        />
      ) : null}
    </div>
  );
}
