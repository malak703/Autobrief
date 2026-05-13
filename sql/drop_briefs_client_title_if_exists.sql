-- Optional: only if you previously added `client_title` and want to remove it.
-- The app no longer uses this column; the client headline lives in `summary` as `TITLE: …` prefix.

alter table public.briefs drop column if exists client_title;
