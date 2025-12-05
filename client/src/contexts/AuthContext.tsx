import { trpc } from "@/lib/trpc";
import { User } from "@shared/types";
import { createContext, useContext, useMemo } from "react";

interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();

  const isAuthenticated = useMemo(() => !!user, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      refetchUser: refetch,
    }),
    [user, isLoading, isAuthenticated, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
