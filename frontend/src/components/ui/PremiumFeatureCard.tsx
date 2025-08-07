import React from 'react';
import Link from 'next/link';
import { Crown, ArrowRight, Lock } from 'lucide-react';
import Button from './Button';

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  requiredPlan: string;
  requiredPrice: string;
  isBlurred?: boolean;
  upgradeUrl?: string;
  className?: string;
}

const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  title,
  description,
  children,
  requiredPlan,
  requiredPrice,
  isBlurred = true,
  upgradeUrl = '/dashboard/subscription',
  className = ''
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blurred Content */}
      <div className={`${isBlurred ? 'filter blur-sm' : ''} transition-all duration-300`}>
        {children}
      </div>
      
      {/* Overlay */}
      {isBlurred && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/80 backdrop-blur-[2px] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            {/* ULTRA Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white mb-4 shadow-lg">
              <Crown className="h-3 w-3 mr-1" />
              ULTRA Özelliği
            </div>
            
            {/* Title and Description */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {description}
            </p>
            
            {/* Required Plan Info */}
            <div className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200 mb-4">
              <Lock className="h-4 w-4 mr-2" />
              {requiredPlan} - {requiredPrice}
            </div>
            
            {/* Upgrade Button */}
            <div className="space-y-2">
              <Button
                href={upgradeUrl}
                variant="primary"
                size="sm"
                icon={<ArrowRight className="h-4 w-4" />}
                className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Planı Yükselt
              </Button>
              <div className="text-xs text-gray-500">
                Bu özellik için abonelik gerekli
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Gradient Border Effect */}
      {isBlurred && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 opacity-20 pointer-events-none" />
      )}
    </div>
  );
};

export default PremiumFeatureCard;