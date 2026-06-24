import "express-session";

declare module "express-session" {
  interface SessionData {
    user: {
      discordId: string;
      discordUsername: string;
      displayName: string;
      avatar: string | null;
      callsign: string;
      role: "SYSTEM.ADMIN" | "SUPERVISOR" | "OFFICER" | "RECRUIT";
      memberId: number | null;
    };
    /** CSRF state token for the Discord OAuth flow. Cleared after use. */
    oauthState?: string;
  }
}
