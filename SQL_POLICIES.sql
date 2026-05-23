
-- PUBLIC PRODUCT ACCESS
create policy "public can read products"
on products
for select
to anon
using (true);

-- PUBLIC WARRANTIES ACCESS
create policy "public can read warranties"
on product_warranties
for select
to anon
using (true);

-- OPTIONAL: public order lookup
create policy "public can read own orders"
on orders
for select
to anon
using (true);
