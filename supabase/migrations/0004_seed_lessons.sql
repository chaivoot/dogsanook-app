-- ============================================================================
-- dogsanook-app · Seed the 10 games (our own names — no Susan Garrett IP)
-- ============================================================================

insert into public.lessons (id, slug, name_th, sort_order) values
  (1,  'human-touch',   'Human Touch',      1),
  (2,  'smart-choices', 'Smart Choices',    2),
  (3,  'safe-spot',     'Safe Spot',        3),
  (4,  'safe-house',    'Safe House',       4),
  (5,  'recall',        'Recall เด็กดื้อ',  5),
  (6,  'hand-target',   'Hand Target',      6),
  (7,  'oxy-spot',      'Oxy Spot',         7),
  (8,  'perch-work',    'Perch Work',       8),
  (9,  'hide-and-seek', 'Hide and Seek',    9),
  (10, 'happy-dog',     'หมาสนุก',          10)
on conflict (id) do update
  set slug = excluded.slug,
      name_th = excluded.name_th,
      sort_order = excluded.sort_order;
