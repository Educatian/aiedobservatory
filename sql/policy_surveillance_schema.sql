create table if not exists source_registry (
  id text primary key,
  jurisdiction_id text not null,
  jurisdiction_type text not null,
  agency_name text not null,
  seed_type text not null,
  url text not null unique,
  is_official boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists raw_documents (
  id text primary key,
  source_registry_id text not null references source_registry(id),
  fetched_at timestamptz not null,
  content_type text,
  title text,
  published_date_guess text,
  raw_path text,
  text_content text,
  checksum text
);

create table if not exists source_chunks (
  id text primary key,
  raw_document_id text not null references raw_documents(id),
  chunk_index integer not null,
  chunk_text text not null,
  token_count integer,
  embedding_ref text
);

create table if not exists extraction_runs (
  id text primary key,
  raw_document_id text not null references raw_documents(id),
  model_name text,
  agent_role text,
  run_status text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists policy_records (
  id text primary key,
  jurisdiction_id text not null,
  jurisdiction_name text not null,
  jurisdiction_type text not null,
  parent_jurisdiction_id text,
  state_abbr text not null,
  year integer,
  effective_date date,
  review_status text not null,
  extraction_status text not null,
  coder_type text,
  confidence numeric,
  ai_use_allowed integer,
  assessment_policy integer,
  privacy_policy integer,
  teacher_pd_support integer,
  implementation_stage integer,
  policy_strength numeric,
  policy_orientation text,
  notes text,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists policy_record_evidence (
  id text primary key,
  policy_record_id text not null references policy_records(id),
  field_name text not null,
  raw_document_id text not null references raw_documents(id),
  source_chunk_id text references source_chunks(id),
  evidence_quote text,
  source_url text not null
);

create table if not exists review_queue (
  id text primary key,
  policy_record_id text not null references policy_records(id),
  priority text not null,
  reason text not null,
  assigned_to text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
