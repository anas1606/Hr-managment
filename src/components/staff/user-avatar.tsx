"use client";

import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarPath,
  className,
  textClassName,
}: {
  name?: string | null;
  avatarPath?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const initial = (name || "?").slice(0, 1).toUpperCase();

  if (avatarPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarPath}
        alt={name || "Profile"}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary to-cyan font-semibold text-white",
        className
      )}
    >
      <span className={textClassName}>{initial}</span>
    </div>
  );
}
