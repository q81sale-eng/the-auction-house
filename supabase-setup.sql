-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS phone_otps (
  id         bigserial primary key,
  phone      text not null,
  otp        text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempts   smallint default 0,
  created_at timestamptz default now()
);

ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON phone_otps FOR ALL USING (true) WITH CHECK (true);
