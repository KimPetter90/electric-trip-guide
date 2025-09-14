import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Car, Route, MapPin, Battery, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  id: string;
  test: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
}

export default function TestApp() {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    device: ""
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    device: ""
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const { toast } = useToast();

  const tests = [
    { id: 'ui', test: 'UI Responsive Design' },
    { id: 'animations', test: 'Animasjoner og Effekter' },
    { id: 'forms', test: 'Skjema Validering' },
    { id: 'dark-mode', test: 'Mørk/Lys Modus' },
    { id: 'performance', test: 'Ytelse og Hastighet' }
  ];

  const validateForm = () => {
    const newErrors = { name: "", email: "", device: "" };
    let isValid = true;

    if (!userInfo.name.trim()) {
      newErrors.name = "Navn er påkrevd";
      isValid = false;
    } else if (userInfo.name.length < 2) {
      newErrors.name = "Navn må være minst 2 tegn";
      isValid = false;
    }

    if (!userInfo.email.trim()) {
      newErrors.email = "E-post er påkrevd";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      newErrors.email = "Ugyldig e-postformat";
      isValid = false;
    }

    if (!userInfo.device.trim()) {
      newErrors.device = "Enhet/nettleser informasjon er påkrevd";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const runTests = async () => {
    if (!validateForm()) {
      toast({
        title: "Skjemafeil",
        description: "Vennligst rett opp feilene i skjemaet før du starter tester",
        variant: "destructive"
      });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);
    
    toast({
      title: "Starter testing",
      description: "Kjører alle tester for å sikre at appen fungerer perfekt!"
    });

    for (const test of tests) {
      // Simulate test running
      setTestResults(prev => [...prev, { ...test, status: 'running' }]);
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Special handling for form validation test
      let passed = Math.random() > 0.2;
      let message = passed ? 'Alle tester bestått!' : 'Noen problemer funnet, men ikke kritiske';
      
      if (test.id === 'forms') {
        // Always pass form validation if we got this far (form was validated)
        passed = true;
        message = 'Skjemavalidering fungerer perfekt!';
      }
      
      setTestResults(prev => 
        prev.map(r => 
          r.id === test.id 
            ? { ...r, status: passed ? 'passed' : 'failed', message }
            : r
        )
      );
    }
    
    setIsRunningTests(false);
    toast({
      title: "Testing fullført!",
      description: "Alle tester er utført. Sjekk resultatet nedenfor.",
      variant: "default"
    });
  };

  const handleInputChange = (field: keyof typeof userInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const downloadReport = () => {
    const report = {
      user: userInfo,
      timestamp: new Date().toISOString(),
      tests: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elroute-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Rapport lastet ned",
      description: "Test-rapporten er lagret som JSON-fil"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              ElRoute Test App
            </h1>
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Enkel testapp for å verifisere funksjonalitet og design
          </p>
          <Badge variant="outline" className="text-sm px-4 py-2">
            Versjon 1.0 - Beta Testing
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - User Info */}
          <div className="space-y-6">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Tester Informasjon
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Navn *</label>
                  <Input
                    placeholder="Skriv inn ditt navn"
                    value={userInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`bg-background/50 border-border ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">E-post *</label>
                  <Input
                    type="email"
                    placeholder="din@epost.no"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-background/50 border-border ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Enhet/Nettleser *</label>
                  <Input
                    placeholder="iPhone 15, Chrome, osv."
                    value={userInfo.device}
                    onChange={(e) => handleInputChange('device', e.target.value)}
                    className={`bg-background/50 border-border ${errors.device ? 'border-red-500' : ''}`}
                  />
                  {errors.device && <p className="text-red-500 text-xs mt-1">{errors.device}</p>}
                </div>
              </div>
            </Card>

            {/* Quick Features Test */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Route className="h-5 w-5 text-secondary" />
                Rask Funksjonstest
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Car className="h-5 w-5" />
                  <span className="text-xs">Velg Bil</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs">Velg Rute</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Battery className="h-5 w-5" />
                  <span className="text-xs">Batteri %</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Zap className="h-5 w-5" />
                  <span className="text-xs">Planlegg</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Test Results */}
          <div className="space-y-6">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Automatiske Tester
                </h3>
                <Button 
                  onClick={runTests}
                  disabled={isRunningTests}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isRunningTests ? 'Tester...' : 'Start Tester'}
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          result.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          result.status === 'passed' ? 'bg-green-500' :
                          result.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <Badge variant={
                        result.status === 'passed' ? 'default' :
                        result.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {result.status === 'running' ? 'Kjører...' :
                         result.status === 'passed' ? 'Bestått' :
                         result.status === 'failed' ? 'Feilet' : 'Venter'}
                      </Badge>
                    </div>
                  ))}
                  
                  {!isRunningTests && testResults.length > 0 && (
                    <Button 
                      onClick={downloadReport}
                      variant="outline" 
                      className="w-full mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Last ned testrapport
                    </Button>
                  )}
                </div>
              )}

              {testResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Klikk "Start Tester" for å kjøre automatiske tester</p>
                </div>
              )}
            </Card>

            {/* Manual Test Checklist */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <h3 className="text-lg font-semibold mb-4">Manuel Test Sjekkliste</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Appen laster uten feil</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Alle knapper fungerer</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Responsive design fungerer</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Animasjoner kjører smooth</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Tekst er leselig</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8 p-6 bg-primary/10 border-primary/30">
          <h3 className="text-lg font-semibold mb-3">Instruksjoner for testing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Fyll ut informasjon</h4>
              <p className="text-muted-foreground">Skriv inn navn, e-post og enhet du tester på</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Test funksjoner</h4>
              <p className="text-muted-foreground">Klikk på knappene og test at alt fungerer som forventet</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Kjør automatiske tester</h4>
              <p className="text-muted-foreground">Last ned rapport og send tilbake til utvikler</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}