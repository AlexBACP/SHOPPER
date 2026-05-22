interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = 'w-5 h-5' }: LogoIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.15)"
      />
      <path d="M3 6h18" stroke="white" strokeWidth="2" />
      <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
