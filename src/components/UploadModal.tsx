import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface SelectedFile {
  id: string;
  file: File;
  url: string;
  caption: string;
}

export function UploadModal({
  userId,
  galleryId,
  onClose,
}: {
  userId: string;
  galleryId: string | null;
  onClose: () => void;
}) {
  const { addPhotos } = useApp();
  const [items, setItems] = useState<SelectedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function addFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) {
      setError('Нужны файлы изображений: JPG, PNG, WebP или GIF');
      return;
    }
    setError(null);
    const next = images.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.add(url);
      return { id: crypto.randomUUID(), file, url, caption: '' };
    });
    setItems((previous) => [...previous, ...next]);
  }

  function removeItem(id: string) {
    const target = items.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current.delete(target.url);
    }
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  async function submit() {
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addPhotos(
        userId,
        galleryId,
        items.map((item) => ({ file: item.file, caption: item.caption })),
      );
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить фотографии');
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Добавить фото"
      subtitle="Файлы сохраняются в IndexedDB этого браузера и никуда не загружаются."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={busy || items.length === 0}>
            {busy ? 'Сохраняем…' : `Загрузить ${items.length || ''}`.trim()}
          </button>
        </>
      }
    >
      <div className="upload">
        <div
          className={`dropzone${dragOver ? ' is-over' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <span className="dropzone-icon">
            <Icon name="camera" size={24} />
          </span>
          <p>
            Перетащите фото сюда или{' '}
            <button type="button" className="btn btn-link" onClick={() => inputRef.current?.click()}>
              выберите файлы
            </button>
          </p>
          <span className="dropzone-hint">Можно несколько сразу · JPG, PNG, WebP, GIF</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </div>

        {items.length > 0 ? (
          <ul className="upload-list">
            {items.map((item) => (
              <li className="upload-item" key={item.id}>
                <span className="upload-thumb">
                  <img src={item.url} alt="" />
                </span>
                <div className="upload-item-fields">
                  <span className="upload-name">{item.file.name}</span>
                  <input
                    className="input"
                    placeholder="Описание к фото"
                    value={item.caption}
                    onChange={(event) =>
                      setItems((previous) =>
                        previous.map((entry) =>
                          entry.id === item.id ? { ...entry, caption: event.target.value } : entry,
                        ),
                      )
                    }
                    maxLength={300}
                  />
                </div>
                <button type="button" className="icon-btn" onClick={() => removeItem(item.id)} aria-label="Убрать файл">
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </Modal>
  );
}
