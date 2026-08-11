import { useEffect, useState } from "react";
import { authService } from "../services/auth.service";

export function useAuthSetup() {
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void authService.setupStatus()
        .then((result) => setNeedsSetup(result.needsSetup))
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { needsSetup };
}
