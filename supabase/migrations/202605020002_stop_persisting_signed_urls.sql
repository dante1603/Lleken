update public.plant_media
set public_url = null
where public_url is not null;
