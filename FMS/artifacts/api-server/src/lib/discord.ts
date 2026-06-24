const DISCORD_API = "https://discord.com/api/v10";

export async function exchangeDiscordCode(code: string, redirectUri: string) {
  const resp = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Discord token exchange failed: ${resp.status} ${body}`);
  }
  return resp.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function getDiscordUser(accessToken: string) {
  const resp = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error("Failed to fetch Discord user");
  return resp.json() as Promise<{
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
  }>;
}

export async function getGuildMember(discordUserId: string): Promise<{ roles: string[] } | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken) return null;
  const resp = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!resp.ok) {
    // Log non-404 failures — rate limits etc. would silently grant RECRUIT otherwise
    if (resp.status !== 404) {
      console.warn(`getGuildMember: unexpected status ${resp.status} for user ${discordUserId}`);
    }
    return null;
  }
  return resp.json() as Promise<{ roles: string[] }>;
}

export type FmsRole = "SYSTEM.ADMIN" | "SUPERVISOR" | "OFFICER" | "RECRUIT";

export function mapRolesToFms(discordRoles: string[]): FmsRole {
  const adminId = process.env.DISCORD_ROLE_ADMIN_ID;
  const supervisorId = process.env.DISCORD_ROLE_SUPERVISOR_ID;
  const officerId = process.env.DISCORD_ROLE_OFFICER_ID;
  const recruitId = process.env.DISCORD_ROLE_RECRUIT_ID;

  if (adminId && discordRoles.includes(adminId)) return "SYSTEM.ADMIN";
  if (supervisorId && discordRoles.includes(supervisorId)) return "SUPERVISOR";
  if (officerId && discordRoles.includes(officerId)) return "OFFICER";
  if (recruitId && discordRoles.includes(recruitId)) return "RECRUIT";
  return "RECRUIT";
}

/**
 * Syncs a member's FMS role to Discord by removing all managed roles then
 * assigning the one matching `fmsRole`. Silently no-ops if env vars are missing.
 */
export async function syncDiscordRole(discordUserId: string, fmsRole: FmsRole): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken || !discordUserId) return;

  const roleMap: Partial<Record<FmsRole, string | undefined>> = {
    "SYSTEM.ADMIN": process.env.DISCORD_ROLE_ADMIN_ID,
    SUPERVISOR: process.env.DISCORD_ROLE_SUPERVISOR_ID,
    OFFICER: process.env.DISCORD_ROLE_OFFICER_ID,
    RECRUIT: process.env.DISCORD_ROLE_RECRUIT_ID,
  };

  const allRoleIds = Object.values(roleMap).filter(Boolean) as string[];
  const targetRoleId = roleMap[fmsRole];

  // Remove all managed roles first
  await Promise.all(
    allRoleIds.map((roleId) =>
      fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${botToken}` },
      }).catch((err) => console.warn(`syncDiscordRole: failed to remove role ${roleId}`, err)),
    ),
  );

  // Assign the target role
  if (targetRoleId) {
    const resp = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${targetRoleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${botToken}`, "Content-Length": "0" },
      },
    ).catch((err) => {
      console.warn(`syncDiscordRole: failed to assign role ${targetRoleId}`, err);
      return null;
    });
    if (resp && !resp.ok) {
      console.warn(`syncDiscordRole: PUT role returned ${resp.status} for user ${discordUserId}`);
    }
  }
}
