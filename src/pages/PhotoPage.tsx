import { useMemo, useState, type FormEvent } from 'react';
import { Avatar } from '../components/Avatar';
import { CommentComposer } from '../components/CommentComposer';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LocalImage } from '../components/LocalImage';
import { ConfirmDialog } from '../components/Modal';
import { formatCount, plural, timeAgo } from '../lib/format';
import { galleryPath, navigate, photoPath, profilePath } from '../router';
import { commentsFor, useApp } from '../store';

export function PhotoPage({ photoId }: { photoId: string }) {
  const { photos, users, comments, galleries, toggleLike, updateCaption, deletePhoto, getAuthor } = useApp();
  const photo = photos.find((item) => item.id === photoId);
  const author = photo ? users.find((user) => user.id === photo.userId) : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(photo?.caption ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoComments = useMemo(() => (photo ? commentsFor(comments, photo.id) : []), [comments, photo]);
  const gallery = photo?.galleryId ? galleries.find((item) => item.id === photo.galleryId) : undefined;

  if (!photo || !author) {
    return (
      <div className="page">
        <EmptyState
          icon="image"
          title="Публикация не найдена"
          text="Возможно, фото удалили. Загляните в ленту или к профилям."
          action={
            <a className="btn btn-secondary" href="#/">
              В ленту
            </a>
          }
        />
      </div>
    );
  }

  function goBack() {
    if (!author) return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(profilePath(author.username));
    }
  }

  async function saveCaption(event: FormEvent) {
    event.preventDefault();
    if (!photo) return;
    setError(null);
    try {
      await updateCaption(photo.id, draft);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить описание');
    }
  }

  async function handleDelete() {
    if (!photo || !author) return;
    setBusy(true);
    try {
      const target = photo;
      const galleryId = target.galleryId;
      await deletePhoto(target.id);
      if (galleryId) navigate(galleryPath(author.username, galleryId));
      else navigate(profilePath(author.username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить фото');
      setBusy(false);
    }
  }

  return (
    <div className="photo-page">
      <button type="button" className="back-link" onClick={goBack}>
        <Icon name="back" size={18} /> Назад
      </button>

      <article className="photo-view">
        <div className="photo-media">
          <LocalImage imageId={photo.imageId} alt={photo.caption || `Фото @${author.username}`} />
        </div>

        <div className="photo-side">
          <header className="photo-side-head">
            <a className="post-user" href={`#${profilePath(author.username)}`}>
              <Avatar name={author.name} username={author.username} imageId={author.avatarId} size={36} />
              <span className="post-user-meta">
                <strong>{author.username}</strong>
                {photo.location ? <span className="post-location">{photo.location}</span> : null}
              </span>
            </a>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setConfirmOpen(true)}
              aria-label="Удалить фотографию"
            >
              <Icon name="trash" size={19} />
            </button>
          </header>

          <div className="photo-comments">
            <div className="comment-item">
              <Avatar name={author.name} username={author.username} imageId={author.avatarId} size={32} />
              <div className="comment-body">
                {editing ? (
                  <form className="caption-form" onSubmit={saveCaption}>
                    <textarea
                      className="input textarea"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Описание к фотографии"
                    />
                    <div className="caption-form-actions">
                      <button
                        type="button"
                        className="btn btn-link btn-sm"
                        onClick={() => {
                          setEditing(false);
                          setDraft(photo.caption);
                        }}
                      >
                        Отмена
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Сохранить
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>
                      <strong>{author.username}</strong>{' '}
                      {photo.caption || <span className="muted">Без описания</span>}
                    </p>
                    <div className="caption-meta">
                      <span className="comment-meta">{timeAgo(photo.createdAt)}</span>
                      <button
                        type="button"
                        className="caption-edit"
                        onClick={() => {
                          setDraft(photo.caption);
                          setEditing(true);
                        }}
                      >
                        <Icon name="edit" size={13} /> Изменить описание
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {photoComments.length === 0 ? (
              <p className="comments-empty">
                Комментариев пока нет. Напишите первый — от имени любого комментатора из списка.
              </p>
            ) : (
              photoComments.map((comment) => {
                const commentAuthor = getAuthor(comment.authorId);
                return (
                  <div className="comment-item" key={comment.id}>
                    <Avatar
                      name={commentAuthor?.name ?? 'Гость'}
                      imageId={commentAuthor?.avatarId ?? null}
                      hue={commentAuthor?.hue ?? 205}
                      size={32}
                    />
                    <div className="comment-body">
                      <p>
                        <strong>{commentAuthor?.username ?? 'гость'}</strong> {comment.text}
                      </p>
                      <span className="comment-meta">{timeAgo(comment.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="photo-side-foot">
            <div className="photo-actions">
              <button
                type="button"
                className={`icon-btn${photo.liked ? ' is-liked' : ''}`}
                onClick={() => void toggleLike(photo.id)}
                aria-label={photo.liked ? 'Убрать отметку «Нравится»' : 'Нравится'}
                aria-pressed={photo.liked}
              >
                <Icon name="heart" filled={photo.liked} size={24} />
              </button>
              <span className="likes-line">
                {formatCount(photo.likes)}{' '}
                {plural(photo.likes, 'отметка «Нравится»', 'отметки «Нравится»', 'отметок «Нравится»')}
              </span>
            </div>
            <p className="photo-time">
              <time dateTime={new Date(photo.createdAt).toISOString()}>{timeAgo(photo.createdAt)}</time>
              {gallery ? (
                <>
                  {' · '}
                  <a href={`#${galleryPath(author.username, gallery.id)}`}>Галерея «{gallery.title}»</a>
                </>
              ) : null}
              {' · '}
              <a href={`#${photoPath(photo.id)}`} className="photo-permalink">
                постоянная ссылка
              </a>
            </p>
            <CommentComposer photoId={photo.id} />
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        </div>
      </article>

      {confirmOpen ? (
        <ConfirmDialog
          title="Удалить фотографию?"
          text="Фото, его описание и все комментарии будут удалены из этого браузера."
          busy={busy}
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
