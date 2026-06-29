import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 max-w-[1600px] mx-auto fade-in-stagger",
        className
      )}
    >
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: {
    default?: number;
    md?: number;
    xl?: number;
  };
  rowSpan?: {
    default?: number;
    md?: number;
  };
  hover?: boolean;
  onClick?: () => void;
}

export const BentoCard = ({
  children,
  className,
  colSpan = { default: 1, md: 1, xl: 3 },
  rowSpan = { default: 1, md: 1 },
  hover = true,
  onClick,
}: BentoCardProps) => {
  const colClasses = `col-span-${colSpan.default} md:col-span-${colSpan.md} xl:col-span-${colSpan.xl}`;
  const rowClasses = `row-span-${rowSpan.default} md:row-span-${rowSpan.md}`;

  return (
    <div
      className={cn(
        "glass-card p-6",
        hover && "glass-card-hover",
        `xl:col-span-${colSpan.xl}`,
        `md:col-span-${colSpan.md || colSpan.default}`,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

