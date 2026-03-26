-- EUR Stablecoins: MARKET SHARE COMPARISON
-- EUR stablecoins vs USD stablecoins for context
-- Pattern from steakhouse dashboard (query 237367)
-- Returns: currency_group, symbol, total_supply, total_supply_usd

WITH eur_supply AS (
    SELECT
        token_symbol AS symbol,
        SUM(balance) AS total_supply
    FROM stablecoins_multichain.balances
    WHERE currency = 'EUR'
      AND day = (
          SELECT MAX(day) FROM stablecoins_multichain.balances
          WHERE currency = 'EUR' AND day <= CURRENT_DATE - INTERVAL '2' DAY
      )
    GROUP BY token_symbol
    HAVING SUM(balance) > 100
),

usd_supply AS (
    SELECT
        token_symbol AS symbol,
        SUM(balance) AS total_supply
    FROM stablecoins_multichain.balances
    WHERE currency = 'USD'
      AND token_symbol IN ('USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD')
      AND day = (
          SELECT MAX(day) FROM stablecoins_multichain.balances
          WHERE currency = 'USD' AND day <= CURRENT_DATE - INTERVAL '2' DAY
      )
    GROUP BY token_symbol
    HAVING SUM(balance) > 1000000
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
)

SELECT
    'EUR' AS currency_group,
    e.symbol,
    ROUND(e.total_supply, 2) AS total_supply,
    ROUND(e.total_supply * r.rate, 2) AS total_supply_usd
FROM eur_supply e
CROSS JOIN eur_usd r

UNION ALL

SELECT
    'USD' AS currency_group,
    u.symbol,
    ROUND(u.total_supply, 2) AS total_supply,
    ROUND(u.total_supply, 2) AS total_supply_usd  -- 1:1 for USD stables
FROM usd_supply u

ORDER BY total_supply_usd DESC
