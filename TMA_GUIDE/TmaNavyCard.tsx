import React from "react";

export interface TmaNavyCardProps {
  stepText?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const TmaNavyCard: React.FC<TmaNavyCardProps> = ({
  stepText,
  title,
  subtitle,
  children,
  className = "",
}) => {
  return (
    <div className={`tma-navy-card ${className}`}>
      {stepText && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-bold text-[#C9A66B] uppercase tracking-widest">
            {stepText}
          </span>
        </div>
      )}

      {title && <label>{title}</label>}
      {subtitle && <p className="text-xs text-slate-300 mb-4">{subtitle}</p>}

      {children}
    </div>
  );
};
