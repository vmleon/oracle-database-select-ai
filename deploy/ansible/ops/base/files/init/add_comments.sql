-- Add comments to SH schema tables for better Select AI context
COMMENT ON TABLE SH.CUSTOMERS IS 'Customer information including demographics, location, and credit limits';
COMMENT ON TABLE SH.COUNTRIES IS 'Country and region reference data';
COMMENT ON TABLE SH.SUPPLEMENTARY_DEMOGRAPHICS IS 'Additional customer demographic data including education, income, and household size';
COMMENT ON TABLE SH.PROFITS IS 'Profit data by channel, product, promotion, and time period';
COMMENT ON TABLE SH.PROMOTIONS IS 'Marketing promotion details including category, cost, and media type';
COMMENT ON TABLE SH.PRODUCTS IS 'Product catalog with categories, descriptions, and pricing';

EXIT;
