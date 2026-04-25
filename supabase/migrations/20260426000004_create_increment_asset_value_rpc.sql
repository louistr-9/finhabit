-- Add increment_asset_value RPC
create or replace function increment_asset_value(p_id uuid, p_amount numeric)
returns void as $$
begin
  update assets
  set value = value + p_amount, updated_at = now()
  where id = p_id;
end;
$$ language plpgsql;
