-- Add photo_url column to candidates table for profile photo upload feature.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url text;
