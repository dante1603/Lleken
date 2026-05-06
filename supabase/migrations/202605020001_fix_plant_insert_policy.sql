drop policy if exists plants_insert_owner on public.plants;

create policy plants_insert_owner on public.plants
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (
    plants.garden_id is null
    or exists (
      select 1
      from public.garden_members gm
      where gm.garden_id = plants.garden_id
        and gm.user_id = (select auth.uid())
        and gm.role in ('owner', 'caregiver')
    )
  )
);
