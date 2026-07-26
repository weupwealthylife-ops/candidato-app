create table if not exists analytics_events (
  id          bigserial primary key,
  event       text not null,
  properties  jsonb,
  session_id  text,
  created_at  timestamptz default now()
);

create index if not exists analytics_events_event_idx on analytics_events (event);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
