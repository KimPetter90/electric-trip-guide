import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Battery, MapPin, TreePine, Cloud, User, CreditCard, LogIn, LogOut } from "lucide-react";

interface EnhancedHeaderProps {
  chargingStationsCount: number;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({ chargingStationsCount }) => {
  const { user, subscription, signOut, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
      <div className="flex-1 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Zap className="h-8 w-8 text-primary animate-pulse-neon" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gradient font-orbitron tracking-tight">
            EL-Route
          </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl animate-slide-in-left">
          Norges smarteste ruteplanlegger for elbiler - optimalisert for rekkevidde, kostnad og miljø
        </p>

        {/* Enhanced quick stats */}
        <div className="flex flex-wrap gap-4 mb-8 animate-slide-in-right">
          <Badge variant="secondary" className="glass-card hover-lift group">
            <Battery className="h-4 w-4 mr-2 group-hover:animate-pulse" />
            {chargingStationsCount} ladestasjoner
          </Badge>
          <Badge variant="secondary" className="glass-card hover-lift group">
            <MapPin className="h-4 w-4 mr-2 group-hover:animate-bounce-soft" />
            Hele Norge dekket
          </Badge>
          <Badge variant="secondary" className="glass-card hover-lift group">
            <TreePine className="h-4 w-4 mr-2 group-hover:animate-wiggle" />
            100% fornybar energi
          </Badge>
          <Badge variant="secondary" className="glass-card hover-lift group">
            <Cloud className="h-4 w-4 mr-2 group-hover:animate-float" />
            Væroptimalisert
          </Badge>
        </div>
      </div>

      {/* Enhanced Auth/User section */}
      <div className="flex flex-col items-end gap-4 shrink-0 animate-fade-in">
        {/* Premium Status Indicators */}
        {user && subscription && (
          <div className="flex flex-wrap gap-2 justify-end">
            {(subscription.subscribed || subscription.is_trial_active || subscription.subscription_status !== 'free') && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold animate-pulse">
                ⭐ {subscription.subscription_status.toUpperCase()}
                {subscription.is_trial_active && ` TRIAL (${subscription.days_left_in_trial} dager)`}
              </Badge>
            )}
            <Badge variant="outline" className="glass-card">
              {subscription.route_count}/{subscription.route_limit === -1 ? '∞' : subscription.route_limit} ruter
            </Badge>
          </div>
        )}

        {loading ? (
          <div className="loading-shimmer rounded-lg p-4 w-32 h-12" />
        ) : user ? (
          <div className="flex items-center gap-3 glass-card p-4 rounded-xl hover:backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.email}</span>
                {subscription?.subscribed && (
                  <StatusBadge status="online" size="sm" className="mt-1" />
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')} className="hover:bg-primary/10">
              <CreditCard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => navigate('/auth')} 
            variant="premium" 
            size="lg"
            className="font-orbitron font-bold animate-pulse-neon"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Logg inn
          </Button>
        )}
      </div>
    </div>
  );
};