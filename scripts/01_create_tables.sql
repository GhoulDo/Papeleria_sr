-- 01_create_tables.sql

-- Habilita extensiones necesarias
create extension if not exists "pgcrypto";

-- Tabla de Usuarios (extiende auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text,
  role text default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_email check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  )
);

-- Tabla de Categorías
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Productos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  detailed_description text,
  price numeric(10,2) not null check (price > 0),
  cost numeric(10,2) check (cost > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  image_url text,
  images jsonb default '[]'::jsonb,
  is_active boolean default true,
  is_featured boolean default false,
  rating numeric(3,2) default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de Promociones
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean default true,
  min_purchase_amount numeric(10,2),
  code text unique,
  usage_limit integer,
  usage_count integer default 0,
  applies_to text default 'all' check (applies_to in ('all', 'category', 'product')),
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint promotion_valid_dates check (end_date > start_date)
);

-- Relación promociones-productos
create table public.promotion_products (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (promotion_id, product_id)
);

-- Relación promociones-categorías
create table public.promotion_categories (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz default now(),
  unique (promotion_id, category_id)
);

-- Tabla de Órdenes
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  order_number text not null unique,
  status text default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled','refunded')),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  subtotal numeric(10,2) not null,
  tax_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  shipping_cost numeric(10,2) default 0,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null,
  shipping_country text not null,
  payment_method text,
  payment_status text default 'pending' check (payment_status in ('pending','completed','failed','refunded')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Items de orden
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price > 0),
  discount_applied numeric(10,2) default 0,
  subtotal numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Carritos
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Items de carrito
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  added_at timestamptz default now(),
  unique (cart_id, product_id)
);

-- Reseñas
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text,
  verified_purchase boolean default false,
  helpful_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (product_id, user_id)
);

-- Auditoría
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamptz default now()
);

-- Secuencias e índices
create sequence if not exists public.order_number_seq start 1000 increment 1;

create index idx_products_category_id on public.products(category_id);
create index idx_products_slug on public.products(slug);
create index idx_products_is_active on public.products(is_active);

create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);

create index idx_order_items_order_id on public.order_items(order_id);
create index idx_cart_items_cart_id on public.cart_items(cart_id);

create index idx_reviews_product_id on public.reviews(product_id);
create index idx_reviews_user_id on public.reviews(user_id);

create index idx_promotions_active on public.promotions(is_active, end_date);
create index idx_users_role on public.users(role);