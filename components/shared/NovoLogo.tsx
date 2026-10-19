"use client";

import React from "react";
import Link from "next/link";

interface NovoLogoProps {
  variant?: "default" | "white" | "dark" | "icon" | "rider" | "pin";
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string;
}

export const NovoLogo: React.FC<NovoLogoProps> = ({
  variant = "default",
  subtitle,
  size = "md",
  className = "",
  href = "/",
}) => {
  let logoSrc = "/novo-logo/04_Wordmark/04-wordmark_black-on-transparent.svg";
  
  if (variant === "white") {
    logoSrc = "/novo-logo/04_Wordmark/04-wordmark_white-on-transparent.svg";
  } else if (variant === "dark") {
    logoSrc = "/novo-logo/04_Wordmark/04-wordmark_black-on-transparent.svg";
  } else if (variant === "icon") {
    logoSrc = "/novo-logo/01_Motion_N/01-motion-n_green.svg";
  } else if (variant === "rider") {
    logoSrc = "/novo-logo/05_Rider_N/05-rider-n_green.svg";
  } else if (variant === "pin") {
    logoSrc = "/novo-logo/02_Pin_Food/02-pin-food_green.svg";
  }

  const heightMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-14",
  };

  const isIconOnly = variant === "icon" || variant === "rider" || variant === "pin";

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* Icon Mark */}
      <div className="relative flex items-center justify-center shrink-0">
        {variant === "rider" ? (
          <img
            src="/novo-logo/05_Rider_N/05-rider-n_green.svg"
            alt="Novo Rider"
            className={`${heightMap[size]} w-auto object-contain transition-transform group-hover:scale-105`}
          />
        ) : (
          <img
            src={isIconOnly ? logoSrc : "/novo-logo/01_Motion_N/01-motion-n_green.svg"}
            alt="Novo Logo Mark"
            className={`${heightMap[size]} w-auto object-contain transition-transform group-hover:scale-105`}
          />
        )}
      </div>

      {/* Wordmark (if not icon only) */}
      {!isIconOnly && (
        <div className="flex flex-col justify-center min-w-0">
          {variant === "white" ? (
            <img src="/novo-logo/04_Wordmark/04-wordmark_white-on-transparent.svg" alt="Novo" className={`${heightMap[size]} w-auto object-contain`} />
          ) : (
            <>
              {/* Black wordmark on light backgrounds, white one in dark mode. */}
              <img src="/novo-logo/04_Wordmark/04-wordmark_black-on-transparent.svg" alt="Novo" className={`${heightMap[size]} w-auto object-contain dark:hidden`} />
              <img src="/novo-logo/04_Wordmark/04-wordmark_white-on-transparent.svg" alt="Novo" className={`${heightMap[size]} w-auto object-contain hidden dark:block`} />
            </>
          )}
          {subtitle && (
            <span
              className={`text-[9px] font-black uppercase tracking-widest leading-none mt-1 ${
                variant === "white" ? "text-emerald-200" : "text-[#087F5B]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
