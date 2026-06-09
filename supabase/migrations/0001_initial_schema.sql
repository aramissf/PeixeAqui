-- PeixeAqui: Initial database schema
-- PostgreSQL + PostGIS

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username             TEXT UNIQUE NOT NULL,
  display_name         TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  city                 TEXT,
  state                TEXT CHECK (state IN (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
    'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  )),
  preferred_modalities TEXT[] DEFAULT '{}',
  is_pro_member        BOOLEAN NOT NULL DEFAULT FALSE,
  pro_expires_at       TIMESTAMPTZ,
  total_spots_added    INT NOT NULL DEFAULT 0,
  total_photos_added   INT NOT NULL DEFAULT 0,
  reputation_points    INT NOT NULL DEFAULT 0,
  level                INT NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── FISHING SPOTS ────────────────────────────────────────────────────────────

CREATE TABLE public.fishing_spots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,

  -- PostGIS geography point (WGS84 - supports ST_Distance in meters directly)
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  municipality    TEXT,
  state           TEXT,
  country         TEXT NOT NULL DEFAULT 'BR',
  access_notes    TEXT,

  spot_type       TEXT NOT NULL CHECK (spot_type IN (
    'beach', 'river', 'lake', 'reservoir', 'mangrove', 'rocky_shore',
    'estuary', 'pier', 'boat_ramp', 'offshore', 'waterfall', 'dam'
  )),
  environment     TEXT NOT NULL CHECK (environment IN (
    'saltwater', 'freshwater', 'brackish'
  )),
  water_body_name TEXT,

  fishing_types   TEXT[] NOT NULL DEFAULT '{}',
  target_species  TEXT[] NOT NULL DEFAULT '{}',
  best_seasons    TEXT[] NOT NULL DEFAULT '{}',
  best_tides      TEXT[] NOT NULL DEFAULT '{}',
  best_time_of_day TEXT[] NOT NULL DEFAULT '{}',
  depth_min_m     NUMERIC(6,1),
  depth_max_m     NUMERIC(6,1),
  bottom_type     TEXT[],

  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_ratings   INT NOT NULL DEFAULT 0,
  total_photos    INT NOT NULL DEFAULT 0,
  total_visits    INT NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'pending', 'rejected', 'deleted'
  )),
  reported_count  INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fishing_spots_updated_at
  BEFORE UPDATE ON public.fishing_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Critical: spatial index for map viewport queries
CREATE INDEX fishing_spots_location_gist
  ON public.fishing_spots USING GIST (location);

-- Composite for type-filtered map queries (WHERE status = 'active' is most common)
CREATE INDEX fishing_spots_status_type
  ON public.fishing_spots (status, spot_type)
  WHERE status = 'active';

-- Full-text search on name
CREATE INDEX fishing_spots_name_trgm
  ON public.fishing_spots USING GIN (name gin_trgm_ops);

-- Array search on species
CREATE INDEX fishing_spots_species_gin
  ON public.fishing_spots USING GIN (target_species);

-- ─── SPOT PHOTOS ──────────────────────────────────────────────────────────────

CREATE TABLE public.spot_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id      UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  thumb_path   TEXT,
  caption      TEXT,
  width_px     INT,
  height_px    INT,
  file_size_kb INT,
  taken_at     TIMESTAMPTZ,
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved  BOOLEAN NOT NULL DEFAULT TRUE,
  likes_count  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX spot_photos_spot_id ON public.spot_photos (spot_id);
CREATE INDEX spot_photos_featured ON public.spot_photos (spot_id, is_featured)
  WHERE is_featured = TRUE;

-- ─── SPOT REVIEWS ─────────────────────────────────────────────────────────────

CREATE TABLE public.spot_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id             UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title               TEXT,
  body                TEXT,
  visit_date          DATE,
  fishes_caught       TEXT[],
  bait_used           TEXT,
  technique           TEXT,
  tide_condition      TEXT,
  weather_description TEXT,
  helpful_count       INT NOT NULL DEFAULT 0,
  is_verified_visit   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (spot_id, user_id)
);

CREATE TRIGGER spot_reviews_updated_at
  BEFORE UPDATE ON public.spot_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX spot_reviews_spot_id ON public.spot_reviews (spot_id, created_at DESC);

