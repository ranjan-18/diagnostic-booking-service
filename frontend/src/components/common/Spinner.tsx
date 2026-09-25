import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return <Loader2 className={`animate-spin text-brand-600 ${sizes[size]} ${className}`} />;
};

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Loading data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};
