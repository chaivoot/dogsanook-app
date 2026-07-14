/** The "หมาสนุก" wordmark — green rounded badge, as on dogsanook.com. */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-xl bg-brand-green px-2.5 py-1 text-lg font-bold leading-none text-white ${className}`}
    >
      หมาสนุก
    </span>
  );
}
