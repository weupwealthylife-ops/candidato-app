-- Add open_to_work column to candidates table for the "open to opportunities" status badge.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS open_to_work boolean NOT NULL DEFAULT true;
