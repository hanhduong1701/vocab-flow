import { getLevelInfo } from '@/lib/srs';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, showLabel = true, size = 'md', className }: LevelBadgeProps) {
  const info = getLevelInfo(level);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        `level-badge-${level}`,
        className
      )}
    >
      <span className="font-bold">L{level}</span>
      {showLabel && <span className="opacity-90">{info.label}</span>}
    </span>
  );
}
