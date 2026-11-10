import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useApp } from '../store';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

export function CommentComposer({ photoId }: { photoId: string }) {
  const { commenters, users, addComment, createCommenter, getAuthor } = useApp();
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authorId && getAuthor(authorId)) return;
    const fallback = commenters[0]?.id ?? users[0]?.id ?? null;
    if (fallback !== authorId) setAuthorId(fallback);
  }, [authorId, commenters, users, getAuthor]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const options = useMemo(() => {
    const list = [
      ...users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatarId: user.avatarId,
        hue: 204,
      })),
      ...commenters.map((commenter) => ({
        id: commenter.id,
        username: commenter.username,
        name: commenter.name,
        avatarId: commenter.avatarId,
        hue: commenter.hue,
      })),
    ];
    const needle = query.trim().toLowerCase().replace(/^@/, '');
    if (!needle) return list;
    return list.filter(
      (item) => item.username.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle),
    );
  }, [users, commenters, query]);

  const author = authorId ? getAuthor(authorId) : null;
  const handleCandidate = query.trim().replace(/^@/, '').toLowerCase();
  const canCreate =
    handleCandidate.length >= 2 && !options.some((item) => item.username.toLowerCase() === handleCandidate);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!authorId || !text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addComment(photoId, authorId, text);
      setText('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить комментарий');
    } finally {
      setBusy(false);
    }
  }

  async function createAndSelect() {
    if (!handleCandidate) return;
    setBusy(true);
    setError(null);
    try {
      const commenter = await createCommenter({ username: handleCandidate });
      setAuthorId(commenter.id);
      setOpen(false);
      setQuery('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать комментатора');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="comment-composer" onSubmit={submit}>
      <div className="composer-picker" ref={pickerRef}>
        <button
          type="button"
          className="composer-author"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="listbox"
          aria-expanded={open}
          title="От чьего имени комментировать"
        >
          <Avatar
            name={author?.name ?? 'Гость'}
            imageId={author?.avatarId ?? null}
            hue={author?.hue ?? 205}
            size={28}
          />
          <Icon name="chevron" size={14} />
        </button>
        {open ? (
          <div className="picker-pop">
            <div className="picker-search">
              <Icon name="search" size={16} />
              <input
                autoFocus
                className="picker-input"
                placeholder="Найти или создать комментатора"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="picker-list" role="listbox" aria-label="Комментаторы">
              {options.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={item.id === authorId}
                  className={`picker-item${item.id === authorId ? ' is-selected' : ''}`}
                  onClick={() => {
                    setAuthorId(item.id);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Avatar name={item.name} imageId={item.avatarId} hue={item.hue} size={28} />
                  <span className="picker-item-text">
                    <strong>{item.username}</strong>
                    <small>{item.name}</small>
                  </span>
                  {item.id === authorId ? <Icon name="check" size={16} /> : null}
                </button>
              ))}
              {canCreate ? (
                <button type="button" className="picker-item picker-create" onClick={() => void createAndSelect()}>
                  <span className="picker-plus">
                    <Icon name="plus" size={16} />
                  </span>
                  <span className="picker-item-text">
                    <strong>Создать @{handleCandidate}</strong>
                    <small>Новый комментатор</small>
                  </span>
                </button>
              ) : null}
              {options.length === 0 && !canCreate ? <p className="picker-empty">Никого не нашли</p> : null}
            </div>
          </div>
        ) : null}
      </div>
      <input
        className="composer-input"
        placeholder="Добавьте комментарий…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Текст комментария"
        maxLength={500}
      />
      <button className="btn btn-link" type="submit" disabled={!text.trim() || !authorId || busy}>
        {busy ? '…' : 'Опубликовать'}
      </button>
      {error ? <p className="form-error composer-error">{error}</p> : null}
    </form>
  );
}
