import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src && !src.startsWith('data:')) {
    return (
      <Image
        src={src}
        alt={name}
        width={96}
        height={96}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  if (src?.startsWith('data:')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-cricket-100 dark:bg-cricket-900 flex items-center justify-center font-semibold text-cricket-700 dark:text-cricket-300',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
