'use client';

import clsx from 'clsx';
import type { MeshTone } from '@/components/home/LandingMeshBackground';

type GradientPanelVariant =
  | 'hero'
  | 'feature'
  | 'feature-violet'
  | 'feature-teal'
  | 'feature-plum'
  | 'integrations';

type LandingGradientTextureProps = {
  tone?: MeshTone;
  panelVariant?: GradientPanelVariant;
  /** Subtle scale/opacity drift on hero + CTA */
  animated?: boolean;
};

const HERO_MESH_SRCSET = [
  '/landing/mesh/hero-cobalt-500.webp 500w',
  '/landing/mesh/hero-cobalt-800.webp 800w',
  '/landing/mesh/hero-cobalt-1080.webp 1080w',
  '/landing/mesh/hero-cobalt-1600.webp 1600w',
  '/landing/mesh/hero-cobalt-1920.webp 1920w',
].join(', ');

/** Authored mesh — hero uses baked WebP (Instantly reference); others use SVG */
export default function LandingGradientTexture({
  tone = 'cobalt',
  panelVariant,
  animated = false,
}: LandingGradientTextureProps) {
  const useHeroImage = panelVariant === 'hero' && tone === 'cobalt';

  return (
    <div
      className={clsx(
        'landing-gradient-texture pointer-events-none absolute inset-0 z-0',
        animated && 'landing-gradient-texture--animated',
      )}
      aria-hidden
    >
      {useHeroImage ? (
        <HeroCobaltImageMesh />
      ) : (
        <>
          {tone === 'cobalt' && <CobaltMesh />}
          {tone === 'violet' && <VioletMesh />}
          {tone === 'teal' && <TealMesh />}
          {tone === 'plum' && <PlumMesh />}
          {tone === 'emerald' && <EmeraldMesh />}
        </>
      )}
    </div>
  );
}

function HeroCobaltImageMesh() {
  return (
    <picture className="block h-full w-full">
      <source type="image/webp" srcSet={HERO_MESH_SRCSET} sizes="(max-width: 1919px) 100vw, 1920px" />
      <img
        src="/landing/mesh/hero-cobalt-1920.webp"
        alt=""
        className="h-full w-full object-cover object-center"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

function MeshSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function CobaltMesh() {
  return (
    <MeshSvg>
      <defs>
        <radialGradient id="cobalt-base" cx="48%" cy="42%" r="78%">
          <stop offset="0%" stopColor="#8eb4ff" />
          <stop offset="38%" stopColor="#5b7fff" />
          <stop offset="72%" stopColor="#3548c7" />
          <stop offset="100%" stopColor="#1a2f9e" />
        </radialGradient>
        <radialGradient id="cobalt-hot" cx="64%" cy="28%" r="42%">
          <stop offset="0%" stopColor="#dce8ff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#a8c4ff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6b8fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cobalt-shade-bl" cx="8%" cy="92%" r="52%">
          <stop offset="0%" stopColor="#0f1f7a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0f1f7a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cobalt-shade-tr" cx="96%" cy="8%" r="48%">
          <stop offset="0%" stopColor="#2438b8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2438b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#cobalt-base)" />
      <rect width="1440" height="900" fill="url(#cobalt-hot)" />
      <rect width="1440" height="900" fill="url(#cobalt-shade-bl)" />
      <rect width="1440" height="900" fill="url(#cobalt-shade-tr)" />
    </MeshSvg>
  );
}

function VioletMesh() {
  return (
    <MeshSvg>
      <defs>
        <radialGradient id="violet-base" cx="46%" cy="44%" r="76%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="40%" stopColor="#8b5cf6" />
          <stop offset="72%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#3b1578" />
        </radialGradient>
        <radialGradient id="violet-hot" cx="62%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="violet-shade" cx="10%" cy="88%" r="50%">
          <stop offset="0%" stopColor="#2e1065" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2e1065" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#violet-base)" />
      <rect width="1440" height="900" fill="url(#violet-hot)" />
      <rect width="1440" height="900" fill="url(#violet-shade)" />
    </MeshSvg>
  );
}

function TealMesh() {
  return (
    <MeshSvg>
      <defs>
        <radialGradient id="teal-base" cx="48%" cy="44%" r="76%">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="40%" stopColor="#2dd4bf" />
          <stop offset="72%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0a4f4a" />
        </radialGradient>
        <radialGradient id="teal-hot" cx="60%" cy="32%" r="40%">
          <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="teal-shade" cx="8%" cy="90%" r="50%">
          <stop offset="0%" stopColor="#042f2e" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#042f2e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#teal-base)" />
      <rect width="1440" height="900" fill="url(#teal-hot)" />
      <rect width="1440" height="900" fill="url(#teal-shade)" />
    </MeshSvg>
  );
}

function PlumMesh() {
  return (
    <MeshSvg>
      <defs>
        <radialGradient id="plum-base" cx="48%" cy="44%" r="76%">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="40%" stopColor="#d946ef" />
          <stop offset="72%" stopColor="#a21caf" />
          <stop offset="100%" stopColor="#581c67" />
        </radialGradient>
        <radialGradient id="plum-hot" cx="62%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#fae8ff" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="plum-shade" cx="10%" cy="88%" r="50%">
          <stop offset="0%" stopColor="#4a044e" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#4a044e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#plum-base)" />
      <rect width="1440" height="900" fill="url(#plum-hot)" />
      <rect width="1440" height="900" fill="url(#plum-shade)" />
    </MeshSvg>
  );
}

function EmeraldMesh() {
  return (
    <MeshSvg>
      <defs>
        <radialGradient id="emerald-base" cx="48%" cy="44%" r="76%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="40%" stopColor="#34d399" />
          <stop offset="72%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </radialGradient>
        <radialGradient id="emerald-hot" cx="60%" cy="32%" r="40%">
          <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="emerald-shade" cx="8%" cy="90%" r="50%">
          <stop offset="0%" stopColor="#022c22" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#emerald-base)" />
      <rect width="1440" height="900" fill="url(#emerald-hot)" />
      <rect width="1440" height="900" fill="url(#emerald-shade)" />
    </MeshSvg>
  );
}
