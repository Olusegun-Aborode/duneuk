-- EUR Stablecoins: TOP HOLDERS
-- Top 50 holders across all EUR stablecoins (Ethereum only for performance)
-- Uses erc20 transfer events to compute balances
-- Returns: blockchain, token, address, balance_eur, balance_usd, pct_of_supply

WITH euro_contracts AS (
    SELECT * FROM (VALUES
        ('EURC',  0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c, 6),
        ('EURT',  0xC581b735A1688071A1746c968e0798D642EDE491, 6),
        ('EURS',  0xdB25f211ab05b1c97d595516f45794528a807ad8, 2),
        ('EURA',  0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8, 18),
        ('EURCV', 0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2, 18),
        ('EURI',  0x9d1a7a3191102e9f900faa10540837ba84dcbae7, 18)
    ) AS t(token, contract_address, decimals)
),

-- Compute net balance per address from transfers
deltas AS (
    SELECT
        ec.token,
        t."to" AS address,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS delta
    FROM euro_contracts ec
    INNER JOIN erc20_ethereum.evt_Transfer t ON t.contract_address = ec.contract_address

    UNION ALL

    SELECT
        ec.token,
        t."from" AS address,
        -CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS delta
    FROM euro_contracts ec
    INNER JOIN erc20_ethereum.evt_Transfer t ON t.contract_address = ec.contract_address
),

balances AS (
    SELECT
        token,
        address,
        SUM(delta) AS balance_eur
    FROM deltas
    WHERE address != 0x0000000000000000000000000000000000000000
    GROUP BY token, address
    HAVING SUM(delta) > 1
),

total_supply AS (
    SELECT token, SUM(balance_eur) AS total
    FROM balances
    GROUP BY token
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
),

ranked AS (
    SELECT
        'ethereum' AS blockchain,
        b.token,
        CAST(b.address AS VARCHAR) AS address,
        b.balance_eur,
        b.balance_eur * r.rate AS balance_usd,
        b.balance_eur / NULLIF(ts.total, 0) * 100 AS pct_of_supply,
        ROW_NUMBER() OVER (ORDER BY b.balance_eur DESC) AS rn
    FROM balances b
    CROSS JOIN eur_usd r
    LEFT JOIN total_supply ts ON ts.token = b.token
)

SELECT
    blockchain,
    token,
    address,
    ROUND(balance_eur, 2) AS balance_eur,
    ROUND(balance_usd, 2) AS balance_usd,
    ROUND(pct_of_supply, 2) AS pct_of_supply
FROM ranked
WHERE rn <= 50
ORDER BY balance_eur DESC
