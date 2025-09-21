import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useCarPlay } from "./hooks/useCarPlay";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import SharedRoute from "./pages/SharedRoute";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import TestUserAdmin from "./pages/TestUserAdmin";
import Business from "./pages/Business";
import NotFound from "./pages/NotFound";
import ApiDocs from "./pages/ApiDocs";
import AdminDashboard from "./pages/AdminDashboard";
import DemoEnvironment from "./pages/DemoEnvironment";
import CaseStudies from "./pages/CaseStudies";
import SalesDeck from "./pages/SalesDeck";
import EnterpriseIntegrations from "./pages/EnterpriseIntegrations";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutter
      gcTime: 10 * 60 * 1000, // 10 minutter (tidligere cacheTime)
    },
  },
});

function App() {
  const { isConnected, isSupported } = useCarPlay();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/shared-route" element={<SharedRoute />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/business" element={<Business />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/demo" element={<DemoEnvironment />} />
                <Route path="/case-studies" element={<CaseStudies />} />
                <Route path="/sales-deck" element={<SalesDeck />} />
                <Route path="/integrations" element={<EnterpriseIntegrations />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/test-users" element={<TestUserAdmin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieBanner />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
