-- EUR Stablecoins: SUPPLY LEADERBOARD
-- Ranked by market share using spellbook balances
-- Returns: token, issuer, num_chains, supply_eur, supply_usd, market_share_pct

WITH issuers AS (
    SELECT * FROM (VALUES
        ('EURC',  'Circle'),
        ('EURT',  'Tether'),
        ('EURS',  'Stasis'),
        ('EURA',  'Angle Protocol'),
        ('EURe',  'Monerium'),
        ('EURCV', 'SG-Forge'),
        ('EURI',  'Banking Circle'),
        ('EUROe', 'Membrane Finance'),
        ('EURQ',  'Quantoz'),
        ('EUROP', 'Schuman Financial'),
        ('EURR',  'StablR'),
        ('EURAU', 'AllUnity'),
        ('PAR',   'Mimo Protocol'),
        ('sEUR',  'Synthetix'),
        ('EURL',  'Lugh')
    ) AS t(symbol, issuer)
),

latest AS (
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
    HAVING SUM(balance) > 100
),

per_token AS (
    SELECT
        l.token_symbol AS token,
        COALESCE(i.issuer, 'Unknown') AS issuer,
        COUNT(DISTINCT l.blockchain) AS num_chains,
        SUM(l.supply_eur) AS supply_eur
    FROM latest l
    LEFT JOIN issuers i ON i.symbol = l.token_symbol
    GROUP BY l.token_symbol, i.issuer
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
),

total AS (
    SELECT SUM(supply_eur) AS total_supply FROM per_token
)

SELECT
    p.token,
    p.issuer,
    p.num_chains,
    ROUND(p.supply_eur, 2) AS supply_eur,
    ROUND(p.supply_eur * r.rate, 2) AS supply_usd,
    ROUND(p.supply_eur / NULLIF(t.total_supply, 0) * 100, 1) AS market_share_pct
FROM per_token p
CROSS JOIN eur_usd r
CROSS JOIN total t
ORDER BY p.supply_eur DESC
