import { Navigate, Outlet } from "react-router";
import { UserRole } from "../../../backend/src/constants/account-policy";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminRoute() {
  const role = useAuthStore((state) => state.user?.role);
  return role === UserRole.Admin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
