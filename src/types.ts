export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarId: string | null;
  createdAt: number;
  followers: number;
  following: number;
}

export interface Gallery {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: number;
}

export interface Photo {
  id: string;
  userId: string;
  galleryId: string | null;
  imageId: string;
  caption: string;
  location: string;
  createdAt: number;
  likes: number;
  liked: boolean;
}

export interface Comment {
  id: string;
  photoId: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Commenter {
  id: string;
  username: string;
  name: string;
  hue: number;
  avatarId: string | null;
}

export interface BlobRecord {
  id: string;
  blob: Blob;
}
