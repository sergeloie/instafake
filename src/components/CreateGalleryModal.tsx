import { useState, type FormEvent } from 'react';
import { useApp } from '../store';
import type { Gallery } from '../types';
import { Modal } from './Modal';

export function CreateGalleryModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated?: (gallery: Gallery) => void;
}) {
  const { createGallery } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const gallery = await createGallery(userId, title, description);
      onClose();
      onCreated?.(gallery);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать галерею');
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Новая галерея"
      subtitle="Набор фотографий внутри профиля — как подборка или альбом."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="submit" form="create-gallery-form" className="btn btn-primary" disabled={busy || !title.trim()}>
            {busy ? 'Создаём…' : 'Создать галерею'}
          </button>
        </>
      }
    >
      <form id="create-gallery-form" className="form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Название</span>
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, «Плёнка 35 мм»"
            maxLength={60}
          />
        </label>
        <label className="field">
          <span className="field-label">Описание</span>
          <textarea
            className="input textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="О чём эта подборка?"
            rows={3}
            maxLength={200}
          />
          <span className="field-hint">{description.length}/200</span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
