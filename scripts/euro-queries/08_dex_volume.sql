-- EUR Stablecoins: DEX VOLUME
-- Weekly DEX trading volume per token/dex/chain
-- Pattern from steakhouse dashboard (queries 620661, 433436)
-- Returns: week, token, dex, blockchain, trade_count, volume_usd

WITH euro_addresses AS (
    SELECT * FROM (VALUES
        (0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c, 'EURC'),
        (0xC581b735A1688071A1746c968e0798D642EDE491, 'EURT'),
        (0xdB25f211ab05b1c97d595516f45794528a807ad8, 'EURS'),
        (0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8, 'EURA'),
        (0x3231cb76718cdef2155fc47b5286d82e6eda273f, 'EURe'),
        (0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2, 'EURCV'),
        (0x9d1a7a3191102e9f900faa10540837ba84dcbae7, 'EURI'),
        (0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42, 'EURC'),   -- Base
        (0xC891EB4CbdEFf6e073e859e987815Ed1505c2ACD, 'EURC'),   -- Avalanche
        (0xAEC8318a9a59bAEb39861d10ff6C7f7bf1F96C57, 'EURA'),   -- Polygon
        (0xcb444e90d8198415266c6a2724b7900fb12fc56e, 'EURe')    -- Gnosis
    ) AS t(address, symbol)
),

-- Both sides of trades (buy + sell)
trades AS (
    SELECT
        DATE_TRUNC('week', d.block_date) AS week,
        ea.symbol AS token,
        d.project AS dex,
        d.blockchain,
        d.amount_usd
    FROM dex.trades d
    INNER JOIN euro_addresses ea ON d.token_bought_address = ea.address
    WHERE d.block_date >= DATE_ADD('month', -6, CURRENT_DATE)
      AND d.amount_usd > 0

    UNION ALL

    SELECT
        DATE_TRUNC('week', d.block_date) AS week,
        ea.symbol AS token,
        d.project AS dex,
        d.blockchain,
        d.amount_usd
    FROM dex.trades d
    INNER JOIN euro_addresses ea ON d.token_sold_address = ea.address
    WHERE d.block_date >= DATE_ADD('month', -6, CURRENT_DATE)
      AND d.amount_usd > 0
)

SELECT
    week,
    token,
    dex,
    blockchain,
    COUNT(*) AS trade_count,
    ROUND(SUM(amount_usd), 2) AS volume_usd
FROM trades
GROUP BY week, token, dex, blockchain
HAVING COUNT(*) > 0
ORDER BY week DESC, volume_usd DESC
