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
            {/* Premium Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white mb-4 shadow-lg ${
              requiredPlan === 'ULTRA' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}>
              <Crown className="h-3 w-3 mr-1" />
              {requiredPlan} Özelliği
            </div>
            
            {/* Title and Description */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {description}
            </p>
            
            {/* Required Plan Info */}
            <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium mb-4 ${
              requiredPlan === 'ULTRA'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
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
        <div className={`absolute inset-0 rounded-lg border-2 border-transparent opacity-20 pointer-events-none ${
          requiredPlan === 'ULTRA'
            ? 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600'
            : 'bg-gradient-to-r from-green-400 via-green-500 to-green-600'
        }`} />
      )}
    </div>
  );
};

export default PremiumFeatureCard;