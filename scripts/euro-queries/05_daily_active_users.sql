-- EUR Stablecoins: DAILY ACTIVE USERS
-- Unique addresses per day per token (last 180 days)
-- Uses erc20 decoded transfer tables
-- Returns: day, token, active_addresses

WITH euro_contracts AS (
    SELECT * FROM (VALUES
        ('ethereum', 'EURC',  0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c),
        ('ethereum', 'EURT',  0xC581b735A1688071A1746c968e0798D642EDE491),
        ('ethereum', 'EURS',  0xdB25f211ab05b1c97d595516f45794528a807ad8),
        ('ethereum', 'EURA',  0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8),
        ('ethereum', 'EURe',  0x3231cb76718cdef2155fc47b5286d82e6eda273f),
        ('ethereum', 'EURCV', 0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2),
        ('ethereum', 'EURI',  0x9d1a7a3191102e9f900faa10540837ba84dcbae7),
        ('base',     'EURC',  0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42),
        ('avalanche_c','EURC',0xC891EB4CbdEFf6e073e859e987815Ed1505c2ACD),
        ('polygon',  'EURA',  0xAEC8318a9a59bAEb39861d10ff6C7f7bf1F96C57),
        ('gnosis',   'EURe',  0xcb444e90d8198415266c6a2724b7900fb12fc56e)
    ) AS t(blockchain, token, contract_address)
),

daily_addrs AS (
    -- Ethereum senders + receivers
    SELECT CAST(t.evt_block_time AS DATE) AS day, ec.token, t."from" AS addr
    FROM euro_contracts ec
    INNER JOIN erc20_ethereum.evt_Transfer t ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'ethereum'
      AND t.evt_block_time >= CURRENT_TIMESTAMP - INTERVAL '180' DAY

    UNION ALL

    SELECT CAST(t.evt_block_time AS DATE) AS day, ec.token, t."to" AS addr
    FROM euro_contracts ec
    INNER JOIN erc20_ethereum.evt_Transfer t ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'ethereum'
      AND t.evt_block_time >= CURRENT_TIMESTAMP - INTERVAL '180' DAY

    UNION ALL

    -- Base
    SELECT CAST(t.evt_block_time AS DATE), ec.token, t."from"
    FROM euro_contracts ec
    INNER JOIN erc20_base.evt_Transfer t ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'base'
      AND t.evt_block_time >= CURRENT_TIMESTAMP - INTERVAL '180' DAY

    UNION ALL

    SELECT CAST(t.evt_block_time AS DATE), ec.token, t."to"
    FROM euro_contracts ec
    INNER JOIN erc20_base.evt_Transfer t ON t.contract_address = ec.contract_address
    WHERE ec.blockchain = 'base'
      AND t.evt_block_time >= CURRENT_TIMESTAMP - INTERVAL '180' DAY
)

SELECT
    CAST(day AS VARCHAR) AS day,
    token,
    COUNT(DISTINCT addr) AS active_addresses
FROM daily_addrs
WHERE addr != 0x0000000000000000000000000000000000000000
GROUP BY day, token
ORDER BY day DESC, token
