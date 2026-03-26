-- EUR Stablecoins: CHAIN DISTRIBUTION
-- Supply breakdown by blockchain per token (spellbook)
-- Returns: blockchain, token, supply_eur, supply_usd, share_pct

WITH latest AS (
    SELECT
        blockchain,
        token_symbol AS token,
        SUM(balance) AS supply_eur
    FROM stablecoins_multichain.balances
    WHERE currency = 'EUR'
      AND day = (
          SELECT MAX(day) FROM stablecoins_multichain.balances
          WHERE currency = 'EUR' AND day <= CURRENT_DATE - INTERVAL '2' DAY
      )
    GROUP BY blockchain, token_symbol
    HAVING SUM(balance) > 100
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
),

total AS (
    SELECT SUM(supply_eur) AS total_supply FROM latest
)

SELECT
    l.blockchain,
    l.token,
    ROUND(l.supply_eur, 2) AS supply_eur,
    ROUND(l.supply_eur * r.rate, 2) AS supply_usd,
    ROUND(l.supply_eur / NULLIF(t.total_supply, 0) * 100, 1) AS share_pct
FROM latest l
CROSS JOIN eur_usd r
CROSS JOIN total t
ORDER BY supply_eur DESC
