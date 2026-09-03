-- Run this file after supabase/media.sql and supabase/users.sql.
-- Merchandise images reuse the public organization-media bucket. Product and
-- order access is still enforced by the policies below.

create table if not exists public.merchandise_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
    check (char_length(trim(name)) between 2 and 120),
  batch text not null default ''
    check (char_length(trim(batch)) <= 80),
  category text not null default 'Shirts'
    check (category in ('Shirts', 'Hoodies', 'Accessories', 'Other')),
  description text not null default '',
  price numeric(10, 2) not null default 0
    check (price >= 0),
  front_image_path text,
  back_image_path text,
  image_alt text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchandise_products_front_image_path_check
    check (
      front_image_path is null
      or (
        front_image_path <> ''
        and front_image_path !~ '[[:cntrl:]\\]'
        and front_image_path !~ '^/'
        and front_image_path !~* '^[a-z][a-z0-9+.-]*:'
      )
    ),
  constraint merchandise_products_back_image_path_check
    check (
      back_image_path is null
      or (
        back_image_path <> ''
        and back_image_path !~ '[[:cntrl:]\\]'
        and back_image_path !~ '^/'
        and back_image_path !~* '^[a-z][a-z0-9+.-]*:'
      )
    )
);

create table if not exists public.merchandise_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.merchandise_products(id)
    on delete cascade,
  size text not null
    check (char_length(trim(size)) between 1 and 16),
  stock integer not null default 0
    check (stock between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size)
);

create table if not exists public.merchandise_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null
    check (char_length(trim(customer_name)) between 2 and 120),
  customer_email text not null
    check (customer_email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  contact_number text not null
    check (char_length(trim(contact_number)) between 7 and 40),
  fulfillment_method text not null
    check (fulfillment_method in ('pickup', 'delivery')),
  payment_method text not null
    check (payment_method in ('cash_on_pickup', 'bank_transfer', 'e_wallet')),
  delivery_address text not null default '',
  notes text not null default ''
    check (char_length(notes) <= 500),
  subtotal numeric(10, 2) not null
    check (subtotal >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchandise_orders_delivery_address_check
    check (
      fulfillment_method = 'pickup'
      or char_length(trim(delivery_address)) between 8 and 300
    ),
  constraint merchandise_orders_delivery_payment_check
    check (
      fulfillment_method = 'pickup'
      or payment_method <> 'cash_on_pickup'
    )
);

create table if not exists public.merchandise_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.merchandise_orders(id)
    on delete cascade,
  product_id uuid references public.merchandise_products(id)
    on delete set null,
  variant_id uuid references public.merchandise_variants(id)
    on delete set null,
  product_name text not null,
  product_batch text not null default '',
  variant_size text not null,
  quantity integer not null
    check (quantity between 1 and 30),
  unit_price numeric(10, 2) not null
    check (unit_price >= 0),
  line_total numeric(10, 2) not null
    check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists merchandise_products_public_listing_idx
  on public.merchandise_products (status, is_featured desc, sort_order, created_at desc);

create index if not exists merchandise_products_batch_idx
  on public.merchandise_products (batch, status);

create index if not exists merchandise_variants_product_idx
  on public.merchandise_variants (product_id, size);

create index if not exists merchandise_orders_user_idx
  on public.merchandise_orders (user_id, created_at desc);

create index if not exists merchandise_orders_status_idx
  on public.merchandise_orders (status, created_at desc);

create index if not exists merchandise_order_items_order_idx
  on public.merchandise_order_items (order_id);

drop trigger if exists set_merchandise_products_updated_at
  on public.merchandise_products;
create trigger set_merchandise_products_updated_at
  before update on public.merchandise_products
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_merchandise_variants_updated_at
  on public.merchandise_variants;
create trigger set_merchandise_variants_updated_at
  before update on public.merchandise_variants
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_merchandise_orders_updated_at
  on public.merchandise_orders;
create trigger set_merchandise_orders_updated_at
  before update on public.merchandise_orders
  for each row execute procedure public.set_updated_at();

alter table public.merchandise_products enable row level security;
alter table public.merchandise_variants enable row level security;
alter table public.merchandise_orders enable row level security;
alter table public.merchandise_order_items enable row level security;

revoke all on table public.merchandise_products
  from public;
grant select on table public.merchandise_products
  to anon, authenticated;
grant insert, update, delete on table public.merchandise_products
  to authenticated;

revoke all on table public.merchandise_variants
  from public;
grant select on table public.merchandise_variants
  to anon, authenticated;
grant insert, update, delete on table public.merchandise_variants
  to authenticated;

revoke all on table public.merchandise_orders
  from public, anon;
grant select on table public.merchandise_orders
  to authenticated;

revoke all on table public.merchandise_order_items
  from public, anon;
grant select on table public.merchandise_order_items
  to authenticated;

drop policy if exists "Published and archived merchandise are public"
  on public.merchandise_products;
create policy "Published and archived merchandise are public"
on public.merchandise_products
for select
to anon, authenticated
using (status in ('published', 'archived'));

drop policy if exists "Staff can read all merchandise"
  on public.merchandise_products;
create policy "Staff can read all merchandise"
on public.merchandise_products
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Staff can create merchandise"
  on public.merchandise_products;
create policy "Staff can create merchandise"
on public.merchandise_products
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Staff can update merchandise"
  on public.merchandise_products;
create policy "Staff can update merchandise"
on public.merchandise_products
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Staff can delete merchandise"
  on public.merchandise_products;
create policy "Staff can delete merchandise"
on public.merchandise_products
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Available product variants are public"
  on public.merchandise_variants;
create policy "Available product variants are public"
on public.merchandise_variants
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.merchandise_products
    where merchandise_products.id = merchandise_variants.product_id
      and merchandise_products.status in ('published', 'archived')
  )
);

