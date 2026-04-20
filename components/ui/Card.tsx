import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
