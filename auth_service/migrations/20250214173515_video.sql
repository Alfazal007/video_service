create table videos (
	id serial primary key,
    creator_id int not null references users(id) on delete cascade,
	title varchar(250) not null,
    final_url varchar(250) default ''
);
