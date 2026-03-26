-- EUR Stablecoins: LENDING UTILIZATION
-- Lending protocol supply/borrow for EUR tokens (last 90 days)
-- Returns: blockchain, project, token, supply_usd, borrow_usd, event_count, suppliers, borrowers, utilization_rate

WITH euro_addresses AS (
    SELECT * FROM (VALUES
        (0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c, 'EURC'),
        (0xC581b735A1688071A1746c968e0798D642EDE491, 'EURT'),
        (0xdB25f211ab05b1c97d595516f45794528a807ad8, 'EURS'),
        (0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8, 'EURA'),
        (0x3231cb76718cdef2155fc47b5286d82e6eda273f, 'EURe'),
        (0x5F7827FDeb7c20b443265Fc2F40845B715385Ff2, 'EURCV'),
        (0x9d1a7a3191102e9f900faa10540837ba84dcbae7, 'EURI')
    ) AS t(address, symbol)
),

supply_data AS (
    SELECT
        s.blockchain,
        s.project,
        ea.symbol AS token,
        SUM(s.amount_usd) AS supply_usd,
        COUNT(*) AS event_count,
        COUNT(DISTINCT s.depositor) AS suppliers
    FROM lending.supply s
    INNER JOIN euro_addresses ea ON s.token_address = ea.address
    WHERE s.block_time >= CURRENT_TIMESTAMP - INTERVAL '90' DAY
    GROUP BY s.blockchain, s.project, ea.symbol
),

borrow_data AS (
    SELECT
        b.blockchain,
        b.project,
        ea.symbol AS token,
        SUM(b.amount_usd) AS borrow_usd,
        COUNT(DISTINCT b.borrower) AS borrowers
    FROM lending.borrow b
    INNER JOIN euro_addresses ea ON b.token_address = ea.address
    WHERE b.block_time >= CURRENT_TIMESTAMP - INTERVAL '90' DAY
    GROUP BY b.blockchain, b.project, ea.symbol
)

SELECT
    COALESCE(s.blockchain, b.blockchain) AS blockchain,
    COALESCE(s.project, b.project) AS project,
    COALESCE(s.token, b.token) AS token,
    COALESCE(ROUND(s.supply_usd, 2), 0) AS supply_usd,
    COALESCE(ROUND(b.borrow_usd, 2), 0) AS borrow_usd,
    COALESCE(s.event_count, 0) AS event_count,
    COALESCE(s.suppliers, 0) AS suppliers,
    COALESCE(b.borrowers, 0) AS borrowers,
    CASE
        WHEN COALESCE(s.supply_usd, 0) > 0
        THEN ROUND(COALESCE(b.borrow_usd, 0) / s.supply_usd * 100, 1)
        ELSE 0
    END AS utilization_rate
FROM supply_data s
FULL OUTER JOIN borrow_data b
    ON s.blockchain = b.blockchain
    AND s.project = b.project
    AND s.token = b.token
ORDER BY supply_usd DESC
