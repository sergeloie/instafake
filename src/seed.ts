import { all, getMeta, putMany, setMeta, storeBlob } from './db';
import { commenterAvatarUrl, loadSampleBlob, sampleAvatarUrl, samplePhotoUrl } from './lib/images';
import type { Comment, Commenter, Gallery, Photo, User } from './types';

let seeding: Promise<void> | null = null;

const commenterPeople: Array<[string, string]> = [
  ['alina.koval', 'Алина Ковалёва'],
  ['max.volkov', 'Максим Волков'],
  ['tesla_dream', 'Дарья Соколова'],
  ['gosha_petrov', 'Георгий Петров'],
  ['lera.moon', 'Валерия Новикова'],
  ['kirill_shoot', 'Кирилл Орлов'],
  ['nastya.art', 'Анастасия Белова'],
  ['dima.zaycev', 'Дмитрий Зайцев'],
  ['sofia.rain', 'София Морозова'],
  ['artem.frames', 'Артём Крылов'],
  ['yulia.kim', 'Юлия Ким'],
  ['pavel.pixel', 'Павел Лебедев'],
  ['anna_belyaeva', 'Анна Беляева'],
  ['timur.hikes', 'Тимур Салимов'],
  ['vera.notes', 'Вера Тихонова'],
  ['ilya.grig', 'Илья Григорьев'],
];

const commentTexts = [
  'Невероятный свет 🔥',
  'Это просто идеально',
  'Как будто кадр из фильма',
  'Сохранила себе, очень красиво',
  'Плёнка — это любовь',
  'Какая композиция!',
  'Хочу туда прямо сейчас',
  'Тот самый цвет, за которым я хожу в кино',
  'Очень атмосферно',
  'Не могу перестать смотреть',
  'Ты как всегда не подводишь',
  'Это лучший кадр за неделю',
  'Ммм, какая текстура',
  'Пожалуйста, больше таких постов',
  'У меня теперь новый фон на телефоне',
  'Очень тёплый кадр',
  'Кто-то умеет видеть детали',
  'Идеальная минутка тишины',
  'Вот за этим я и открываю ленту',
  'Обожаю этот оттенок',
  'Хочется распечатать и повесить на стену',
  'Тихо, красиво, по-настоящему',
];

const profiles = [
  {
    username: 'marina.volkova',
    name: 'Марина Волкова',
    bio: 'Плёнка, кофе и утренний свет. Санкт-Петербург.',
    followers: 1284,
    following: 312,
    ageDays: 420,
  },
  {
    username: 'nikita.lens',
    name: 'Никита Соколов',
    bio: 'Снимаю город, когда он не смотрит. Ночная съёмка, 35 мм.',
    followers: 3420,
    following: 180,
    ageDays: 610,
  },
  {
    username: 'olga.plant',
    name: 'Ольга Лебедева',
    bio: 'Растения, интерьеры и немного тишины',
    followers: 891,
    following: 420,
    ageDays: 300,
  },
];

const gallerySeed = [
  {
    user: 0,
    title: 'Плёнка 35 мм',
    description: 'Тёплые кадры на Kodak Gold — лето, которое хочется сохранить.',
    ageDays: 210,
  },
  {
    user: 0,
    title: 'Утро в городе',
    description: 'Кофе, окна и свет до девяти утра.',
    ageDays: 90,
  },
  {
    user: 1,
    title: 'Город, когда он не смотрит',
    description: 'Синий час, мокрый асфальт и огни витрин.',
    ageDays: 160,
  },
  {
    user: 2,
    title: 'Зелень и тишина',
    description: 'Растения, прогулки и медленные выходные.',
    ageDays: 120,
  },
];

interface PhotoSeed {
  user: number;
  gallery: number;
  photo: number;
  caption: string;
  location: string;
  likes: number;
  ageMinutes: number;
  comments: number;
}

