-- =============================================================================
-- CASA BEVK — reference seed. SAFE TO RUN REPEATEDLY (fully idempotent).
-- =============================================================================
-- This file seeds ONLY reference data that does NOT require a real auth user or
-- a real household id:
--   * the canonical list of DEFAULT expense categories, kept in a function that
--     the app can call (per household) right after create_household().
--
-- It deliberately does NOT invent fake auth users or insert household-scoped
-- rows directly, because:
--   1. household-scoped rows need a REAL household id (created at runtime by the
--      create_household() RPC once the two real auth users exist), and
--   2. profiles are auto-created by the handle_new_user() trigger from auth.users.
--
-- A worked, COMMENTED example of seeding one real household is at the bottom —
-- replace the two UUIDs with the real auth.users ids and run it ONCE manually.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Reusable: seed the default expense categories for a given household.
-- Idempotent (ON CONFLICT on the (household_id, name, kind) unique key).
-- Call from the app right after create_household(), e.g.:
--     select public.create_household('Casa Bevk');   -- returns the household row
--     select public.seed_default_expense_categories('<household_id>');
-- SECURITY INVOKER: runs with the caller's rights, so RLS still applies and a
-- user can only seed a household they belong to.
-- -----------------------------------------------------------------------------
create or replace function public.seed_default_expense_categories(p_household_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.expense_categories (household_id, name, kind, icon, is_system, sort_order)
  values
    (p_household_id, 'Groceries',     'expense', 'shopping-cart', true, 10),
    (p_household_id, 'Utilities',     'expense', 'bolt',          true, 20),
    (p_household_id, 'Rent/Mortgage', 'expense', 'home',          true, 30),
    (p_household_id, 'Transport',     'expense', 'car',           true, 40),
    (p_household_id, 'Dining',        'expense', 'utensils',      true, 50),
    (p_household_id, 'Health',        'expense', 'heart',         true, 60),
    (p_household_id, 'Entertainment', 'expense', 'film',          true, 70),
    (p_household_id, 'Household',      'expense', 'box',           true, 80),
    (p_household_id, 'Income',        'income',  'wallet',        true, 90)
  on conflict (household_id, name, kind) do nothing;
end;
$$;

grant execute on function public.seed_default_expense_categories(uuid) to authenticated;


-- =============================================================================
-- COMMENTED WORKED EXAMPLE — seed one real household.
-- Run ONCE after BOTH real auth users exist (created via Supabase dashboard /
-- admin API; profiles are auto-created by the handle_new_user() trigger).
-- Replace the two UUIDs with the real auth.users ids, then uncomment & run.
-- All inserts are idempotent (ON CONFLICT) so a re-run is safe.
-- =============================================================================
--
-- do $$
-- declare
--   v_owner    uuid := '00000000-0000-0000-0000-000000000001';  -- <-- replace
--   v_partner  uuid := '00000000-0000-0000-0000-000000000002';  -- <-- replace
--   v_hh       uuid;
--   v_list     uuid;
--   v_shop     uuid;
--   v_cat_groc uuid;
--   v_cat_util uuid;
--   v_car      uuid;
-- begin
--   -- 1) Household + owner membership + settings, atomically.
--   --    (If running as the service role rather than as the owner, insert
--   --     directly instead of calling the RPC, since auth.uid() is null.)
--   insert into public.households (id, name, owner_id, timezone, currency)
--   values (gen_random_uuid(), 'Casa Bevk', v_owner, 'Europe/Ljubljana', 'EUR')
--   returning id into v_hh;
--
--   insert into public.household_members (household_id, user_id, role) values
--     (v_hh, v_owner,   'owner'),
--     (v_hh, v_partner, 'member')
--   on conflict (household_id, user_id) do nothing;
--
--   insert into public.household_settings (household_id, name, currency, locale, timezone, week_start)
--   values (v_hh, 'Casa Bevk', 'EUR', 'sl-SI', 'Europe/Ljubljana', 1)
--   on conflict (household_id) do nothing;
--
--   insert into public.user_settings (user_id) values (v_owner), (v_partner)
--   on conflict (user_id) do nothing;
--
--   -- 2) Default expense categories.
--   perform public.seed_default_expense_categories(v_hh);
--   select id into v_cat_groc from public.expense_categories where household_id = v_hh and name = 'Groceries' and kind = 'expense';
--   select id into v_cat_util from public.expense_categories where household_id = v_hh and name = 'Utilities' and kind = 'expense';
--
--   -- 3) Budgets (current month).
--   insert into public.budgets (household_id, category_id, period_month, amount, currency) values
--     (v_hh, v_cat_groc, date_trunc('month', current_date)::date, 400, 'EUR'),
--     (v_hh, v_cat_util, date_trunc('month', current_date)::date, 200, 'EUR')
--   on conflict (household_id, category_id, period_month) where category_id is not null do nothing;
--
--   -- 4) To-do list + tasks.
--   insert into public.todo_lists (household_id, name, created_by) values (v_hh, 'Home', v_owner)
--   returning id into v_list;
--   insert into public.tasks (household_id, list_id, title, assignee_id, priority, created_by) values
--     (v_hh, v_list, 'Water the plants',    v_partner, 'normal', v_owner),
--     (v_hh, v_list, 'Pay electricity bill', v_owner,  'high',   v_owner);
--
--   -- 5) Shopping list + items.
--   insert into public.shopping_lists (household_id, name, created_by) values (v_hh, 'Groceries', v_owner)
--   returning id into v_shop;
--   insert into public.shopping_items (household_id, list_id, name, quantity, unit, category, created_by) values
--     (v_hh, v_shop, 'Milk',   2, 'l',    'Dairy',   v_owner),
--     (v_hh, v_shop, 'Bread',  1, 'loaf', 'Bakery',  v_owner),
--     (v_hh, v_shop, 'Apples', 1, 'kg',   'Produce', v_owner);
--
--   -- 6) Notes: one shared, one personal.
--   insert into public.notes (household_id, owner_id, visibility, title, body, created_by) values
--     (v_hh, v_owner, 'shared',   'WiFi password',  'ask before changing', v_owner),
--     (v_hh, v_owner, 'personal', 'My private note','only I can see this', v_owner);
--
--   -- 7) Assets: a car + the apartment (typed attributes jsonb).
--   insert into public.assets (household_id, type, name, attributes, created_by)
--   values (v_hh, 'vehicle', 'Family Car',
--           '{"plate":"SLO-AB-123","vin":"WVWZZZ...","make":"VW","model":"Golf","year":2019}'::jsonb, v_owner)
--   returning id into v_car;
--   insert into public.assets (household_id, type, name, attributes, created_by) values
--     (v_hh, 'property', 'The Apartment',
--      '{"address":"Glavna ulica 1, Ljubljana","size_m2":72,"rooms":3}'::jsonb, v_owner);
--
--   -- 8) Maintenance log for the car (odometer + service date).
--   insert into public.maintenance_log (household_id, asset_id, title, performed_on, cost, vendor, odometer, created_by) values
--     (v_hh, v_car, 'Oil change', current_date - 30, 80.00, 'Local garage', 95000, v_owner);
--
--   -- 9) Providers (contracts): internet + mobile.
--   insert into public.providers (household_id, type, name, plan, monthly_cost, billing_cadence, renewal_date, account_number, created_by) values
--     (v_hh, 'internet', 'Telekom', 'Fiber 1Gbps', 35.00, 'monthly', (current_date + interval '6 months')::date, 'ACC-12345', v_owner),
--     (v_hh, 'mobile',   'A1',      'Unlimited',   18.00, 'monthly', (current_date + interval '3 months')::date, 'SIM-67890', v_owner);
--
--   -- 10) Recurring payment (subscription).
--   insert into public.recurring_payments (household_id, name, provider, amount, cadence, next_due_on, category_id, created_by) values
--     (v_hh, 'Netflix', 'Netflix', 13.99, 'monthly',
--      (date_trunc('month', current_date) + interval '1 month')::date, null, v_owner);
--
--   -- 11) A calendar event with a per-user reminder.
--   with e as (
--     insert into public.calendar_events (household_id, title, starts_at, ends_at, created_by)
--     values (v_hh, 'Dinner with friends', now() + interval '2 days', now() + interval '2 days 3 hours', v_owner)
--     returning id
--   )
--   insert into public.event_reminders (household_id, event_id, user_id, minutes_before, method)
--   select v_hh, e.id, v_owner, 60, 'push' from e
--   on conflict do nothing;
-- end $$;
-- =============================================================================
-- END SEED
-- =============================================================================
