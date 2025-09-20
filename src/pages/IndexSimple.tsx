import { useAdminRole } from "@/hooks/useAdminRole";
import ComingSoon from "@/components/ComingSoon";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function IndexSimple() {
  // ALL HOOKS FIRST
  useAnalytics();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <ComingSoon />;
  }

  // Admin content
  return (
    <div className="min-h-screen bg-gradient-hero p-8">
      <h1 className="text-4xl font-orbitron font-black text-gradient mb-8">
        ElRoute Admin Dashboard
      </h1>
      <p className="text-white text-xl">
        Velkommen tilbake! Du har admin-tilgang til ElRoute.
      </p>
    </div>
  );
}