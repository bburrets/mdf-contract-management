-- Create contract-related tables for manual data entry
-- Story 1.3: Manual Contract Data Entry Form

-- Create styles table (referenced by contracts)
CREATE TABLE IF NOT EXISTS styles (
  style_number   TEXT PRIMARY KEY,
  item_number    TEXT NOT NULL,
  item_desc      TEXT NOT NULL,
  season         TEXT NOT NULL,
  business_line  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create custom types for contracts
DO $$ BEGIN
  CREATE TYPE scope_type AS ENUM ('Channel', 'AllStyle');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE channel AS ENUM ('Inline', 'Ecomm');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create MDF contracts table
CREATE TABLE IF NOT EXISTS mdf_contracts (
  mdf_id                 SERIAL PRIMARY KEY,
  style_number           TEXT NOT NULL REFERENCES styles(style_number),
  scope                  scope_type NOT NULL,
  customer               TEXT,
  total_committed_amount DECIMAL(14,2) NOT NULL CHECK (total_committed_amount > 0),
  contract_date          DATE NOT NULL,
  campaign_start_date    DATE,
  campaign_end_date      DATE,
  created_by             TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (campaign_end_date IS NULL OR campaign_start_date IS NULL OR campaign_end_date >= campaign_start_date)
);

-- Create contract drafts table for save/resume functionality
CREATE TABLE IF NOT EXISTS contract_drafts (
  draft_id          SERIAL PRIMARY KEY,
  user_id           TEXT NOT NULL,
  document_id       INTEGER,
  form_data         JSONB NOT NULL,
  style_suggestions JSONB,
  validation_errors JSONB,
  last_saved        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Create budget allocations table
CREATE TABLE IF NOT EXISTS allocations (
  allocation_id    SERIAL PRIMARY KEY,
  mdf_id           INTEGER NOT NULL REFERENCES mdf_contracts(mdf_id) ON DELETE CASCADE,
  channel_code     channel NOT NULL,
  allocated_amount DECIMAL(14,2) NOT NULL CHECK (allocated_amount >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mdf_id, channel_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_styles_item_number ON styles(item_number);
CREATE INDEX IF NOT EXISTS idx_styles_desc ON styles USING gin(to_tsvector('english', item_desc));
CREATE INDEX IF NOT EXISTS idx_styles_season ON styles(season);
CREATE INDEX IF NOT EXISTS idx_styles_business_line ON styles(business_line);

CREATE INDEX IF NOT EXISTS idx_mdf_contracts_style ON mdf_contracts(style_number);
CREATE INDEX IF NOT EXISTS idx_mdf_contracts_date ON mdf_contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_mdf_contracts_created_by ON mdf_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_mdf_contracts_scope ON mdf_contracts(scope);

CREATE INDEX IF NOT EXISTS idx_contract_drafts_user ON contract_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_last_saved ON contract_drafts(last_saved);

CREATE INDEX IF NOT EXISTS idx_allocations_mdf ON allocations(mdf_id);
CREATE INDEX IF NOT EXISTS idx_allocations_channel ON allocations(channel_code);

-- Insert sample styles data for development and testing
INSERT INTO styles (style_number, item_number, item_desc, season, business_line) VALUES
('STY001', 'ITM001', 'Classic Cotton T-Shirt', 'Spring 2024', 'Apparel'),
('STY002', 'ITM002', 'Denim Casual Jeans', 'Fall 2024', 'Apparel'),
('STY003', 'ITM003', 'Athletic Running Shoes', 'Summer 2024', 'Footwear'),
('STY004', 'ITM004', 'Winter Wool Sweater', 'Winter 2024', 'Apparel'),
('STY005', 'ITM005', 'Leather Work Boots', 'Fall 2024', 'Footwear'),
('STY006', 'ITM006', 'Cotton Polo Shirt', 'Spring 2024', 'Apparel'),
('STY007', 'ITM007', 'Canvas Sneakers', 'Summer 2024', 'Footwear'),
('STY008', 'ITM008', 'Fleece Hoodie', 'Winter 2024', 'Apparel'),
('STY009', 'ITM009', 'Dress Oxfords', 'Fall 2024', 'Footwear'),
('STY010', 'ITM010', 'Cargo Shorts', 'Summer 2024', 'Apparel')
ON CONFLICT (style_number) DO NOTHING;

-- Add table comments for documentation
COMMENT ON TABLE styles IS 'Product styles catalog for MDF contract reference';
COMMENT ON TABLE mdf_contracts IS 'Marketing Development Fund contracts';
COMMENT ON TABLE contract_drafts IS 'Work-in-progress contract forms for save/resume functionality';
COMMENT ON TABLE allocations IS 'Budget allocations from contracts across sales channels';

COMMENT ON COLUMN mdf_contracts.scope IS 'Contract scope: Channel (specific channel) or AllStyle (all channels)';
COMMENT ON COLUMN mdf_contracts.total_committed_amount IS 'Total budget committed in USD';
COMMENT ON COLUMN mdf_contracts.contract_date IS 'Contract effective date';
COMMENT ON COLUMN mdf_contracts.campaign_start_date IS 'Campaign period start date';
COMMENT ON COLUMN mdf_contracts.campaign_end_date IS 'Campaign period end date';

COMMENT ON COLUMN contract_drafts.form_data IS 'JSON data of partially completed form';
COMMENT ON COLUMN contract_drafts.style_suggestions IS 'JSON array of AI-suggested style matches';
COMMENT ON COLUMN contract_drafts.validation_errors IS 'JSON object of current validation errors';

COMMENT ON COLUMN allocations.channel_code IS 'Sales channel: Inline (physical stores) or Ecomm (e-commerce)';
COMMENT ON COLUMN allocations.allocated_amount IS 'Budget amount allocated to this channel in USD';