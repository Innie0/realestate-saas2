/** Fixed film grain + subtle lime ambient glow for Framer-dark marketing pages. */
export default function MarketingAtmosphere() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.045] mix-blend-overlay"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
      <div
        className="pointer-events-none fixed -left-[15%] top-[5%] z-0 h-[55vh] w-[55vw] rounded-full opacity-[0.07]"
        aria-hidden
        style={{
          background: 'radial-gradient(circle, var(--brand-500) 0%, transparent 68%)',
        }}
      />
    </>
  );
}