drop policy if exists "Staff can read all product variants"
  on public.merchandise_variants;
create policy "Staff can read all product variants"
on public.merchandise_variants
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Staff can create product variants"
  on public.merchandise_variants;
create policy "Staff can create product variants"
on public.merchandise_variants
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Staff can update product variants"
  on public.merchandise_variants;
create policy "Staff can update product variants"
on public.merchandise_variants
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Staff can delete product variants"
  on public.merchandise_variants;
create policy "Staff can delete product variants"
on public.merchandise_variants
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Members can read their merchandise orders"
  on public.merchandise_orders;
create policy "Members can read their merchandise orders"
on public.merchandise_orders
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Members can read their order items"
  on public.merchandise_order_items;
create policy "Members can read their order items"
on public.merchandise_order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.merchandise_orders
    where merchandise_orders.id = merchandise_order_items.order_id
      and (
        merchandise_orders.user_id = auth.uid()
        or public.current_user_role() in ('admin', 'editor')
      )
  )
);

drop function if exists public.create_merch_order(
  jsonb,
  text,
  text,
  text,
  text,
  text,
  text
);
create or replace function public.create_merch_order(
  target_items jsonb,
  target_customer_name text,
  target_contact_number text,
  target_fulfillment_method text,
  target_payment_method text,
  target_delivery_address text default '',
  target_notes text default ''
)
returns table (
  order_id uuid,
  order_number text,
  subtotal numeric,
  order_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item_record jsonb;
  target_variant_id uuid;
  selected_product_id uuid;
  selected_variant_id uuid;
  selected_product_name text;
  selected_product_batch text;
  selected_variant_size text;
  selected_price numeric(10, 2);
  selected_stock integer;
  item_quantity integer;
  total_quantity integer := 0;
  total_subtotal numeric(10, 2) := 0;
  created_order_id uuid;
  generated_order_number text;
  customer_email text;
  seen_variant_ids text[] := array[]::text[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  ) then
    raise exception 'Approved account required';
  end if;

  if target_items is null or jsonb_typeof(target_items) <> 'array' then
    raise exception 'Your cart is empty or too large';
  end if;

  if jsonb_array_length(target_items) = 0
    or jsonb_array_length(target_items) > 30
  then
    raise exception 'Your cart is empty or too large';
  end if;

  if char_length(trim(coalesce(target_customer_name, ''))) not between 2 and 120 then
    raise exception 'Enter a valid customer name';
  end if;

  if char_length(trim(coalesce(target_contact_number, ''))) not between 7 and 40 then
    raise exception 'Enter a valid contact number';
  end if;

  if target_fulfillment_method not in ('pickup', 'delivery') then
    raise exception 'Invalid fulfillment method';
  end if;

  if target_payment_method not in ('cash_on_pickup', 'bank_transfer', 'e_wallet') then
    raise exception 'Invalid payment method';
  end if;

  if target_fulfillment_method = 'delivery'
    and target_payment_method = 'cash_on_pickup'
  then
    raise exception 'Cash on pickup is not available for delivery';
  end if;

  if target_fulfillment_method = 'delivery'
    and char_length(trim(coalesce(target_delivery_address, ''))) not between 8 and 300
  then
    raise exception 'A delivery address is required';
  end if;

  if char_length(coalesce(target_notes, '')) > 500 then
    raise exception 'Order notes are too long';
  end if;

  customer_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if customer_email = '' then
    raise exception 'A verified account email is required';
  end if;

  -- Lock every requested variant before calculating the total. This makes
  -- simultaneous checkouts compete for the same stock instead of overselling.
  for item_record in select value from jsonb_array_elements(target_items)
  loop
    begin
      target_variant_id := (item_record ->> 'variant_id')::uuid;
      item_quantity := (item_record ->> 'quantity')::integer;
    exception when invalid_text_representation then
      raise exception 'Invalid merchandise item';
    end;

    if target_variant_id is null
      or item_quantity is null
      or item_quantity not between 1 and 10
    then
      raise exception 'Invalid merchandise quantity';
    end if;

    if target_variant_id::text = any(seen_variant_ids) then
      raise exception 'Duplicate merchandise item';
    end if;
    seen_variant_ids := array_append(seen_variant_ids, target_variant_id::text);

    select
      merchandise_variants.id,
      merchandise_products.id,
      merchandise_products.name,
      merchandise_products.batch,
      merchandise_variants.size,
      merchandise_products.price,
      merchandise_variants.stock
    into
      selected_variant_id,
      selected_product_id,
      selected_product_name,
      selected_product_batch,
      selected_variant_size,
      selected_price,
      selected_stock
    from public.merchandise_variants
    join public.merchandise_products
      on merchandise_products.id = merchandise_variants.product_id
    where merchandise_variants.id = target_variant_id
      and merchandise_products.status = 'published'
    for update of merchandise_variants;

    if not found then
      raise exception 'One merchandise item is no longer available';
    end if;

    if selected_stock < item_quantity then
      raise exception 'Not enough stock for % - %', selected_product_name, selected_variant_size;
    end if;

    total_quantity := total_quantity + item_quantity;
    if total_quantity > 30 then
      raise exception 'You can order up to 30 items at a time';
    end if;

    total_subtotal := total_subtotal + (selected_price * item_quantity);
  end loop;

  generated_order_number := 'MERCH-'
    || to_char(now() at time zone 'Asia/Manila', 'YYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.merchandise_orders (
    order_number,
    user_id,
    customer_name,
    customer_email,
    contact_number,
    fulfillment_method,
    payment_method,
    delivery_address,
    notes,
    subtotal,
    status
  )
  values (
    generated_order_number,
    auth.uid(),
    trim(target_customer_name),
    customer_email,
    trim(target_contact_number),
    target_fulfillment_method,
    target_payment_method,
    case
      when target_fulfillment_method = 'delivery'
      then trim(coalesce(target_delivery_address, ''))
      else ''
    end,
    trim(coalesce(target_notes, '')),
    total_subtotal,
    'pending'
  )
  returning id into created_order_id;

  for item_record in select value from jsonb_array_elements(target_items)
  loop
    target_variant_id := (item_record ->> 'variant_id')::uuid;
    item_quantity := (item_record ->> 'quantity')::integer;

    select
      merchandise_variants.id,
      merchandise_products.id,
      merchandise_products.name,
      merchandise_products.batch,
      merchandise_variants.size,
      merchandise_products.price
    into
      selected_variant_id,
      selected_product_id,
      selected_product_name,
      selected_product_batch,
      selected_variant_size,
      selected_price
    from public.merchandise_variants
    join public.merchandise_products
      on merchandise_products.id = merchandise_variants.product_id
    where merchandise_variants.id = target_variant_id
      and merchandise_products.status = 'published'
    for update of merchandise_variants;

    insert into public.merchandise_order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      product_batch,
      variant_size,
      quantity,
      unit_price,
      line_total
    )
    values (
      created_order_id,
      selected_product_id,
      selected_variant_id,
      selected_product_name,
      selected_product_batch,
      selected_variant_size,
      item_quantity,
      selected_price,
      selected_price * item_quantity
    );

    update public.merchandise_variants
    set stock = stock - item_quantity
    where id = selected_variant_id;
  end loop;

  return query
  select
    created_order_id,
    generated_order_number,
    total_subtotal,
    'pending'::text;
