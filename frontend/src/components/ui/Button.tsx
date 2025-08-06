import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string; // Link desteği için
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  href,
  ...props
}) => {
  const baseClasses = 'btn focus-ring';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    success: 'btn-success',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const isDisabled = disabled || loading;

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className
  );

  const buttonContent = loading ? (
    <>
      <LoadingSpinner 
        size={size === 'sm' ? 'sm' : 'md'} 
        color={variant === 'outline' ? 'primary' : 'white'} 
        className="mr-2" 
      />
      {children}
    </>
  ) : (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {buttonContent}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
};

export default Button;