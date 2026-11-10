import { useEffect, useState, type FormEvent } from 'react';
import { navigate, profilePath } from '../router';
import { useApp } from '../store';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const { createUser } = useApp();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!avatar) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const user = await createUser({ username, name, bio, avatar });
      onClose();
      navigate(profilePath(user.username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать профиль');
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Новый профиль"
      subtitle="Локальный пользователь без регистрации — просто карточка в галерее."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="submit" form="create-user-form" className="btn btn-primary" disabled={busy || username.trim().length < 3}>
            {busy ? 'Создаём…' : 'Создать профиль'}
          </button>
        </>
      }
    >
      <form id="create-user-form" className="form" onSubmit={submit}>
        <div className="avatar-field">
          <span className="avatar-pick-preview">
            {preview ? (
              <img src={preview} alt="Фото профиля" />
            ) : (
              <span className="avatar-pick-empty">
                <Icon name="camera" size={24} />
              </span>
            )}
          </span>
          <div className="avatar-field-actions">
            <label className="btn btn-secondary btn-sm">
              {avatar ? 'Изменить фото' : 'Фото профиля'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setAvatar(file);
                  event.target.value = '';
                }}
              />
            </label>
            {avatar ? (
              <button type="button" className="btn btn-link btn-sm" onClick={() => setAvatar(null)}>
                Убрать
              </button>
            ) : null}
            <span className="field-hint">Необязательно. Если не выбрать — будут инициалы.</span>
          </div>
        </div>

        <label className="field">
          <span className="field-label">Имя пользователя</span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="anna.photo"
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
          />
          <span className="field-hint">Латиница, цифры, точка и подчёркивание. Так профиль увидят в ленте.</span>
        </label>

        <label className="field">
          <span className="field-label">Имя</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Анна Соколова"
            maxLength={60}
          />
        </label>

        <label className="field">
          <span className="field-label">Описание профиля</span>
          <textarea
            className="input textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Что вы снимаете? Где живёте? Пара слов о себе."
            rows={3}
            maxLength={200}
          />
          <span className="field-hint">{bio.length}/200</span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
