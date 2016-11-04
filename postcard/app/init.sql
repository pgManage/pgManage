ALTER ROLE postgres PASSWORD 'password';
CREATE ROLE main_user LOGIN PASSWORD 'password';

CREATE SCHEMA todo;
GRANT USAGE ON SCHEMA todo TO main_user;

CREATE TABLE todo.rtodo (
	id serial,
	task text NOT NULL,
	complete smallint NOT NULL DEFAULT 0,
	PRIMARY KEY (id)
) WITH (
	OIDS=FALSE
);

CREATE VIEW todo.ttodo AS
	SELECT id, task, complete
		FROM todo.rtodo;

GRANT SELECT, INSERT, UPDATE, DELETE ON todo.ttodo TO main_user;
GRANT ALL ON todo.rtodo_id_seq TO main_user;
