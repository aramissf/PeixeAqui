-- Row Level Security policies

-- ─── PROFILES ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (TRUE);  -- public profiles

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ─── FISHING SPOTS ────────────────────────────────────────────────────────────

ALTER TABLE public.fishing_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY spots_select ON public.fishing_spots
  FOR SELECT USING (status = 'active' AND is_public = TRUE);

CREATE POLICY spots_insert ON public.fishing_spots
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY spots_update ON public.fishing_spots
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Soft delete: owner sets status = 'deleted'
CREATE POLICY spots_delete ON public.fishing_spots
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (status = 'deleted');

-- ─── SPOT PHOTOS ──────────────────────────────────────────────────────────────

ALTER TABLE public.spot_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY photos_select ON public.spot_photos
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY photos_insert ON public.spot_photos
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY photos_update ON public.spot_photos
  FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid());

-- ─── SPOT REVIEWS ─────────────────────────────────────────────────────────────

ALTER TABLE public.spot_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select ON public.spot_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY reviews_insert ON public.spot_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_update ON public.spot_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY reviews_delete ON public.spot_reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── SPOT ROUTES ──────────────────────────────────────────────────────────────

ALTER TABLE public.spot_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY routes_select ON public.spot_routes
  FOR SELECT USING (TRUE);

CREATE POLICY routes_insert ON public.spot_routes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY routes_update ON public.spot_routes
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- ─── WEATHER/TIDE CACHE (read-only for clients) ───────────────────────────────

ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY weather_cache_select ON public.weather_cache
  FOR SELECT USING (TRUE);

-- Only Edge Functions (service role) can write cache
-- No INSERT/UPDATE policy for anon/authenticated

ALTER TABLE public.tide_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY tide_cache_select ON public.tide_cache
  FOR SELECT USING (TRUE);

-- ─── COLLECTIONS ──────────────────────────────────────────────────────────────

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_select ON public.collections
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY collections_insert ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY collections_update ON public.collections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY collections_delete ON public.collections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY collection_items_select ON public.collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id
        AND (c.user_id = auth.uid() OR c.is_public = TRUE)
    )
  );

CREATE POLICY collection_items_insert ON public.collection_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY collection_items_delete ON public.collection_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

-- ─── CATCH LOG ────────────────────────────────────────────────────────────────

ALTER TABLE public.catch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY catch_log_select ON public.catch_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY catch_log_insert ON public.catch_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY catch_log_update ON public.catch_log
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY catch_log_delete ON public.catch_log
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─── SPOT REPORTS ─────────────────────────────────────────────────────────────

ALTER TABLE public.spot_reports ENABLE ROW LEVEL SECURITY;

-- Users can submit reports but not see others'
CREATE POLICY reports_insert ON public.spot_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
