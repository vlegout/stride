import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { isTokenValid } from "../utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, tokenExpiry } = useAuthStore((state) => ({
    token: state.token,
    tokenExpiry: state.tokenExpiry,
  }));

  if (!isTokenValid(token, tokenExpiry)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
