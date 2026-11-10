import { initials } from '../lib/format';
import { useBlobUrl } from '../lib/useBlobUrl';

interface AvatarProps {
  name: string;
  username?: string;
  imageId?: string | null;
  hue?: number;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({
  name,
  username,
  imageId = null,
  hue = 205,
  size = 32,
  ring = false,
  className,
}: AvatarProps) {
  const url = useBlobUrl(imageId);
  const content = url ? (
    <img src={url} alt={name} draggable={false} />
  ) : (
    <span
      className="avatar-fallback"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 58% 58%), hsl(${(hue + 46) % 360} 55% 36%))`,
        fontSize: Math.max(9, Math.round(size * 0.36)),
      }}
    >
      {initials(name)}
    </span>
  );

  return (
    <span
      className={['avatar', ring ? 'avatar-ringed' : '', className ?? ''].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      title={username ? `@${username}` : name}
    >
      {ring ? <span className="avatar-inner">{content}</span> : content}
    </span>
  );
}
