-- EUR Stablecoins: TOTAL MARKET OVERVIEW
-- Uses stablecoins_multichain.balances spellbook (same as rchen8 dashboard)
-- Returns: total_supply_eur, total_supply_usd, num_tokens, total_chain_deployments

WITH latest AS (
    SELECT
        token_symbol,
        blockchain,
        SUM(balance) AS supply_eur
    FROM stablecoins_multichain.balances
    WHERE currency = 'EUR'
      AND day = (
          SELECT MAX(day) FROM stablecoins_multichain.balances
          WHERE currency = 'EUR' AND day <= CURRENT_DATE - INTERVAL '2' DAY
      )
    GROUP BY token_symbol, blockchain
    HAVING SUM(balance) > 100  -- filter dust
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c  -- EURC
)

SELECT
    ROUND(SUM(l.supply_eur), 2) AS total_supply_eur,
    ROUND(SUM(l.supply_eur) * r.rate, 2) AS total_supply_usd,
    COUNT(DISTINCT l.token_symbol) AS num_tokens,
    COUNT(*) AS total_chain_deployments
FROM latest l
CROSS JOIN eur_usd r
