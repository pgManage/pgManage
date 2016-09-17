ALTER ROLE postgres PASSWORD 'password';
CREATE ROLE developer_g   NOLOGIN NOCREATEROLE  NOSUPERUSER    INHERIT  NOCREATEDB  NOREPLICATION    CONNECTION LIMIT -1   VALID UNTIL 'infinity';
GRANT developer_g TO postgres;
CREATE TABLE IF NOT EXISTS rtesting_table
(
id serial,
test_name character varying(150),
test_name2 character varying(150),
change_stamp timestamp NOT NULL DEFAULT '2016-07-12 05:13:00',
CONSTRAINT rtesting_table_pk PRIMARY KEY (id)
) WITH (
OIDS=FALSE
);
CREATE OR REPLACE VIEW ttesting_view AS
 SELECT id, test_name
   FROM (
	 SELECT id, test_name
	   FROM (SELECT id, test_name
		 FROM (SELECT id, test_name
		   FROM rtesting_table
		  ) em1
	   ) em2
	 ) em3;
CREATE OR REPLACE FUNCTION public.accept_testing(str_args text)
RETURNS text AS
$BODY$
BEGIN
RETURN E'HTTP/1.1 200 OK\r\n\r\n' || str_args;
END
$BODY$ LANGUAGE plpgsql VOLATILE;
CREATE OR REPLACE FUNCTION public.action_testing(str_args text)
RETURNS text AS
$BODY$
BEGIN
RETURN '"' || str_args || '"';
END
$BODY$ LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION public.action_reset_seq(str_args text)
RETURNS text AS
$BODY$
BEGIN
ALTER SEQUENCE rtesting_table_id_seq RESTART;
RETURN '""';
END
$BODY$ LANGUAGE plpgsql VOLATILE;
