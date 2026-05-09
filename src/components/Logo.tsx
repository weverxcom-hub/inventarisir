import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Official Universitas Gajayana Malang logo.
 * Source: https://upload.wikimedia.org/wikipedia/id/5/5e/LOGO-UNIGA.png
 */
export default function Logo({
  size = 40,
  className = "",
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/logo-uniga.png"
      alt="Logo Universitas Gajayana Malang"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
