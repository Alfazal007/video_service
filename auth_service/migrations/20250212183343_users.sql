create table users (
	id serial primary key,
	username varchar(20) not null unique,
	password varchar(255) not null
);
