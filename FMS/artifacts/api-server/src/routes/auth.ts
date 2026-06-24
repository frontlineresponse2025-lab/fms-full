import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, membersTable } from "@workspace/db";
import {
  exchangeDiscordCode,
  getDiscordUser,
  getGuildMember,
  mapRolesToFms,
} from "../lib/discord";

const router = Router();

const DISCORD_OAUTH_BASE = "https://discord.com/api/oauth2/authorize";
// Added 'guilds.members.read' is NOT needed — bot token handles guild lookup.
// 'identify' is sufficient for login; add 'email' here if you ever need it.
const SCOPES = "identify";

function getRedirectUri(req: import("express").Request): string {
  const envUri = process.env.DISCORD_REDIRECT_URI;
  if (envUri) return envUri;
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.headers["x-forwarded-host"] ?? req.get("host");
  return `${proto}://${host}/api/auth/discord/callback`;
}

function getFrontendUrl(): string {
  return process.env.ALLOWED_ORIGIN ?? "";
}

// GET /api/auth/discord — redirect to Discord OAuth
router.get("/auth/discord", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    res.status(503).send("Discord OAuth is not configured — set DISCORD_CLIENT_ID.");
    return;
  }

  // Generate a CSRF state token and store it in session
  const state = randomBytes(16).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: SCOPES,
    state,
  });

  req.session.save(() => {
    res.redirect(`${DISCORD_OAUTH_BASE}?${params}`);
  });
});

// GET /api/auth/discord/callback — handle Discord redirect
router.get("/auth/discord/callback", async (req, res) => {
  const { code, error, state } = req.query;
  const frontendUrl = getFrontendUrl();

  if (error || !code || typeof code !== "string") {
    res.redirect(`${frontendUrl}/?auth_error=denied`);
    return;
  }

  // Validate CSRF state
  const savedState = req.session.oauthState;
  delete req.session.oauthState;
  if (!savedState || savedState !== state) {
    res.redirect(`${frontendUrl}/?auth_error=state_mismatch`);
    return;
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokens = await exchangeDiscordCode(code, redirectUri);
    const discordUser = await getDiscordUser(tokens.access_token);

    const guildMember = await getGuildMember(discordUser.id);
    const fmsRole = guildMember ? mapRolesToFms(guildMember.roles) : "RECRUIT";

    const [member] = await db
      .select({ id: membersTable.id, callsign: membersTable.callsign })
      .from(membersTable)
      .where(eq(membersTable.discordId, discordUser.id))
      .limit(1);

    req.session.user = {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      displayName: discordUser.global_name ?? discordUser.username,
      avatar: discordUser.avatar,
      callsign: member?.callsign ?? discordUser.global_name ?? discordUser.username,
      role: fmsRole,
      memberId: member?.id ?? null,
    };

    req.session.save(() => {
      res.redirect(`${frontendUrl}/`);
    });
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.redirect(`${getFrontendUrl()}/?auth_error=oauth_failed`);
  }
});

// GET /api/auth/me — return current session user
router.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: req.session.user });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("fms.sid");
    res.json({ ok: true });
  });
});

export default router;
