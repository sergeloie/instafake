import type { ReactNode } from 'react';
import { useHashPath } from '../router';
import { useApp } from '../store';
import { useUi } from '../ui';
import { Icon, type IconName } from './Icon';

export function Shell({ children }: { children: ReactNode }) {
  const path = useHashPath();
  const { users } = useApp();
  const { openNewUser } = useUi();
  const isHome = path === '/' || path.startsWith('/p/');
  const isPeople = path.startsWith('/people');

  const items: Array<{ key: string; label: string; icon: IconName; href?: string; action?: () => void; active: boolean }> = [
    { key: 'home', label: 'Главная', icon: 'home', href: '#/', active: isHome },
    { key: 'people', label: 'Профили', icon: 'users', href: '#/people', active: isPeople },
    { key: 'create', label: 'Создать', icon: 'plus', action: openNewUser, active: false },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="wordmark" href="#/" aria-label="Instafake — на главную">
          instafake
        </a>
        <nav className="side-nav" aria-label="Основная навигация">
          {items.map((item) =>
            item.href ? (
              <a key={item.key} className={`nav-item${item.active ? ' is-active' : ''}`} href={item.href}>
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </a>
            ) : (
              <button key={item.key} type="button" className="nav-item" onClick={item.action}>
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
        <div className="side-foot">
          <span className="local-badge">
            <span className="local-dot" />
            Локально в браузере
          </span>
          <p className="side-foot-text">
            {users.length > 0
              ? `${users.length} ${users.length === 1 ? 'профиль' : users.length < 5 ? 'профиля' : 'профилей'} · фото не покидают устройство`
              : 'Фото и профили хранятся только на этом устройстве'}
          </p>
        </div>
      </aside>

      <div className="shell-main">
        <header className="mobile-top">
          <a className="wordmark" href="#/" aria-label="Instafake — на главную">
            instafake
          </a>
          <button type="button" className="icon-btn" onClick={openNewUser} aria-label="Создать профиль">
            <Icon name="plus" size={24} />
          </button>
        </header>

        <main className="content">{children}</main>

        <nav className="mobile-nav" aria-label="Основная навигация">
          {items.map((item) =>
            item.href ? (
              <a key={item.key} className={`mobile-nav-item${item.active ? ' is-active' : ''}`} href={item.href}>
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </a>
            ) : (
              <button key={item.key} type="button" className="mobile-nav-item" onClick={item.action}>
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
