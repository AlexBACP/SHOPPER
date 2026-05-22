import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl bg-[var(--input-bg)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all duration-200 outline-none',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]',
              error ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/10' : 'border-[var(--input-border)] hover:border-[var(--border-hover)]',
              leftIcon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
              rightElement ? 'pr-12' : '',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-[var(--input-bg)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all duration-200 outline-none resize-none px-4 py-3',
            'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]',
            error ? 'border-red-500/50' : 'border-[var(--input-border)] hover:border-[var(--border-hover)]',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
