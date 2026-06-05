CREATE TABLE public.legacy_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  legacy_id text NOT NULL,
  new_id uuid NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legacy_ids_entity_legacy_unique UNIQUE (entity_type, legacy_id)
);

CREATE INDEX legacy_ids_new_id_idx ON public.legacy_ids (new_id);
CREATE INDEX legacy_ids_entity_type_idx ON public.legacy_ids (entity_type);

GRANT SELECT ON public.legacy_ids TO authenticated;
GRANT ALL ON public.legacy_ids TO service_role;

ALTER TABLE public.legacy_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY legacy_ids_select_privileged ON public.legacy_ids
  FOR SELECT TO authenticated USING (is_privileged());

CREATE OR REPLACE FUNCTION public.set_legacy_ids_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_legacy_ids_updated_at
  BEFORE UPDATE ON public.legacy_ids
  FOR EACH ROW EXECUTE FUNCTION public.set_legacy_ids_updated_at();