const photoSeed: PhotoSeed[] = [
  {
    user: 0,
    gallery: 0,
    photo: 1,
    caption: 'Кадр, который ждал полгода',
    location: 'Доломиты',
    likes: 168,
    ageMinutes: 5 * 24 * 60 + 60,
    comments: 4,
  },
  {
    user: 0,
    gallery: 0,
    photo: 3,
    caption: 'Море в ноябре',
    location: 'Ласпи',
    likes: 132,
    ageMinutes: 12 * 24 * 60,
    comments: 3,
  },
  {
    user: 0,
    gallery: 0,
    photo: 7,
    caption: 'Лето пахнет горячим асфальтом и персиками 🍑',
    location: 'Старый город',
    likes: 214,
    ageMinutes: 2 * 24 * 60 + 180,
    comments: 5,
  },
  {
    user: 1,
    gallery: 2,
    photo: 5,
    caption: 'Синий час, 4 утра, никого',
    location: 'Дворцовая набережная',
    likes: 512,
    ageMinutes: 3 * 24 * 60 + 40,
    comments: 5,
  },
  {
    user: 1,
    gallery: 2,
    photo: 6,
    caption: 'Мокрый асфальт всё исправит',
    location: 'Гороховая улица',
    likes: 430,
    ageMinutes: 7 * 24 * 60,
    comments: 4,
  },
  {
    user: 1,
    gallery: 2,
    photo: 12,
    caption: 'Дорога без людей',
    location: '',
    likes: 289,
    ageMinutes: 15 * 24 * 60,
    comments: 3,
  },
  {
    user: 1,
    gallery: 2,
    photo: 4,
    caption: 'Город просыпается',
    location: 'Сан-Франциско',
    likes: 380,
    ageMinutes: 9 * 24 * 60,
    comments: 3,
  },
  {
    user: 2,
    gallery: 3,
    photo: 2,
    caption: 'Тропа после дождя',
    location: 'Лес',
    likes: 64,
    ageMinutes: 26 * 60,
    comments: 4,
  },
  {
    user: 2,
    gallery: 3,
    photo: 11,
    caption: 'Утро, свет и ничего лишнего',
    location: 'Кавказ',
    likes: 121,
    ageMinutes: 2 * 24 * 60 + 600,
    comments: 3,
  },
  {
    user: 2,
    gallery: 3,
    photo: 8,
    caption: 'Тени на старых путях',
    location: 'Старая дорога',
    likes: 88,
    ageMinutes: 5 * 24 * 60,
    comments: 3,
  },
  {
    user: 0,
    gallery: 1,
    photo: 10,
    caption: 'Свет в 7:40',
    location: 'Петроградская сторона',
    likes: 96,
    ageMinutes: 4 * 60,
    comments: 4,
  },
  {
    user: 0,
    gallery: 1,
    photo: 9,
    caption: 'Кофе №1, кофе №2',
    location: 'Кофе на Большом',
    likes: 77,
    ageMinutes: 30 * 24 * 60,
    comments: 3,
  },
];

export async function seedIfNeeded(): Promise<void> {
  const seeded = await getMeta<boolean>('seeded');
  if (seeded) return;
  if (seeding) return seeding;
  seeding = (async () => {
    const existing = await all<User>('users');
    if (existing.length > 0) {
      await setMeta('seeded', true);
      return;
    }
    const now = Date.now();

    const commenters: Commenter[] = [];
    for (const [index, [username, name]] of commenterPeople.entries()) {
      const avatarId = await storeBlob(await loadSampleBlob(commenterAvatarUrl(index)));
      commenters.push({
        id: crypto.randomUUID(),
        username,
        name,
        hue: (index * 47 + 12) % 360,
        avatarId,
      });
    }
    await putMany('commenters', commenters);

    const users: User[] = [];
    for (const [index, profile] of profiles.entries()) {
      const avatarId = await storeBlob(await loadSampleBlob(sampleAvatarUrl(index)));
      users.push({
        id: crypto.randomUUID(),
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        avatarId,
        createdAt: now - profile.ageDays * 86_400_000,
        followers: profile.followers,
        following: profile.following,
      });
    }
    await putMany('users', users);

    const galleries: Gallery[] = gallerySeed.map((gallery) => ({
      id: crypto.randomUUID(),
      userId: users[gallery.user].id,
      title: gallery.title,
      description: gallery.description,
      createdAt: now - gallery.ageDays * 86_400_000,
    }));
    await putMany('galleries', galleries);

    const photos: Photo[] = [];
    const comments: Comment[] = [];
    for (const [index, item] of photoSeed.entries()) {
      const imageId = await storeBlob(await loadSampleBlob(samplePhotoUrl(item.photo)));
      const createdAt = now - item.ageMinutes * 60_000;
      const photo: Photo = {
        id: crypto.randomUUID(),
        userId: users[item.user].id,
        galleryId: galleries[item.gallery].id,
        imageId,
        caption: item.caption,
        location: item.location,
        createdAt,
        likes: item.likes,
        liked: false,
      };
      photos.push(photo);
      for (let commentIndex = 0; commentIndex < item.comments; commentIndex += 1) {
        const commenter = commenters[(index * 3 + commentIndex * 5) % commenters.length];
        const text = commentTexts[(index * 7 + commentIndex * 3) % commentTexts.length];
        const offset = (commentIndex + 1) * 11 * 60_000;
        comments.push({
          id: crypto.randomUUID(),
          photoId: photo.id,
          authorId: commenter.id,
          text,
          createdAt: Math.min(now - 30_000, createdAt + offset),
        });
      }
    }
    await putMany('photos', photos);
    await putMany('comments', comments);
    await setMeta('seeded', true);
  })().finally(() => {
    seeding = null;
  });
  return seeding;
}