end;
$$;

drop function if exists public.admin_set_merch_order_status(uuid, text);
create or replace function public.admin_set_merch_order_status(
  target_order_id uuid,
  target_status text
)
returns public.merchandise_orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_order public.merchandise_orders;
  updated_order public.merchandise_orders;
begin
  if public.current_user_role() not in ('admin', 'editor') then
    raise exception 'Staff access required';
  end if;

  if target_status not in ('pending', 'confirmed', 'ready', 'completed', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select *
  into current_order
  from public.merchandise_orders
  where id = target_order_id
  for update;

  if current_order.id is null then
    raise exception 'Order not found';
  end if;

  if current_order.status = 'cancelled'
    and target_status <> 'cancelled'
  then
    raise exception 'Cancelled orders cannot be reopened';
  end if;

  if target_status = 'cancelled'
    and current_order.status <> 'cancelled'
  then
    update public.merchandise_variants as variants
    set stock = least(10000, variants.stock + items.quantity)
    from public.merchandise_order_items as items
    where items.order_id = current_order.id
      and items.variant_id = variants.id;
  end if;

  update public.merchandise_orders
  set status = target_status
  where id = target_order_id
  returning * into updated_order;

  return updated_order;
end;
$$;

revoke all on function public.create_merch_order(
  jsonb,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;
grant execute on function public.create_merch_order(
  jsonb,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

revoke all on function public.admin_set_merch_order_status(uuid, text)
  from public, anon;
grant execute on function public.admin_set_merch_order_status(uuid, text)
  to authenticated;
