import { Heart } from "lucide-react";

interface FooterProps {
  variant?: "light" | "dark";
}

/**
 * Global app footer. `variant="dark"` is used on the login screen / public
 * pages with a dark background; `light` is the default for in-app pages.
 */
export default function Footer({ variant = "light" }: FooterProps) {
  const baseColor =
    variant === "dark" ? "text-blue-200" : "text-gray-500";

  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-1 py-4 text-center text-xs ${baseColor}`}
    >
      <span>developed with</span>
      <Heart
        size={12}
        className="text-red-500 fill-red-500"
        aria-label="love"
      />
      <span>by</span>
      <a
        href="https://weverx.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline"
      >
        weverx.com
      </a>
    </footer>
  );
}
