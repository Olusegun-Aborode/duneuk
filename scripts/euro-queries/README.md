# EUR Stablecoin Dune Queries

12 SQL queries tracking the full EUR stablecoin ecosystem (15+ tokens across multiple chains).

## Data Sources

- **Supply data**: `stablecoins_multichain.balances` (Dune spellbook — same source as rchen8 and steakhouse dashboards)
- **Transfer data**: `erc20_{chain}.evt_Transfer` (decoded ERC-20 events)
- **DEX data**: `dex.trades` (Dune spellbook)
- **Lending data**: `lending.supply`, `lending.borrow` (Dune spellbook)
- **Prices**: `prices.usd_latest`

## Tokens Tracked

| Token | Issuer | Collateral | Ethereum Address |
|-------|--------|------------|-----------------|
| EURC | Circle | Fiat | `0x1aBaEA1f...b1bC33c` |
| EURT | Tether | Fiat | `0xC581b735...42EDE491` |
| EURS | Stasis | Fiat | `0xdB25f211...a807ad8` |
| EURA | Angle Protocol | Crypto | `0x1a7e4e63...fCBce8` |
| EURe | Monerium | Fiat | `0x3231cb76...da273f` |
| EURCV | SG-Forge | Fiat | `0x5F7827FD...85Ff2` |
| EURI | Banking Circle | Fiat | `0x9d1a7a31...bae7` |
| EURQ | Quantoz | Fiat | `0x8dF72329...6F9f` |
| EUROP | Schuman | Fiat | `0x888883b5...5Ac1` |
| EURR | StablR | Fiat | `0x50753CfA...408` |
| EURAU | AllUnity | Fiat | `0x4933a85b...c2` |
| PAR | Mimo Protocol | Crypto | `0x68037790...703` |
| sEUR | Synthetix | Crypto | `0xd71ecff9...279d` |
| EUROe | Membrane Finance | Fiat | `0x820802fa...974` |
| EURL | Lugh | Fiat | `0xA967Dd94...515` |

> Note: EURT discontinued Nov 2025. sEUR deprecated. Historical data still tracked.

## Setup Instructions

1. Go to [dune.com](https://dune.com) → Log in → **New Query**
2. Paste SQL from each file, name it, click Run, note the query ID
3. Update `src/lib/constants.ts` `EURO_QUERY_IDS` with the 12 IDs

## Query List

| # | File | Dune Name | Key Tables |
|---|------|-----------|------------|
| 1 | `01_market_overview.sql` | EUR - Market Overview | `stablecoins_multichain.balances` |
| 2 | `02_supply_leaderboard.sql` | EUR - Supply Leaderboard | `stablecoins_multichain.balances` |
| 3 | `03_supply_over_time.sql` | EUR - Supply Over Time | `stablecoins_multichain.balances` |
| 4 | `04_transfer_volume.sql` | EUR - Transfer Volume | `erc20_{chain}.evt_Transfer` |
| 5 | `05_daily_active_users.sql` | EUR - Daily Active Users | `erc20_{chain}.evt_Transfer` |
| 6 | `06_chain_distribution.sql` | EUR - Chain Distribution | `stablecoins_multichain.balances` |
| 7 | `07_top_holders.sql` | EUR - Top Holders | `erc20_ethereum.evt_Transfer` |
| 8 | `08_dex_volume.sql` | EUR - DEX Volume | `dex.trades` |
| 9 | `09_dex_platforms.sql` | EUR - DEX Platforms | `dex.trades` |
| 10 | `10_dex_pools.sql` | EUR - DEX Pools | `dex.trades`, `tokens.erc20` |
| 11 | `11_lending.sql` | EUR - Lending | `lending.supply`, `lending.borrow` |
| 12 | `12_market_share.sql` | EUR - Market Share | `stablecoins_multichain.balances` |

## Reference Dashboards

These existing dashboards were studied for correct patterns:
- [steakhouse/Euro-stablecoins](https://dune.com/steakhouse/Euro-stablecoins) — ERC-20 transfer-based supply, DEX market share
- [rchen8/euro-stablecoin](https://dune.com/rchen8/euro-stablecoin) — spellbook balances approach
- [staedter/euro-stablecoin-overview](https://dune.com/staedter/euro-stablecoin-overview) — materialized datasets, holder growth
- [staedter/euro-stablecoin-defi](https://dune.com/staedter/euro-stablecoin-defi) — Morpho lending markets
- [Marcov/euro-stablecoins](https://dune.com/Marcov/euro-stablecoins) — supply by chain, M1 comparison
