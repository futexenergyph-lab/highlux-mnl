-- Registration details for members (Create account form): identity, contact and a
-- photo of a government ID. Server-only (service role): RLS on, no policies.
create table if not exists public.member_details (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  full_name         text not null,
  date_of_birth     date not null,
  nationality       text not null,
  address           text not null,
  phone             text not null,
  occupation        text not null,
  id_type           text not null,
  id_number         text not null,
  id_file_path      text,              -- path in the private member-ids bucket
  terms_accepted_at timestamptz not null,
  consent_at        timestamptz not null,
  created_at        timestamptz not null default now()
);
alter table public.member_details enable row level security;
revoke all on public.member_details from anon, authenticated;

-- Private bucket for ID photos (written by the server, viewed by staff via signed URLs).
insert into storage.buckets (id, name, public) values ('member-ids', 'member-ids', false)
on conflict (id) do nothing;
drop policy if exists "staff read member ids" on storage.objects;
create policy "staff read member ids" on storage.objects for select using (bucket_id = 'member-ids' and public.is_staff());
