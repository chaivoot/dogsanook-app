'use client';

import { useRef } from 'react';

/**
 * A <form> bound to a server action that clears its fields once the action
 * resolves — so "add another" starts blank instead of keeping the last entry.
 */
export default function ResetForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (formData) => {
        await action(formData);
        ref.current?.reset();
      }}
    >
      {children}
    </form>
  );
}
