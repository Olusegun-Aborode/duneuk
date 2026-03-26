-- EUR Stablecoins: TRANSFER VOLUME
-- All-time transfer stats per blockchain/token
-- Uses erc20 transfer events joined with stablecoin reference
-- Returns: blockchain, token, num_transfers, volume_eur, volume_usd, unique_senders, unique_receivers

WITH euro_contracts AS (
    SELECT * FROM (VALUES
        ('ethereum', 'EURC',  0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c, 6),
        ('ethereum', 'EURT',  0xC581b735A1688071A1746c968e0798D642EDE491, 6),
        ('ethereum', 'EURS',  0xdB25f211ab05b1c97d595516f45794528a807ad8, 2),
        ('ethereum', 'EURA',  0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8, 18),
        ('ethereum', 'EURe',  0x3231cb76718cdef2155fc47b5286d82e6eda273f, 18),
        ('ethereum', 'EURCV', 0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2, 18),
        ('ethereum', 'EURI',  0x9d1a7a3191102e9f900faa10540837ba84dcbae7, 18),
        ('ethereum', 'EURQ',  0x8dF723295214Ea6f21026eeEb4382d475f146F9f, 6),
        ('ethereum', 'EUROP', 0x888883b5F5D21fb10Dfeb70e8f9722B9FB0E5E51, 6),
        ('base',     'EURC',  0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42, 6),
        ('avalanche_c','EURC',0xC891EB4CbdEFf6e073e859e987815Ed1505c2ACD, 6),
        ('polygon',  'EURA',  0xAEC8318a9a59bAEb39861d10ff6C7f7bf1F96C57, 18),
        ('polygon',  'EURe',  0xE0aEa583266584DafBB3f9C3211d5588c73fEa8d, 18),
        ('gnosis',   'EURe',  0xcb444e90d8198415266c6a2724b7900fb12fc56e, 18)
    ) AS t(blockchain, token, contract_address, decimals)
),

transfers AS (
    SELECT
        ec.blockchain,
        ec.token,
        t."from" AS from_addr,
        t."to" AS to_addr,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS amount_eur
    FROM euro_contracts ec
    INNER JOIN erc20_ethereum.evt_Transfer t
        ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'ethereum'

    UNION ALL

    SELECT
        ec.blockchain,
        ec.token,
        t."from" AS from_addr,
        t."to" AS to_addr,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS amount_eur
    FROM euro_contracts ec
    INNER JOIN erc20_base.evt_Transfer t
        ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'base'

    UNION ALL

    SELECT
        ec.blockchain,
        ec.token,
        t."from" AS from_addr,
        t."to" AS to_addr,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS amount_eur
    FROM euro_contracts ec
    INNER JOIN erc20_avalanche_c.evt_Transfer t
        ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'avalanche_c'

    UNION ALL

    SELECT
        ec.blockchain,
        ec.token,
        t."from" AS from_addr,
        t."to" AS to_addr,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS amount_eur
    FROM euro_contracts ec
    INNER JOIN erc20_polygon.evt_Transfer t
        ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'polygon'

    UNION ALL

    SELECT
        ec.blockchain,
        ec.token,
        t."from" AS from_addr,
        t."to" AS to_addr,
        CAST(t.value AS DOUBLE) / POWER(10, ec.decimals) AS amount_eur
    FROM euro_contracts ec
    INNER JOIN erc20_gnosis.evt_Transfer t
        ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'gnosis'
),

eur_usd AS (
    SELECT price AS rate
    FROM prices.usd_latest
    WHERE blockchain = 'ethereum'
      AND contract_address = 0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c
)

SELECT
    t.blockchain,
    t.token,
    COUNT(*) AS num_transfers,
    ROUND(SUM(t.amount_eur), 2) AS volume_eur,
    ROUND(SUM(t.amount_eur) * r.rate, 2) AS volume_usd,
    COUNT(DISTINCT t.from_addr) AS unique_senders,
    COUNT(DISTINCT t.to_addr) AS unique_receivers
FROM transfers t
CROSS JOIN eur_usd r
GROUP BY t.blockchain, t.token, r.rate
ORDER BY volume_eur DESC
