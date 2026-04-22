ALTER TABLE public.taxi_services ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.taxi_services ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.taxi_services ADD COLUMN IF NOT EXISTS button_text text;
ALTER TABLE public.taxi_services ADD COLUMN IF NOT EXISTS button_link text;