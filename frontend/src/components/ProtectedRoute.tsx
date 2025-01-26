import { Navigate, Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { checkAuth } from "@/api/auth-api";

const ProtectedRoute = () => {
  const { data: isAuthenticated, isLoading, error } = useQuery({
    queryKey: ["checkAuth"],
    queryFn: checkAuth,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <div>Loading...</div>;

  if (error) return <Navigate to="/" replace />;

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
