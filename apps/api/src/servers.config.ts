export interface ServerConfig {
  id: string;
  name: string;
  providers: string[];
}

export const DEFAULT_SERVER_ID = 'auto';

export const SERVERS: ServerConfig[] = [
  { id: 'auto', name: 'Auto', providers: ['wajik', 'miruro', 'otakudesu', 'oploverz', 'bun'] },
  { id: 'lcl', name: 'lcl', providers: ['otakudesu'] },
  { id: 'local', name: 'SRI', providers: ['miruro'] },
  { id: 'oto', name: 'Oto (draft)', providers: ['otakudesu'] },
  { id: 'opl', name: 'Opl (draft)', providers: ['oploverz'] },
  { id: 'bun', name: 'Bun (draft)', providers: ['hianime'] },
];

export function resolveProviders(serverId?: string, preferred?: string): string[] {
  const cfg = SERVERS.find((s) => s.id === serverId?.toLowerCase()) ?? SERVERS[0];
  const chain = preferred ? [preferred, ...cfg.providers] : cfg.providers;
  return [...new Set(chain.map((s) => s.toLowerCase()))];
}
