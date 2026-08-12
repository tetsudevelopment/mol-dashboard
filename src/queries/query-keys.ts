export const queryKeys = {
  health: {
    live: ["health", "live"] as const,
    ready: ["health", "ready"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  admin: {
    stations: {
      all: ["admin", "stations"] as const,
      byId: (id: string) => ["admin", "stations", id] as const,
      state: (id: string) => ["admin", "stations", id, "state"] as const,
    },
    powerBanks: {
      all: ["admin", "power-banks"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "power-banks", "list", filters] as const,
      byId: (id: string) => ["admin", "power-banks", id] as const,
    },
    cabinetDevices: {
      all: ["admin", "cabinet-devices"] as const,
      ejectCommand: (deviceId: string, commandId: string) =>
        ["admin", "cabinet-devices", deviceId, "eject-commands", commandId] as const,
    },
    users: {
      all: ["admin", "users"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "users", "list", filters] as const,
      byId: (id: string) => ["admin", "users", id] as const,
    },
    payments: {
      all: ["admin", "payments"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "payments", "list", filters] as const,
      byId: (id: string) => ["admin", "payments", id] as const,
    },
    rentals: {
      all: ["admin", "rentals"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "rentals", "list", filters] as const,
      byId: (id: string) => ["admin", "rentals", id] as const,
    },
    audit: {
      all: ["admin", "audit"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "audit", "list", filters] as const,
    },
    advertisers: {
      all: ["admin", "advertisers"] as const,
    },
    notifications: {
      all: ["admin", "notifications"] as const,
    },
    campaigns: {
      all: ["admin", "campaigns"] as const,
      byId: (id: string) => ["admin", "campaigns", id] as const,
      ads: (id: string) => ["admin", "campaigns", id, "ads"] as const,
      stations: (id: string) => ["admin", "campaigns", id, "stations"] as const,
    },
    coupons: {
      all: ["admin", "coupons"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "coupons", "list", filters] as const,
    },
    policyAcceptances: {
      all: ["admin", "policy-acceptances"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "policy-acceptances", "list", filters] as const,
    },
  },
} as const;
