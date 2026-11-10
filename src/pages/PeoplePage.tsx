import { useState, type FormEvent } from 'react';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { formatCount, plural } from '../lib/format';
import { profilePath } from '../router';
import { photoCountByUser, useApp } from '../store';
import { useUi } from '../ui';

function AddCommenterForm() {
  const { createCommenter } = useApp();
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!handle.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createCommenter({ username: handle });
      setHandle('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать комментатора');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-commenter" onSubmit={submit}>
      <input
        className="input"
        placeholder="Новый комментатор, например kostya.film"
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
        maxLength={30}
        aria-label="Имя нового комментатора"
      />
      <button type="submit" className="btn btn-secondary" disabled={!handle.trim() || busy}>
        {busy ? 'Добавляем…' : 'Добавить'}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

export function PeoplePage() {
  const { users, photos, commenters } = useApp();
  const { openNewUser } = useUi();
  const sorted = [...users].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Профили</h1>
          <p>
            {users.length} {plural(users.length, 'профиль', 'профиля', 'профилей')} · всё хранится локально, без
            регистрации
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNewUser}>
          <Icon name="plus" size={18} /> Создать профиль
        </button>
      </header>

      {sorted.length === 0 ? (
        <EmptyState
          icon="users"
          title="Здесь пока никого нет"
          text="Создайте первый профиль: имя, фото и описание. Дальше — галереи с фотографиями."
          action={
            <button type="button" className="btn btn-primary" onClick={openNewUser}>
              Создать профиль
            </button>
          }
        />
      ) : (
        <div className="people-grid">
          {sorted.map((user) => {
            const count = photoCountByUser(photos, user.id);
            return (
              <a className="person-card" key={user.id} href={`#${profilePath(user.username)}`}>
                <Avatar name={user.name} username={user.username} imageId={user.avatarId} size={64} />
                <span className="person-text">
                  <strong>{user.username}</strong>
                  <span className="person-name">{user.name}</span>
                  <span className="person-bio">{user.bio || 'Без описания'}</span>
                  <span className="person-meta">
                    {count} {plural(count, 'фото', 'фото', 'фото')} · {formatCount(user.followers)}{' '}
                    {plural(user.followers, 'подписчик', 'подписчика', 'подписчиков')}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      )}

      <section className="commenters-section">
        <header className="section-head">
          <div>
            <h2>Комментаторы</h2>
            <p>Фейковые аккаунты для комментариев. Их можно создать сразу много — имена и аватары генерируются.</p>
          </div>
          <span className="counter">{commenters.length}</span>
        </header>
        <div className="commenter-chips">
          {commenters.map((commenter) => (
            <span className="chip" key={commenter.id}>
              <Avatar name={commenter.name} imageId={commenter.avatarId} hue={commenter.hue} size={24} />
              @{commenter.username}
            </span>
          ))}
        </div>
        <AddCommenterForm />
      </section>
    </div>
  );
}
