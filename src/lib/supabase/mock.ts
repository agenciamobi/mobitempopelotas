export type SupabaseMockResult<T> = {
  data: T | null;
  error: null;
  skipped: true;
  reason: string;
};

export type SupabaseClientAdapter = {
  readonly mode: "mock";
  readonly isConfigured: boolean;
  readonly networkEnabled: false;
  execute<T = unknown>(operation: string): Promise<SupabaseMockResult<T>>;
};

type CreateMockSupabaseClientOptions = {
  isConfigured: boolean;
  reason: string;
};

export function createMockSupabaseClient({
  isConfigured,
  reason,
}: CreateMockSupabaseClientOptions): SupabaseClientAdapter {
  return Object.freeze({
    mode: "mock" as const,
    isConfigured,
    networkEnabled: false as const,
    async execute<T = unknown>(operation: string): Promise<SupabaseMockResult<T>> {
      return {
        data: null,
        error: null,
        skipped: true,
        reason: `${reason} Operação ignorada: ${operation}.`,
      };
    },
  });
}
