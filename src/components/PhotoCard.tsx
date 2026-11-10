import { useEffect, useRef, useState } from 'react';
import { formatCount, plural, timeAgo } from '../lib/format';
import { persistSaved, readSaved } from '../lib/saved';
import { navigate, photoPath, profilePath } from '../router';
import { commentsFor, useApp } from '../store';
import type { Photo, User } from '../types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { LocalImage } from './LocalImage';

export function PhotoCard({ photo, user }: { photo: Photo; user: User }) {
  const { comments, toggleLike, getAuthor } = useApp();
  const [burst, setBurst] = useState(false);
  const [saved, setSaved] = useState(() => readSaved().has(photo.id));
  const [copied, setCopied] = useState(false);
  const clickTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const photoComments = commentsFor(comments, photo.id);

  useEffect(
    () => () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
      if (burstTimer.current) window.clearTimeout(burstTimer.current);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  function open() {
    navigate(photoPath(photo.id));
  }

  function like() {
    if (photo.liked) return;
    setBurst(true);
    if (burstTimer.current) window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => setBurst(false), 750);
    void toggleLike(photo.id);
  }

  function handleMediaClick() {
    if (clickTimer.current) return;
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      open();
    }, 220);
  }

  function handleMediaDoubleClick() {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    like();
  }

  async function share() {
    const link = `${window.location.origin}${window.location.pathname}#${photoPath(photo.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function toggleSaved() {
    const next = new Set(readSaved());
    if (next.has(photo.id)) next.delete(photo.id);
    else next.add(photo.id);
    persistSaved(next);
    setSaved(next.has(photo.id));
  }

  const visibleComments = photoComments.length > 2 ? photoComments.slice(-2) : photoComments;

  return (
    <article className="post">
      <header className="post-head">
        <a className="post-user" href={`#${profilePath(user.username)}`}>
          <Avatar name={user.name} username={user.username} imageId={user.avatarId} size={34} />
          <span className="post-user-meta">
            <strong>{user.username}</strong>
            {photo.location ? <span className="post-location">{photo.location}</span> : null}
          </span>
        </a>
        <button type="button" className="icon-btn" onClick={open} aria-label="Открыть публикацию">
          <Icon name="more" size={20} />
        </button>
      </header>

      <button
        type="button"
        className="post-media"
        onClick={handleMediaClick}
        onDoubleClick={handleMediaDoubleClick}
        aria-label={photo.caption || 'Открыть фотографию'}
      >
        <LocalImage imageId={photo.imageId} alt={photo.caption || `Фото @${user.username}`} />
        {burst ? (
          <span className="heart-burst">
            <Icon name="heart" filled size={92} />
          </span>
        ) : null}
      </button>

      <div className="post-actions">
        <button
          type="button"
          className={`icon-btn${photo.liked ? ' is-liked' : ''}`}
          onClick={() => void toggleLike(photo.id)}
          aria-label={photo.liked ? 'Убрать отметку «Нравится»' : 'Нравится'}
          aria-pressed={photo.liked}
        >
          <Icon name="heart" filled={photo.liked} size={24} />
        </button>
        <button type="button" className="icon-btn" onClick={open} aria-label="Комментарии">
          <Icon name="comment" size={24} />
        </button>
        <button type="button" className="icon-btn" onClick={share} aria-label="Скопировать ссылку">
          <Icon name="send" size={23} />
        </button>
        <span className="post-actions-spacer" />
        {copied ? <span className="copied-note">Ссылка скопирована</span> : null}
        <button
          type="button"
          className={`icon-btn${saved ? ' is-saved' : ''}`}
          onClick={toggleSaved}
          aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить'}
          aria-pressed={saved}
        >
          <Icon name="bookmark" filled={saved} size={23} />
        </button>
      </div>

      <div className="post-body">
        <p className="post-likes">
          {formatCount(photo.likes)}{' '}
          {plural(photo.likes, 'отметка «Нравится»', 'отметки «Нравится»', 'отметок «Нравится»')}
        </p>
        {photo.caption ? (
          <p className="post-caption">
            <a href={`#${profilePath(user.username)}`}>{user.username}</a> {photo.caption}
          </p>
        ) : null}
        {photoComments.length > 2 ? (
          <button type="button" className="post-comments-link" onClick={open}>
            Посмотреть все комментарии ({photoComments.length})
          </button>
        ) : null}
        {visibleComments.map((comment) => {
          const author = getAuthor(comment.authorId);
          return (
            <p className="post-comment" key={comment.id}>
              <strong>{author?.username ?? 'гость'}</strong> {comment.text}
            </p>
          );
        })}
        <time className="post-time" dateTime={new Date(photo.createdAt).toISOString()}>
          {timeAgo(photo.createdAt)}
        </time>
      </div>
    </article>
  );
}
