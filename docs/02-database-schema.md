# 02 — Database Schema (Supabase / Postgres)

> Permanent chat history is intentionally **not** stored. Only the
> tables needed to support auth, uploaded notes, and study-guide PDFs
> are created.

## ER overview

```
profiles ─────┐
              │
              ├── uploaded_notes
              │
              └── generated_pdfs

subjects  (reference table, seeded once)
syllabi   (one row per semester)
```

## Tables

### `profiles`
Created automatically on first sign-in via a Postgres trigger on
`auth.users`.

| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| email | text | |
| full_name | text | nullable |
| avatar_url | text | nullable |
| current_semester | int 1-8 | nullable |
| created_at | timestamptz | default now() |

### `subjects`
Seeded once with the UVCE catalog.

| column | type | notes |
|---|---|---|
| id | text PK | e.g. `BCS401` |
| semester | int | 1-8 |
| code | text | |
| name | text | |
| syllabus_pdf_path | text | storage path in supabase |

### `uploaded_notes`
Tracks every PDF a user has uploaded so we can show it back / re-ingest.

| column | type | notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK → profiles.id | |
| semester | int | |
| subject_id | text FK → subjects.id | |
| doc_type | text | `notes` / `pyq` / `internal` |
| file_name | text | |
| storage_path | text | path in Supabase Storage |
| chunks_indexed | int | |
| created_at | timestamptz | |

### `generated_pdfs`
Tracks every study-guide PDF generated for a user.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | |
| subject_id | text FK → subjects.id | |
| session_id | text | current session id |
| file_name | text | always `Subject_Preparation_Guide.pdf` |
| storage_path | text | |
| size_bytes | int | |
| created_at | timestamptz | |

## Row-Level Security (RLS)

- `profiles`: users can SELECT/UPDATE only their own row.
- `uploaded_notes`: users can SELECT/INSERT/DELETE only their own rows.
- `generated_pdfs`: users can SELECT only their own rows.
- `subjects`: SELECT is public (no auth needed for catalog).

## Storage buckets

- `notes/` — user-uploaded PDFs, scoped to user folder.
- `pdfs/` — generated study guides, scoped to user folder.

Both buckets have RLS: only the owner can list / read their files.

## Initial migration

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  current_semester int check (current_semester between 1 and 8),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "self read" on profiles for select using (auth.uid() = id);
create policy "self write" on profiles for update using (auth.uid() = id);

-- subjects
create table subjects (
  id text primary key,
  semester int not null check (semester between 1 and 8),
  code text not null,
  name text not null,
  syllabus_pdf_path text
);
alter table subjects enable row level security;
create policy "public read" on subjects for select using (true);

-- uploaded_notes
create table uploaded_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  semester int not null,
  subject_id text references subjects(id),
  doc_type text check (doc_type in ('notes','pyq','internal')),
  file_name text not null,
  storage_path text not null,
  chunks_indexed int default 0,
  created_at timestamptz default now()
);
alter table uploaded_notes enable row level security;
create policy "self" on uploaded_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- generated_pdfs
create table generated_pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  subject_id text references subjects(id),
  session_id text,
  file_name text not null,
  storage_path text not null,
  size_bytes int,
  created_at timestamptz default now()
);
alter table generated_pdfs enable row level security;
create policy "self read" on generated_pdfs
  for select using (auth.uid() = user_id);
```
