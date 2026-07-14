import type { Dog } from '@/lib/types';

export default function DogAvatar({
  dog,
  size = 64,
}: {
  dog: Pick<Dog, 'name' | 'photo_url'>;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-bgSoft ring-2 ring-brand-gold"
      style={{ width: size, height: size }}
    >
      {dog.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dog.photo_url}
          alt={dog.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>🐶</span>
      )}
    </div>
  );
}
