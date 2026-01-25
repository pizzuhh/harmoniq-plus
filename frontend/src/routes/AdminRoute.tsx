import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import type { JSX } from "react/jsx-dev-runtime";

export default function AdminRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user } = useAuth();

  if (!user || !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
