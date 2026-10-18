"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl">
    <LoadingSkeleton className="h-40 w-full rounded-xl" />
    <LoadingSkeleton className="h-5 w-3/4" />
    <LoadingSkeleton className="h-4 w-1/2" />
    <div className="flex items-center justify-between mt-2">
      <LoadingSkeleton className="h-6 w-20" />
      <LoadingSkeleton className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);
