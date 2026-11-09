-- Made-up mandirs for the welcome-pack films, loaded into a local copy of
-- Toran only. Nothing here is a real mandir. "Shree Sample Mandir,
-- Anytown" is the same made-up mandir as the site's own /demo page.
insert into public.mandirs
  (slug, name, town, region, latitude, longitude, tradition, calendar,
   website, status, getting_there, facilities, visiting_note,
   opening_hours, aarti_times)
values
  ('shree-sample-mandir-anytown', 'Shree Sample Mandir', 'Anytown',
   'East Midlands', 52.6369, -1.1398, 'Pushtimarg', 'gujarati',
   'https://example.org', 'listed',
   'Free car park behind the hall. Five minutes'' walk from Anytown station.',
   '{step_free,chairs,parking,shoe_racks,food_served}',
   'Please cover your head in the inner mandir.',
   (select jsonb_agg(s) from (
      select jsonb_build_object('day', d, 'opens', '07:30', 'closes', '12:00') s from generate_series(1,7) d
      union all
      select jsonb_build_object('day', d, 'opens', '16:00', 'closes', '20:30') from generate_series(1,7) d) x),
   '[{"name":"Mangla aarti","time":"07:30"},{"name":"Shringar darshan","time":"09:30"},{"name":"Sandhya aarti","time":"19:00"}]'),
  ('sample-shiv-mandir-anytown', 'Sample Shiv Mandir', 'Anytown',
   'East Midlands', 52.6205, -1.1052, 'Shaivite', null,
   null, 'listed', null, '{parking}', null, null, null),
  ('sample-sanatan-mandir-othertown', 'Sample Sanatan Mandir', 'Othertown',
   'East Midlands', 52.6812, -1.1704, 'Sanatan', 'gujarati',
   null, 'listed', null, '{chairs}', null, null, null)
on conflict (slug) do nothing;
