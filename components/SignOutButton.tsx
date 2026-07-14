export default function SignOutButton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={`btn-ghost ${className}`}>
        ออกจากระบบ
      </button>
    </form>
  );
}
