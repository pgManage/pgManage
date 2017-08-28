ALTER ROLE postgres PASSWORD 'password';
CREATE ROLE developer_g   NOLOGIN NOCREATEROLE  NOSUPERUSER    INHERIT  NOCREATEDB  NOREPLICATION    CONNECTION LIMIT -1   VALID UNTIL 'infinity';
GRANT developer_g TO postgres;
CREATE TABLE public.rtesting_table (
  id integer NOT NULL,
  test_name character varying(150),
  test_name2 character varying(150),
  "select" character varying(150),
  "test@test" character varying(150),
  CONSTRAINT rtesting_table_pk PRIMARY KEY (id)
) WITH (
  OIDS=FALSE
);
CREATE TABLE public.rtesting_table2 (
  id integer NOT NULL,
  test_name character varying(150),
  "select" character varying(150),
  "test@test" character varying(150),
  CONSTRAINT rtesting_table2_pk PRIMARY KEY (id)
) WITH (
  OIDS=FALSE
);
CREATE TABLE public.rtesting_table_with_capital_column_name (
  id integer NOT NULL,
  test_name character varying(150),
  "TestName" character varying(150),
  CONSTRAINT rtesting_table_with_capital_column_name_pk PRIMARY KEY (id)
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

CREATE OR REPLACE VIEW public.ttesting_view2 AS
 SELECT rtesting_table.id AS id_1, rtesting_table.test_name AS test_name_1,
    rtesting_table2.id AS id_2, rtesting_table2.test_name AS test_name_2
   FROM rtesting_table
     LEFT JOIN rtesting_table2 ON rtesting_table2.id = rtesting_table.id;
CREATE OR REPLACE RULE ttesting_view2_delete AS
    ON DELETE TO ttesting_view2 DO INSTEAD  DELETE FROM rtesting_table
  WHERE old.id_1 = rtesting_table.id;
CREATE OR REPLACE RULE ttesting_view2_insert AS
    ON INSERT TO ttesting_view2 DO INSTEAD  INSERT INTO rtesting_table (id, test_name)
  VALUES (new.id_1, new.test_name_1);
CREATE OR REPLACE RULE ttesting_view2_update AS
    ON UPDATE TO ttesting_view2 DO INSTEAD  UPDATE rtesting_table SET test_name = new.test_name_1
  WHERE old.id_1 = rtesting_table.id;

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

CREATE VIEW ttesting_large_view2 AS
	SELECT generate_series AS id, 'testset;akldsjf;lkasjdf;kljasjdf;lkasjdfkljdfgl;kjad;flkgjadg'::text AS test1, ';alksjdf;lkasjdf;lkasjdf;lkasdjf;laskdjf;laskdjfa;lsdkfja;lskdfj'::text AS test2
		FROM generate_series(1, 200);



CREATE DATABASE "WFP's ""Testing"" Database";
CREATE ROLE "WFP's ""Testing"" User" LOGIN PASSWORD 'WFP''s "Testing" Password' SUPERUSER CONNECTION LIMIT -1 VALID UNTIL 'infinity';
CREATE TABLE public."WFP's ""Testing"" Table" (
  id integer NOT NULL,
  "WFP's First ""Testing"" Column" character varying(150),
  "WFP's Second ""Testing"" Column" character varying(150),
  CONSTRAINT "WFP's ""Testing"" Primary Key" PRIMARY KEY (id)
) WITH (
  OIDS=FALSE
);
