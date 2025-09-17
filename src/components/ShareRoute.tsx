import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Facebook, Twitter, MessageCircle, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RouteData {
  from: string;
  to: string;
  distance: string;
  duration: string;
  chargingCost: string;
  batteryUsed: string;
}

interface ShareRouteProps {
  routeData: RouteData;
  className?: string;
}

export function ShareRoute({ routeData, className }: ShareRouteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Create shareable URL with route data
  const createShareUrl = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      from: routeData.from,
      to: routeData.to,
      distance: routeData.distance,
      duration: routeData.duration,
      cost: routeData.chargingCost,
      battery: routeData.batteryUsed,
      shared: 'true'
    });
    return `${baseUrl}/shared-route?${params.toString()}`;
  };

  const shareUrl = createShareUrl();
  const shareText = `Sjekk ut min elbilrute fra ${routeData.from} til ${routeData.to}! 🚗⚡\n\n📍 Distanse: ${routeData.distance}\n⏱️ Tid: ${routeData.duration}\n💰 Ladekostnad: ${routeData.chargingCost}\n🔋 Batteribruk: ${routeData.batteryUsed}\n\nPlanlegg din elbilreise på ElRoute:`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "Kopiert!",
        description: "Rute-detaljer kopiert til utklippstavle",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Kunne ikke kopiere",
        description: "Prøv å velge teksten manuelt",
        variant: "destructive",
      });
    }
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateQRCode = () => {
    // Using QR Server API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Del rute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Del din elbilrute
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Route Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="font-semibold text-sm">
              {routeData.from} → {routeData.to}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{routeData.distance}</Badge>
              <Badge variant="secondary">{routeData.duration}</Badge>
              <Badge variant="outline">{routeData.chargingCost}</Badge>
            </div>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Del-lenke:</label>
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1 text-xs"
              />
              <Button size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Del på sosiale medier:</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareOnTwitter}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR-kode:
            </label>
            <div className="flex justify-center">
              <img 
                src={generateQRCode()} 
                alt="QR Code for route"
                className="border rounded-lg"
                width={150}
                height={150}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Skann for å åpne ruten på mobil
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={copyToClipboard}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Kopier alt
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}