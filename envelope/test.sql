ALTER ROLE postgres PASSWORD 'password';
CREATE ROLE envelopeuser LOGIN SUPERUSER PASSWORD 'envelopeuserpassword';
CREATE ROLE test_user LOGIN PASSWORD 'password';
CREATE ROLE public_user LOGIN PASSWORD 'youwontguessthispasswordwillyou1lk2j43k1lj3h4k3j4h56k324j5bnoiusdfyg08';
CREATE ROLE developer_g   NOLOGIN NOCREATEROLE  NOSUPERUSER    INHERIT  NOCREATEDB  NOREPLICATION    CONNECTION LIMIT -1   VALID UNTIL 'infinity';
CREATE ROLE envelope_g   NOLOGIN NOCREATEROLE  NOSUPERUSER    INHERIT  NOCREATEDB  NOREPLICATION    CONNECTION LIMIT -1   VALID UNTIL 'infinity';
CREATE ROLE public_g   NOLOGIN NOCREATEROLE  NOSUPERUSER    INHERIT  NOCREATEDB  NOREPLICATION    CONNECTION LIMIT -1   VALID UNTIL 'infinity';
GRANT developer_g TO postgres;
GRANT envelope_g TO postgres;
GRANT envelope_g TO test_user;
GRANT public_g TO public_user;
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
CREATE TABLE public."WFP's ""Testing"" Table" (
  id integer NOT NULL,
  "WFP's First ""Testing"" Column" character varying(150),
  "WFP's Second ""Testing"" Column" character varying(150),
  CONSTRAINT "WFP's ""Testing"" Primary Key" PRIMARY KEY (id)
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
CREATE OR REPLACE FUNCTION public.action_delete_rows(str_args text)
    RETURNS text AS
$BODY$
DECLARE

BEGIN
    DELETE FROM rtesting_table
    	WHERE id::text ILIKE (str_args || '%');
    DELETE FROM ttesting_view2
        WHERE id_1::text ILIKE (str_args || '%');
    DELETE FROM rtesting_table_with_capital_column_name
        WHERE id::text ILIKE (str_args || '%');
    RETURN '""';

END;
$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;

ALTER FUNCTION public.action_delete_rows(str_args text) OWNER TO postgres;

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

CREATE OR REPLACE FUNCTION public.acceptnc_testing(str_args text)
RETURNS text AS
$BODY$
BEGIN
RETURN E'HTTP/1.1 200 OK\r\n\r\n' || str_args;
END
$BODY$ LANGUAGE plpgsql VOLATILE;
GRANT EXECUTE ON FUNCTION public.acceptnc_testing(str_args text) TO public_g;
CREATE OR REPLACE FUNCTION public.actionnc_testing(str_args text)
RETURNS text AS
$BODY$
BEGIN
RETURN '"' || str_args || '"';
END
$BODY$ LANGUAGE plpgsql VOLATILE;
GRANT EXECUTE ON FUNCTION public.actionnc_testing(str_args text) TO public_g;


CREATE OR REPLACE FUNCTION public.action_reset_seq(str_args text)
RETURNS text AS
$BODY$
BEGIN
ALTER SEQUENCE rtesting_table_id_seq RESTART;
RETURN '""';
END
$BODY$ LANGUAGE plpgsql VOLATILE;

CREATE TABLE rtesting_large_table (
    id    integer NOT NULL,
    test1 VARCHAR (61) NOT NULL,
    test2 VARCHAR (64) NOT NULL,
CONSTRAINT rtesting_large_table_pk PRIMARY KEY (id)
) WITH (
OIDS=FALSE
);

CREATE VIEW ttesting_large_view AS
	SELECT	rtesting_large_table0.id AS id0, rtesting_large_table0.test1 AS test10, rtesting_large_table0.test2 AS test20,
			rtesting_large_table1.id AS id1, rtesting_large_table1.test1 AS test11, rtesting_large_table1.test2 AS test21
		FROM rtesting_large_table AS rtesting_large_table0
		LEFT JOIN rtesting_large_table AS rtesting_large_table1 ON rtesting_large_table0.test1 = rtesting_large_table1.test1
		WHERE rtesting_large_table0.id < 50;

INSERT INTO rtesting_large_table (id, test1, test2)
	SELECT generate_series, 'testset;akldsjf;lkasjdf;kljasjdf;lkasjdfkljdfgl;kjad;flkgjadg', ';alksjdf;lkasjdf;lkasjdf;lkasdjf;laskdjf;laskdjfa;lsdkfja;lskdfj'
		FROM generate_series(1, 1000);

CREATE VIEW ttesting_large_view2 AS
	SELECT generate_series AS id, 'testset;akldsjf;lkasjdf;kljasjdf;lkasjdfkljdfgl;kjad;flkgjadg'::text AS test1, ';alksjdf;lkasjdf;lkasjdf;lkasdjf;laskdjf;laskdjfa;lsdkfja;lskdfj'::text AS test2
		FROM generate_series(1, 200);

-- DROP FUNCTION public.accept_testing_return_null(str_args text);

CREATE OR REPLACE FUNCTION public.accept_testing_return_null(str_args text)
  RETURNS text AS
$BODY$
BEGIN
RETURN NULL;
END
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

ALTER FUNCTION public.accept_testing_return_null(str_args text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.accept_testing_return_null(str_args text) FROM public;

--SELECT public.accept_testing_return_null(str_args text);

-- DROP FUNCTION public.action_testing_return_null(str_args text);

CREATE OR REPLACE FUNCTION public.action_testing_return_null(str_args text)
  RETURNS text AS
$BODY$
BEGIN
RETURN NULL;
END
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

ALTER FUNCTION public.action_testing_return_null(str_args text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.action_testing_return_null(str_args text) TO postgres;
REVOKE ALL ON FUNCTION public.action_testing_return_null(str_args text) FROM public;

--SELECT public.action_testing_return_null(str_args text);
