import { useMemo } from 'react';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { PhotoCard } from '../components/PhotoCard';
import { plural } from '../lib/format';
import { profilePath } from '../router';
import { useApp } from '../store';
import { useUi } from '../ui';

export function HomePage() {
  const { photos, users, following, toggleFollow } = useApp();
  const { openNewUser } = useUi();
  const feed = useMemo(() => [...photos].sort((a, b) => b.createdAt - a.createdAt), [photos]);
  const byId = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const suggestions = useMemo(() => [...users].sort((a, b) => b.followers - a.followers).slice(0, 4), [users]);

  if (feed.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="camera"
          title="Лента пока пустая"
          text="Создайте профиль, добавьте галерею и загрузите первые фотографии — они появятся здесь."
          action={
            <button type="button" className="btn btn-primary" onClick={openNewUser}>
              <Icon name="plus" size={18} /> Создать профиль
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="home">
      <section className="feed" aria-label="Лента">
        <header className="feed-head">
          <h1>Лента</h1>
          <span className="feed-count">
            {feed.length} {plural(feed.length, 'публикация', 'публикации', 'публикаций')} · {users.length}{' '}
            {plural(users.length, 'профиль', 'профиля', 'профилей')}
          </span>
        </header>
        {feed.map((photo) => {
          const author = byId.get(photo.userId);
          return author ? <PhotoCard key={photo.id} photo={photo} user={author} /> : null;
        })}
      </section>

      <aside className="rail">
        <section className="rail-card">
          <h2>Похожие профили</h2>
          <p className="rail-sub">Люди из этой ленты</p>
          <ul className="rail-users">
            {suggestions.map((user) => (
              <li key={user.id}>
                <a className="rail-user" href={`#${profilePath(user.username)}`}>
                  <Avatar name={user.name} username={user.username} imageId={user.avatarId} size={44} />
                  <span className="rail-user-text">
                    <strong>{user.username}</strong>
                    <small>{user.name}</small>
                  </span>
                </a>
                <button type="button" className="btn btn-link btn-sm" onClick={() => toggleFollow(user.id)}>
                  {following.includes(user.id) ? 'Вы подписаны' : 'Подписаться'}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <p className="rail-foot">
          Instafake — локальная галерея. Фотографии, профили и комментарии хранятся только в этом браузере.
        </p>
      </aside>
    </div>
  );
}
