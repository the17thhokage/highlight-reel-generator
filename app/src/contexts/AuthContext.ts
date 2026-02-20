import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthContextType = {
  session: Session | null;
  hasProfile: boolean;
  setHasProfile: (v: boolean) => void;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  hasProfile: false,
  setHasProfile: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
