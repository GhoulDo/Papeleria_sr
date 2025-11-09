-- 03_enable_rls_and_policies.sql

-- Helper para forzar RLS limpio
do $$
declare
  rec record;
begin
  for rec in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'users','categories','products','promotions','promotion_products','promotion_categories',
        'orders','order_items','carts','cart_items','reviews','audit_logs'
      )
  loop
    execute format('alter table %I.%I enable row level security;', rec.schemaname, rec.tablename);
  end loop;
end$$;

-- ================= USERS =================
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can update their own profile data" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Admins can manage all users" on public.users;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id or public.is_admin());

create policy "Admins can manage all users"
  on public.users for all
  using (public.is_admin());

-- ================= CATEGORIES =================
drop policy if exists "Public categories" on public.categories;
drop policy if exists "Admins manage categories" on public.categories;

create policy "Public categories"
  on public.categories for select
  using (is_active = true or public.is_admin());

create policy "Admins manage categories"
  on public.categories for all
  using (public.is_admin());

-- ================= PRODUCTS =================
drop policy if exists "Public products" on public.products;
drop policy if exists "Admins manage products" on public.products;

create policy "Public products"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Admins manage products"
  on public.products for all
  using (public.is_admin());

-- ================= PROMOTIONS =================
drop policy if exists "Public promotions" on public.promotions;
drop policy if exists "Admins manage promotions" on public.promotions;

create policy "Public promotions"
  on public.promotions for select
  using (
    is_active = true
    and now() between start_date and end_date
    or public.is_admin()
  );

create policy "Admins manage promotions"
  on public.promotions for all
  using (public.is_admin());

-- ================= PROMOTION RELATIONS =================
drop policy if exists "Public promotion products" on public.promotion_products;
drop policy if exists "Admins manage promotion products" on public.promotion_products;

create policy "Public promotion products"
  on public.promotion_products for select
  using (true);

create policy "Admins manage promotion products"
  on public.promotion_products for all
  using (public.is_admin());

drop policy if exists "Public promotion categories" on public.promotion_categories;
drop policy if exists "Admins manage promotion categories" on public.promotion_categories;

create policy "Public promotion categories"
  on public.promotion_categories for select
  using (true);

create policy "Admins manage promotion categories"
  on public.promotion_categories for all
  using (public.is_admin());

-- ================= ORDERS =================
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can create their orders" on public.orders;
drop policy if exists "Users can update their orders" on public.orders;
drop policy if exists "Admins manage orders" on public.orders;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can create their orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their orders"
  on public.orders for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin());

-- ================= ORDER ITEMS =================
drop policy if exists "Users can view their order items" on public.order_items;
drop policy if exists "Users can insert order items" on public.order_items;
drop policy if exists "Users can update order items" on public.order_items;
drop policy if exists "Users can delete order items" on public.order_items;

create policy "Users can view their order items"
  on public.order_items for select
  using (
    (select user_id from public.orders where id = order_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users can insert order items"
  on public.order_items for insert
  with check (
    (select user_id from public.orders where id = order_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users can update order items"
  on public.order_items for update
  using (
    (select user_id from public.orders where id = order_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users can delete order items"
  on public.order_items for delete
  using (
    (select user_id from public.orders where id = order_id) = auth.uid()
    or public.is_admin()
  );

-- ================= CARTS =================
drop policy if exists "Users read their carts" on public.carts;
drop policy if exists "Users insert their carts" on public.carts;
drop policy if exists "Users update their carts" on public.carts;

create policy "Users read their carts"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users insert their carts"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users update their carts"
  on public.carts for update
  using (auth.uid() = user_id);

-- ================= CART ITEMS =================
drop policy if exists "Users read their cart items" on public.cart_items;
drop policy if exists "Users insert cart items" on public.cart_items;
drop policy if exists "Users update cart items" on public.cart_items;
drop policy if exists "Users delete cart items" on public.cart_items;

create policy "Users read their cart items"
  on public.cart_items for select
  using (
    (select user_id from public.carts where id = cart_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users insert cart items"
  on public.cart_items for insert
  with check (
    (select user_id from public.carts where id = cart_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users update cart items"
  on public.cart_items for update
  using (
    (select user_id from public.carts where id = cart_id) = auth.uid()
    or public.is_admin()
  );

create policy "Users delete cart items"
  on public.cart_items for delete
  using (
    (select user_id from public.carts where id = cart_id) = auth.uid()
    or public.is_admin()
  );

-- ================= REVIEWS =================
drop policy if exists "Everyone can view reviews" on public.reviews;
drop policy if exists "Users can insert reviews" on public.reviews;
drop policy if exists "Users can update their reviews" on public.reviews;
drop policy if exists "Users can delete their reviews" on public.reviews;

create policy "Everyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ================= AUDIT LOGS =================
drop policy if exists "Admins can view audit logs" on public.audit_logs;

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());