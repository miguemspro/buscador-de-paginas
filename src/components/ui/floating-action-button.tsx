import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function FloatingActionButton({
  position = 'bottom-right',
  className,
  children,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'right-4 bottom-4',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4',
    'bottom-left': 'left-4 bottom-4',
  };

  return (
    <Button
      className={cn(
        'fixed z-50 h-14 w-14 rounded-full shadow-lg',
        'md:hidden', // Only show on mobile
        positionClasses[position],
        className
      )}
      size="icon"
      {...props}
    >
      {children}
    </Button>
  );
}
