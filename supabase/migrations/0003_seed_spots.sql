-- Seed initial fishing spots from JSON file
-- This migration is idempotent: ON CONFLICT DO NOTHING

-- Run the seed script instead of hardcoding all spots here.
-- See: scripts/seed-spots.ts
-- Usage: npx ts-node scripts/seed-spots.ts

-- For CI/test environments, insert a minimal set of spots:
INSERT INTO public.fishing_spots (
  name, description, location, municipality, state,
  spot_type, environment, target_species, fishing_types,
  is_verified, status
) VALUES (
  'Ponto de Teste',
  'Ponto para testes automatizados',
  ST_SetSRID(ST_MakePoint(-43.1729, -22.9068), 4326)::geography,
  'Rio de Janeiro', 'RJ',
  'beach', 'saltwater',
  ARRAY['robalo', 'corvina'],
  ARRAY['shore', 'surf'],
  TRUE, 'active'
) ON CONFLICT DO NOTHING;
