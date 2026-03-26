-- EUR Stablecoins: DEX POOLS
-- Individual pool activity (last 30 days)
-- Returns: dex, blockchain, eur_token, pair_token, trade_count_30d, volume_usd_30d

WITH euro_addresses AS (
    SELECT * FROM (VALUES
        (0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c, 'EURC'),
        (0xC581b735A1688071A1746c968e0798D642EDE491, 'EURT'),
        (0xdB25f211ab05b1c97d595516f45794528a807ad8, 'EURS'),
        (0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8, 'EURA'),
        (0x3231cb76718cdef2155fc47b5286d82e6eda273f, 'EURe'),
        (0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2, 'EURCV'),
        (0x9d1a7a3191102e9f900faa10540837ba84dcbae7, 'EURI'),
        (0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42, 'EURC'),
        (0xC891EB4CbdEFf6e073e859e987815Ed1505c2ACD, 'EURC'),
        (0xAEC8318a9a59bAEb39861d10ff6C7f7bf1F96C57, 'EURA'),
        (0xcb444e90d8198415266c6a2724b7900fb12fc56e, 'EURe')
    ) AS t(address, symbol)
),

pool_trades AS (
    -- EUR token was bought
    SELECT
        d.project AS dex,
        d.blockchain,
        ea.symbol AS eur_token,
        COALESCE(ts.symbol, CAST(d.token_sold_address AS VARCHAR)) AS pair_token,
        d.amount_usd
    FROM dex.trades d
    INNER JOIN euro_addresses ea ON d.token_bought_address = ea.address
    LEFT JOIN tokens.erc20 ts ON d.token_sold_address = ts.contract_address
        AND d.blockchain = ts.blockchain
    WHERE d.block_date >= DATE_ADD('day', -30, CURRENT_DATE)
      AND d.amount_usd > 0

    UNION ALL

    -- EUR token was sold
    SELECT
        d.project AS dex,
        d.blockchain,
        ea.symbol AS eur_token,
        COALESCE(tb.symbol, CAST(d.token_bought_address AS VARCHAR)) AS pair_token,
        d.amount_usd
    FROM dex.trades d
    INNER JOIN euro_addresses ea ON d.token_sold_address = ea.address
    LEFT JOIN tokens.erc20 tb ON d.token_bought_address = tb.contract_address
        AND d.blockchain = tb.blockchain
    WHERE d.block_date >= DATE_ADD('day', -30, CURRENT_DATE)
      AND d.amount_usd > 0
)

SELECT
    dex,
    blockchain,
    eur_token,
    pair_token,
    COUNT(*) AS trade_count_30d,
    ROUND(SUM(amount_usd), 2) AS volume_usd_30d
FROM pool_trades
GROUP BY dex, blockchain, eur_token, pair_token
HAVING COUNT(*) >= 5
ORDER BY volume_usd_30d DESC
