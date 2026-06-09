-- Add missing columns to the companies table required for profile and matching.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry        text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size            text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city            text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website         text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin        text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description     text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mission         text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS values          text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS looking_for_experience text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS looking_for_modality  text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS looking_for_areas     text[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS looking_for_skills    text[];
