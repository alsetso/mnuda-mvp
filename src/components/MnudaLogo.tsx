import React from 'react';

interface MnudaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const MnudaLogo: React.FC<MnudaLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="text-mnuda-light-blue">MN</span>
      <span className="text-mnuda-dark-blue">UDA</span>
    </div>
  );
};

export default MnudaLogo;
