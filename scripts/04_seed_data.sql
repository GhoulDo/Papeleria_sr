-- 04_seed_data.sql  (opcional)

insert into public.categories (name, slug, description, is_active) values
  ('Cuadernos y Libretas', 'cuadernos-libretas', 'Cuadernos de todas las tallas y estilos', true),
  ('Bolígrafos y Lápices', 'boligrafos-lapices', 'Instrumentos de escritura de calidad', true),
  ('Papel y Cartulinas', 'papel-cartulinas', 'Papeles de diversos tipos y gramajes', true),
  ('Gomas y Adhesivos', 'gomas-adhesivos', 'Pegamentos, gomas y cintas adhesivas', true),
  ('Carpetas y Archivadores', 'carpetas-archivadores', 'Organizadores de documentos', true),
  ('Marcadores y Resaltadores', 'marcadores-resaltadores', 'Marcadores de colores variados', true)
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, description, price, cost, stock_quantity, sku,
  is_active, is_featured, rating
) values
  ((select id from public.categories where slug = 'cuadernos-libretas'),
    'Cuaderno A4 100 hojas', 'cuaderno-a4-100', 'Cuaderno de alta calidad 100 hojas rayadas', 12.50, 5.00, 150, 'CUA001', true, true, 4.5),
  ((select id from public.categories where slug = 'cuadernos-libretas'),
    'Cuaderno Espiral A5', 'cuaderno-espiral-a5', 'Cuaderno espiral tamaño A5 80 hojas', 8.99, 3.50, 200, 'CUA002', true, false, 4.3),
  ((select id from public.categories where slug = 'boligrafos-lapices'),
    'Bolígrafo Azul x12', 'boligrafo-azul-x12', 'Paquete de 12 bolígrafos azul de gel', 15.00, 6.00, 300, 'BOL001', true, true, 4.7),
  ((select id from public.categories where slug = 'boligrafos-lapices'),
    'Lápiz HB x24', 'lapiz-hb-x24', 'Caja de 24 lápices HB', 18.50, 7.50, 250, 'LAP001', true, false, 4.4),
  ((select id from public.categories where slug = 'papel-cartulinas'),
    'Resma Papel A4 500h', 'resma-papel-a4', 'Resma de papel blanco 75g x 500 hojas', 25.00, 12.00, 100, 'PAP001', true, true, 4.6),
  ((select id from public.categories where slug = 'papel-cartulinas'),
    'Cartulina Colores Mix', 'cartulina-colores', 'Pack de cartulinas de colores variados', 22.00, 10.00, 80, 'CAR001', true, false, 4.2),
  ((select id from public.categories where slug = 'gomas-adhesivos'),
    'Goma Adhesiva x2', 'goma-adhesiva-x2', 'Pack de 2 gomas adhesivas 40g', 5.50, 2.00, 500, 'GOM001', true, false, 4.5),
  ((select id from public.categories where slug = 'marcadores-resaltadores'),
    'Marcadores Fluorescentes x6', 'marcadores-fluorescentes', 'Set de 6 marcadores fluorescentes de colores', 12.99, 5.00, 200, 'MAR001', true, true, 4.4)
on conflict (slug) do nothing;

insert into public.promotions (
  name, description, discount_type, discount_value,
  start_date, end_date, is_active, applies_to, min_purchase_amount, code, usage_limit
) values (
  'Descuento de Apertura',
  'Descuento del 15% en toda la tienda para clientes nuevos',
  'percentage',
  15,
  now(),
  now() + interval '30 days',
  true,
  'all',
  50.00,
  'BIENVENIDA15',
  100
) on conflict (code) do nothing;