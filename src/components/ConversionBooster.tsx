import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Zap, TrendingUp } from 'lucide-react';
import { CONVERSION_CONFIG, URGENCY_MESSAGES, ANALYTICS_SIMULATION } from '@/config/marketing';

export const ConversionBooster: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(CONVERSION_CONFIG.CONVERSION_BOOSTER.timers.specialOfferDuration);
  const [userCount, setUserCount] = useState<number>(ANALYTICS_SIMULATION.USER_GROWTH.baseCount);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : CONVERSION_CONFIG.CONVERSION_BOOSTER.timers.specialOfferDuration);
      // Simulate increasing user count
      if (Math.random() > (1 - CONVERSION_CONFIG.CONVERSION_BOOSTER.socialProof.incrementProbability)) {
        setUserCount(prev => prev + 1);
      }
    }, CONVERSION_CONFIG.CONVERSION_BOOSTER.timers.updateInterval);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Time-limited offer */}
      <Card className="p-4 border-red-500/50 bg-red-50/10 animate-pulse-neon">
        <div className="flex items-center gap-3 justify-center">
          <Clock className="h-5 w-5 text-red-500 animate-bounce" />
          <span className="font-bold text-red-500">
            {URGENCY_MESSAGES.LIMITED_TIME} {formatTime(timeLeft)}
          </span>
        </div>
      </Card>

      {/* Social proof */}
      <Card className="p-3 glass-card">
        <div className="flex items-center gap-3 justify-center text-sm">
          <Users className="h-4 w-4 text-green-500" />
          <span>{userCount} brukere har oppgradert denne måneden</span>
          <Badge variant="secondary" className="animate-pulse">
            +{Math.floor(Math.random() * 5) + 1} nå
          </Badge>
        </div>
      </Card>

      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {CONVERSION_CONFIG.CONVERSION_BOOSTER.trustIndicators.map((indicator, index) => {
          const IconComponent = indicator.icon === 'TrendingUp' ? TrendingUp : 
                                indicator.icon === 'Zap' ? Zap : Clock;
          const colorClass = indicator.color === 'green' ? 'text-green-500' :
                           indicator.color === 'yellow' ? 'text-yellow-500' : 'text-blue-500';
          
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <IconComponent className={`h-5 w-5 ${colorClass}`} />
              <span className="text-xs text-muted-foreground">{indicator.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};