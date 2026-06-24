export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preload" href="/logo-collapsed.png" as="image" type="image/png" fetchPriority="high" />
      {children}
    </>
  );
}
