import React from 'react';
import { ShimmerButton } from '@/components/magicui/shimmer-button';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  background?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  background = 'rgb(37, 99, 235)'
}) => {
  return (
    <ShimmerButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      shimmerColor="rgba(255, 255, 255, 0.8)"
      shimmerSize="0.1em"
      shimmerDuration="2s"
      background={background}
      borderRadius="0.375rem"
    >
      {children}
    </ShimmerButton>
  );
};

export default Button; 