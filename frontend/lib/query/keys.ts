// Centralized query key factory
// Keeps cache invalidation predictable and type-safe

export const queryKeys = {
  datasets: {
    all: ["datasets"] as const,
    list: () => [...queryKeys.datasets.all, "list"] as const,
    detail: (id: string) => [...queryKeys.datasets.all, id] as const,
    profile: (id: string) => [...queryKeys.datasets.all, id, "profile"] as const,
  },
  dataSources: {
    all: ["data-sources"] as const,
    list: () => [...queryKeys.dataSources.all, "list"] as const,
    detail: (id: string) => [...queryKeys.dataSources.all, id] as const,
  },
  dashboards: {
    all: ["dashboards"] as const,
    list: () => [...queryKeys.dashboards.all, "list"] as const,
    detail: (id: string) => [...queryKeys.dashboards.all, id] as const,
  },
  chat: {
    all: ["chat"] as const,
    conversation: (id: string) => [...queryKeys.chat.all, id] as const,
  },
  health: {
    all: ["health"] as const,
  },
} as const;
