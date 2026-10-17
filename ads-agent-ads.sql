-- Ads about the agent ("Meet the agent", "What's your home worth?") aren't tied
-- to a listing, so a promotion no longer requires a project.
-- Run once in the Supabase SQL editor.

ALTER TABLE ad_promotions ALTER COLUMN project_id DROP NOT NULL;
