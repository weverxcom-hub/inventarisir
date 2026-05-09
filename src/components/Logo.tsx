import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * UNIGA Malang logo. Sourced from /public/logo-uniga.svg so it's cacheable and
 * resolution-independent.
 */
export default function Logo({
  size = 40,
  className = "",
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/logo-uniga.svg"
      alt="Logo Universitas Gajayana Malang"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
