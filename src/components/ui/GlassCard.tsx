import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'white' | 'subtle' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect?: boolean;
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'white',
  padding = 'lg',
  hoverEffect = false,
  onClick,
  id
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
    xl: 'p-6 sm:p-8'
  };

  const variantClasses = {
    white: 'bg-white border border-[#D9EAEB] shadow-[0_8px_30px_rgba(30,90,95,0.06)]',
    glass: 'bg-white/75 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgba(30,90,95,0.06)]',
    subtle: 'bg-[#EAF6F7]/60 border border-[#D9EAEB]/80',
    gradient: 'bg-gradient-to-br from-white via-[#F1FAFA]/90 to-[#EAF6F7]/80 border border-[#D9EAEB] shadow-[0_8px_30px_rgba(30,90,95,0.06)]'
  };

  const hoverClass = hoverEffect 
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(30,90,95,0.10)] cursor-pointer' 
    : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-[20px] ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};
