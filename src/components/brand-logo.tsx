import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: number;
};

export function BrandLogo({ className, size = 40 }: BrandLogoProps) {
  return (
    <Image
      src="/quba-logo.jpg"
      alt="Quba Infotech"
      width={size}
      height={size}
      className={cn(
        "rounded-2xl object-cover shadow-lg shadow-primary/20 ring-2 ring-white/70",
        className
      )}
      priority
    />
  );
}
