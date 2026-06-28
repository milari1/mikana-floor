import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Large, glove-friendly button for crew screens.
 * Minimum height 56px (>= 56pt touch target), large type, generous padding.
 */
const bigButton = cva(
  'inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl px-6 py-4 ' +
    'text-lg font-semibold transition active:scale-[0.98] ' +
    'disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400',
  {
    variants: {
      variant: {
        primary: 'bg-slate-900 text-white active:bg-slate-800',
        neutral:
          'bg-white text-slate-900 ring-1 ring-inset ring-slate-200 active:bg-slate-50',
        danger: 'bg-red-600 text-white active:bg-red-700',
        success: 'bg-emerald-600 text-white active:bg-emerald-700',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export interface BigButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bigButton> {}

export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(
  function BigButton({ className, variant, block, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(bigButton({ variant, block }), className)}
        {...props}
      />
    );
  },
);
