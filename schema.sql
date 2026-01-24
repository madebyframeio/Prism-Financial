-- Create a dedicated table for New User Applications
create table new_applications (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references users(id) on delete cascade, -- Link to the core auth user
  first_name text,
  last_name text,
  email text,
  phone text,
  status text default 'pending' -- pending, approved, rejected
);

-- Enable Row Level Security (RLS) - Optional but recommended
alter table new_applications enable row level security;

-- Policy: Allow public to insert (since they are signing up)
-- OR if using anon key, ensure anon can insert.
create policy "Allow public insert" on new_applications for insert with check (true);

-- Policy: Allow admins to view all (you might need to adjust based on your admin auth setup)
create policy "Allow all view" on new_applications for select using (true);

-- Policy: Allow admins to update status
create policy "Allow all update" on new_applications for update using (true);
