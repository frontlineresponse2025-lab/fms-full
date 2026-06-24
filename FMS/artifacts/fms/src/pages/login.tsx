import { useEffect } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

const DISCORD_BLUE = "#5865F2";

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

export default function Login() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function handleDiscordLogin() {
    window.location.href = `${API_BASE}/auth/discord`;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-wider">
              FMS
              <span className="text-muted-foreground opacity-50 text-sm ml-2 font-mono">v1.0</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1 tracking-widest uppercase">
              Force Management System
            </p>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-8 space-y-6">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Authentication Required
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your Discord account to access the system. Your role will be determined by your Discord server roles.
            </p>
          </div>

          <Button
            onClick={handleDiscordLogin}
            className="w-full h-12 text-base font-semibold gap-3"
            style={{ backgroundColor: DISCORD_BLUE }}
          >
            <DiscordIcon />
            Login with Discord
          </Button>

          <p className="text-xs text-muted-foreground/50">
            Your Discord roles determine your access level within the FMS.
          </p>
        </div>

        <p className="text-xs text-muted-foreground font-mono opacity-40 tracking-widest uppercase">
          Restricted Access — Authorised Personnel Only
        </p>
      </div>
    </div>
  );
}