-- Trigger to keep avg_rating and total_ratings denormalized on fishing_spots
CREATE OR REPLACE FUNCTION refresh_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.fishing_spots
  SET
    avg_rating    = sub.avg,
    total_ratings = sub.cnt,
    updated_at    = NOW()
  FROM (
    SELECT AVG(rating)::NUMERIC(3,2) AS avg, COUNT(*) AS cnt
    FROM public.spot_reviews
    WHERE spot_id = COALESCE(NEW.spot_id, OLD.spot_id)
  ) sub
  WHERE id = COALESCE(NEW.spot_id, OLD.spot_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER spot_reviews_rating_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.spot_reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_spot_rating();

-- ─── SPOT ROUTES ──────────────────────────────────────────────────────────────

CREATE TABLE public.spot_routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id          UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name             TEXT NOT NULL DEFAULT 'Rota principal',
  description      TEXT,
  route_type       TEXT CHECK (route_type IN ('driving', 'walking', 'boat', '4x4')),
  track            GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance_km      NUMERIC(8,2),
  duration_min     INT,
  difficulty       TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard', '4x4_only')),
  gpx_storage_path TEXT,
  waypoints        JSONB NOT NULL DEFAULT '[]',
  warnings         TEXT[],
  total_downloads  INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX spot_routes_spot_id ON public.spot_routes (spot_id);
CREATE INDEX spot_routes_track_gist ON public.spot_routes USING GIST (track);

-- ─── WEATHER CACHE ────────────────────────────────────────────────────────────

CREATE TABLE public.weather_cache (
  lat_grid    NUMERIC(5,2)  NOT NULL,
  lng_grid    NUMERIC(5,2)  NOT NULL,
  data_type   TEXT          NOT NULL CHECK (data_type IN (
    'current', 'hourly_24h', 'daily_7d', 'marine'
  )),
  payload     JSONB         NOT NULL,
  fetched_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ   NOT NULL,
  PRIMARY KEY (lat_grid, lng_grid, data_type)
);

CREATE INDEX weather_cache_expiry ON public.weather_cache (expires_at);

-- ─── TIDE CACHE ───────────────────────────────────────────────────────────────

CREATE TABLE public.tide_cache (
  lat_grid    NUMERIC(5,3) NOT NULL,
  lng_grid    NUMERIC(5,3) NOT NULL,
  date_from   DATE         NOT NULL,
  date_to     DATE         NOT NULL,
  extremes    JSONB        NOT NULL,
  heights     JSONB,
  fetched_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lat_grid, lng_grid, date_from)
);

-- ─── COLLECTIONS ──────────────────────────────────────────────────────────────

CREATE TABLE public.collections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'Favoritos',
  description    TEXT,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  is_public      BOOLEAN NOT NULL DEFAULT FALSE,
  cover_photo_id UUID REFERENCES public.spot_photos(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  spot_id       UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  PRIMARY KEY (collection_id, spot_id)
);

CREATE INDEX collection_items_spot ON public.collection_items (spot_id);

-- ─── CATCH LOG ────────────────────────────────────────────────────────────────

CREATE TABLE public.catch_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id       UUID REFERENCES public.fishing_spots(id) ON DELETE SET NULL,
  species       TEXT NOT NULL,
  weight_kg     NUMERIC(6,3),
  length_cm     NUMERIC(5,1),
  caught_at     TIMESTAMPTZ NOT NULL,
  released      BOOLEAN NOT NULL DEFAULT FALSE,
  photo_id      UUID REFERENCES public.spot_photos(id) ON DELETE SET NULL,
  bait          TEXT,
  technique     TEXT,
  notes         TEXT,
  solunar_score INT CHECK (solunar_score BETWEEN 0 AND 100),
  moon_phase    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX catch_log_user_id ON public.catch_log (user_id, caught_at DESC);
CREATE INDEX catch_log_spot_id ON public.catch_log (spot_id) WHERE spot_id IS NOT NULL;

-- ─── SPOT REPORTS ─────────────────────────────────────────────────────────────

CREATE TABLE public.spot_reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id    UUID NOT NULL REFERENCES public.fishing_spots(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason     TEXT NOT NULL,
  details    TEXT,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POSTGIS HELPER FUNCTIONS ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION spots_in_viewport(
  min_lng     FLOAT,
  min_lat     FLOAT,
  max_lng     FLOAT,
  max_lat     FLOAT,
  spot_types  TEXT[]   DEFAULT NULL,
  environments TEXT[]  DEFAULT NULL,
  species     TEXT[]   DEFAULT NULL,
  limit_n     INT      DEFAULT 500
)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  spot_type   TEXT,
  avg_rating  NUMERIC,
  total_ratings INT,
  lng         FLOAT,
  lat         FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    s.id,
    s.name,
    s.spot_type,
    s.avg_rating,
    s.total_ratings,
    ST_X(s.location::geometry) AS lng,
    ST_Y(s.location::geometry) AS lat
  FROM public.fishing_spots s
  WHERE s.status = 'active'
    AND s.is_public = TRUE
    AND s.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (spot_types  IS NULL OR s.spot_type = ANY(spot_types))
    AND (environments IS NULL OR s.environment = ANY(environments))
    AND (species     IS NULL OR s.target_species && species)
  ORDER BY s.avg_rating DESC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION spots_nearby(
  lng       FLOAT,
  lat       FLOAT,
  radius_m  FLOAT DEFAULT 50000,
  limit_n   INT   DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  spot_type       TEXT,
  environment     TEXT,
  municipality    TEXT,
  state           TEXT,
  avg_rating      NUMERIC,
  total_ratings   INT,
  total_photos    INT,
  target_species  TEXT[],
  is_verified     BOOLEAN,
  dist_m          FLOAT,
  spot_lng        FLOAT,
  spot_lat        FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    s.id,
    s.name,
    s.spot_type,
    s.environment,
    s.municipality,
    s.state,
    s.avg_rating,
    s.total_ratings,
    s.total_photos,
    s.target_species,
    s.is_verified,
    ST_Distance(s.location, ST_Point(lng, lat)::geography) AS dist_m,
    ST_X(s.location::geometry) AS spot_lng,
    ST_Y(s.location::geometry) AS spot_lat
  FROM public.fishing_spots s
  WHERE s.status = 'active'
    AND s.is_public = TRUE
    AND ST_DWithin(s.location, ST_Point(lng, lat)::geography, radius_m)
  ORDER BY dist_m
  LIMIT limit_n;
$$;
