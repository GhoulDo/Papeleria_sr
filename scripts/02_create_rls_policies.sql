-- 02_create_functions.sql

-- Función para detectar admins sin recursión en RLS
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  role_value text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role into role_value
  from public.users
  where id = auth.uid();

  return role_value = 'admin';
exception
  when others then
    return false;
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Función para actualizar columna updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trigger generador de carrito al registrar usuario
create or replace function public.create_user_cart()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.carts (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Generador de número de orden
create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

-- Auditoría de cambios
create or replace function public.log_audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (admin_id, action, table_name, record_id, changes)
  values (
    coalesce(auth.uid(), new.id, old.id),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$;

-- Triggers updated_at
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.update_updated_at_column();

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.update_updated_at_column();

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();

create trigger trg_promotions_updated_at
before update on public.promotions
for each row execute function public.update_updated_at_column();

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.update_updated_at_column();

create trigger trg_carts_updated_at
before update on public.carts
for each row execute function public.update_updated_at_column();

create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.update_updated_at_column();

-- Trigger crear carrito
create trigger trg_create_cart_on_user_signup
after insert on public.users
for each row execute function public.create_user_cart();

-- Triggers auditoría en tablas críticas
create trigger trg_audit_products
after insert or update or delete on public.products
for each row execute function public.log_audit_changes();

create trigger trg_audit_promotions
after insert or update or delete on public.promotions
for each row execute function public.log_audit_changes();

create trigger trg_audit_orders
after insert or update or delete on public.orders
for each row execute function public.log_audit_changes();