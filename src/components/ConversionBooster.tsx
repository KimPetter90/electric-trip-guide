import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Zap, TrendingUp } from 'lucide-react';

export const ConversionBooster: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(86400); // 24 timer
  const [userCount, setUserCount] = useState(127);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 86400);
      // Simuler økende brukerantall
      if (Math.random() > 0.9) {
        setUserCount(prev => prev + 1);
      }
    }, 1000);

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
      {/* Tidsbegrenset tilbud */}
      <Card className="p-4 border-red-500/50 bg-red-50/10 animate-pulse-neon">
        <div className="flex items-center gap-3 justify-center">
          <Clock className="h-5 w-5 text-red-500 animate-bounce" />
          <span className="font-bold text-red-500">
            TIDSBEGRENSET TILBUD UTLØPER OM: {formatTime(timeLeft)}
          </span>
        </div>
      </Card>

      {/* Sosial bevis */}
      <Card className="p-3 glass-card">
        <div className="flex items-center gap-3 justify-center text-sm">
          <Users className="h-4 w-4 text-green-500" />
          <span>{userCount} brukere har oppgradert denne måneden</span>
          <Badge variant="secondary" className="animate-pulse">
            +{Math.floor(Math.random() * 5) + 1} nå
          </Badge>
        </div>
      </Card>

      {/* Urgency indicators */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span className="text-xs text-muted-foreground">98% fornøyde kunder</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span className="text-xs text-muted-foreground">Kun 3 dager igjen</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock className="h-5 w-5 text-blue-500" />
          <span className="text-xs text-muted-foreground">Rask aktivering</span>
        </div>
      </div>
    </div>
  );
};