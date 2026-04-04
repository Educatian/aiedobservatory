interface AppIconProps {
  className?: string;
  decorative?: boolean;
}

export function AppIcon({ className, decorative = false }: AppIconProps) {
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}app-icon.svg`}
      alt={decorative ? "" : "AI Education Policy Observatory icon"}
      aria-hidden={decorative ? true : undefined}
    />
  );
}
