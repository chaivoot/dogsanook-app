'use client';

import { useFormStatus } from 'react-dom';

/**
 * Submit button that reflects the form's pending state — shows a "working"
 * label and disables itself while the server action runs, so a click always
 * gives immediate feedback.
 */
export default function SubmitButton({
  children,
  className = 'btn-gold',
  pendingText = 'กำลังบันทึก…',
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
