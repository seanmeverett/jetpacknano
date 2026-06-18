create table if not exists public.post_comments (
  id text primary key,
  post_id text not null references public.posts(id) on delete cascade,
  author text not null,
  text text not null,
  ts bigint not null
);
alter table public.post_comments enable row level security;
create policy "public read comments" on public.post_comments for select using (true);

delete from public.post_comments;
insert into public.post_comments (id, post_id, author, text, ts)
select format('pc_%s_%s', p.id, gs),
       p.id,
       (array['jade','marco','kai','riley','noor','tomoko','drew','sam','priya','leo','ava','nick','maya','reza','blair'])[1+floor(random()*15)::int],
       (array['this is so good','how is this not viral','first','teach me please','underrated','obsessed','the algorithm finally delivered','no way','saving this','this slaps','who is this','i needed this today','stop scrolling','10/10','genuine question how','fav','lol insane','beautiful','more of this','underrated af','crying','the way i gasped','instant follow','this healed me'])[1+floor(random()*24)::int],
       floor(extract(epoch from now()) - random()*259200)::bigint
from public.posts p, generate_series(1, least(floor(p.likes/3)::int, 120)) gs
where p.likes >= 3;
