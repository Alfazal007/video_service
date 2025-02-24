CREATE TYPE video_status AS ENUM ('novideo', 'transcoding', 'published', 'unlist');

create table videos (
	id serial primary key,
    creator_id int not null references users(id) on delete cascade,
	title varchar(250) not null,
    status video_status NOT NULL DEFAULT 'novideo',
    normal_done boolean default false,
    foureighty_done boolean default false,
    created_at TIMESTAMP DEFAULT NOW()
);
