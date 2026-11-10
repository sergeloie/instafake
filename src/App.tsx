import { useEffect, type ReactNode } from 'react';
import { EmptyState } from './components/EmptyState';
import { Shell } from './components/Shell';
import { parseRoute, useHashPath } from './router';
import { AppProvider, useApp } from './store';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { PeoplePage } from './pages/PeoplePage';
import { PhotoPage } from './pages/PhotoPage';
import { ProfilePage } from './pages/ProfilePage';
import { UiProvider } from './ui';

function Splash() {
  return (
    <div className="splash">
      <span className="wordmark wordmark-lg">instafake</span>
      <span className="spinner" aria-hidden="true" />
      <p>Загружаем локальную галерею…</p>
    </div>
  );
}

function FatalError({ message }: { message: string }) {
  return (
    <div className="splash">
      <span className="wordmark wordmark-lg">instafake</span>
      <div className="fatal-card">
        <h1>Не удалось открыть локальное хранилище</h1>
        <p>{message}</p>
        <p className="fatal-hint">
          Проверьте, что браузер не блокирует IndexedDB и сайт открыт не в приватном окне с запретом хранилища.
        </p>
      </div>
    </div>
  );
}

function Routes() {
  const { ready, error } = useApp();
  const path = useHashPath();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  if (!ready) return <Splash />;
  if (error) return <FatalError message={error} />;

  const route = parseRoute(path);
  let page: ReactNode;
  switch (route.name) {
    case 'home':
      page = <HomePage />;
      break;
    case 'people':
      page = <PeoplePage />;
      break;
    case 'profile':
      page = <ProfilePage key={route.username} username={route.username} />;
      break;
    case 'gallery':
      page = <GalleryPage username={route.username} galleryId={route.galleryId} />;
      break;
    case 'photo':
      page = <PhotoPage photoId={route.photoId} />;
      break;
    default:
      page = (
        <div className="page">
          <EmptyState
            icon="search"
            title="Страница не найдена"
            text="Такого адреса в локальной галерее нет."
            action={
              <a className="btn btn-secondary" href="#/">
                На главную
              </a>
            }
          />
        </div>
      );
  }

  return <Shell>{page}</Shell>;
}

export function App() {
  return (
    <AppProvider>
      <UiProvider>
        <Routes />
      </UiProvider>
    </AppProvider>
  );
}
