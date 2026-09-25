import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm ${
        hoverEffect ? 'transition-all duration-200 hover:shadow-md hover:border-slate-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
