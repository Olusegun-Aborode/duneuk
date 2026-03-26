-- EUR Stablecoins: SUPPLY OVER TIME
-- Daily supply snapshots per token (spellbook)
-- Returns: day, token, supply_eur, supply_usd

WITH daily AS (
    SELECT
        day,
        token_symbol AS token,
        SUM(balance) AS supply_eur
    FROM stablecoins_multichain.balances
    WHERE currency = 'EUR'
      AND day <= CURRENT_DATE - INTERVAL '2' DAY
    GROUP BY day, token_symbol
    HAVING SUM(balance) > 100
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
)

SELECT
    CAST(d.day AS VARCHAR) AS day,
    d.token,
    ROUND(d.supply_eur, 2) AS supply_eur,
    ROUND(d.supply_eur * r.rate, 2) AS supply_usd
FROM daily d
CROSS JOIN eur_usd r
WHERE d.supply_eur > 0
ORDER BY d.day DESC, d.token
