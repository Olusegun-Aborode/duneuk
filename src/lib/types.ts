export interface MarketOverview {
  total_supply_gbp: number;
  total_supply_usd: number;
  num_tokens: number;
  total_chain_deployments: number;
}

export interface LeaderboardEntry {
  token: string;
  issuer: string;
  num_chains: number;
  supply_gbp: number;
  supply_usd: number;
  market_share_pct: number;
}

export interface SupplyHistoryEntry {
  day: string;
  token: string;
  supply_gbp: number;
  supply_usd: number;
}

export interface TransferVolumeEntry {
  blockchain: string;
  token: string;
  num_transfers: number;
  volume_gbp: number;
  volume_usd: number;
  unique_senders: number;
  unique_receivers: number;
}

export interface DailyActiveUsersEntry {
  day: string;
  token: string;
  active_addresses: number;
}

export interface ChainDistributionEntry {
  blockchain: string;
  token: string;
  supply_gbp: number;
  supply_usd: number;
  share_pct: number;
}

export interface TopHolderEntry {
  blockchain: string;
  token: string;
  address: string;
  balance_gbp: number;
  balance_usd: number;
  pct_of_supply: number;
}

export interface DexVolumeEntry {
  week: string;
  token: string;
  dex: string;
  blockchain: string;
  trade_count: number;
  volume_usd: number;
}

export interface DexPlatformEntry {
  dex: string;
  trade_count: number;
  volume_usd: number;
  unique_traders: number;
}

export interface MarketShareEntry {
  currency_group: string;
  symbol: string;
  total_supply: number;
  total_supply_usd: number;
}

export interface LendingUtilizationEntry {
  project: string;
  blockchain: string;
  token: string;
  supply_usd: number;
  borrow_usd: number;
  event_count: number;
  suppliers: number;
  borrowers: number;
  utilization_rate: number;
}

export interface DexPoolEntry {
  dex: string;
  blockchain: string;
  gbp_token: string;
  pair_token: string;
  trade_count_30d: number;
  volume_usd_30d: number;
}

export interface DuneApiResponse<T> {
  data: T[];
  lastUpdated: string;
}
