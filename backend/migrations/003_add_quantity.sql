-- Add quantity tracking to equipment table
-- Migration: 003_add_quantity.sql

-- Add quantity column (total units the owner has)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add rented_quantity column (currently rented units)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS rented_quantity INTEGER DEFAULT 0;

-- Add constraint to ensure rented_quantity doesn't exceed quantity
ALTER TABLE equipment ADD CONSTRAINT check_rented_quantity 
    CHECK (rented_quantity >= 0 AND rented_quantity <= quantity);

-- Update existing equipment to have quantity = 1
UPDATE equipment SET quantity = 1, rented_quantity = 0 WHERE quantity IS NULL;

-- Update is_available based on current active bookings
UPDATE equipment e 
SET rented_quantity = COALESCE((
    SELECT COUNT(*) 
    FROM bookings b 
    WHERE b.equipment_id = e.id 
    AND b.status IN ('active', 'approved')
), 0);

-- Update is_available flag based on quantity
UPDATE equipment 
SET is_available = (rented_quantity < quantity);

-- Create index for faster availability queries
CREATE INDEX IF NOT EXISTS idx_equipment_quantity ON equipment(quantity, rented_quantity);
