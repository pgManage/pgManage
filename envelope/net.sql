/*
Copyright 2016 Workflow Products, L.L.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

CREATE SCHEMA net
	AUTHORIZATION postgres;
GRANT ALL ON SCHEMA net TO postgres;
COMMENT ON SCHEMA net IS 'Browser utility functions';

CREATE OR REPLACE FUNCTION net.text_to_uri(text)
	RETURNS text AS
$BODY$
DECLARE
	str_working text;
	str_slice text;
	str_ret text;

BEGIN
	-- Takes text as input, returns uri encoded text
	-- SELECT net.text_to_uri('test 3');
	-- test%203
	str_working := $1;
	str_ret := '';
	WHILE length(str_working) > 0 LOOP
		str_slice := substring(str_working, 1, 1);
		IF str_slice ~* '[a-z]|[0-9]' THEN
			str_ret := str_ret || str_slice;
		ELSE
			str_ret := str_ret || '%' || encode(str_slice::bytea,'hex');
		END IF;
		str_working := substring(str_working, 2);
	END LOOP;

	RETURN str_ret;
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;
ALTER FUNCTION net.text_to_uri(text) OWNER TO postgres;

CREATE OR REPLACE FUNCTION net.getpar(text, text)
	RETURNS text AS
$BODY$
DECLARE
	strArray text[];
	ret text;

BEGIN
	-- Takes query string for first input, second input is the key for the value you want to extract
	-- returns value after it has been decoded using uri_to_text
	-- SELECT net.getpar('test1=value1&test2=value%202', 'test2');
	-- value 2
	strArray := string_to_array($1, '&');
	IF array_upper(strArray,1) IS NULL THEN
		RETURN NULL;
	ELSE
		for i IN 1..array_upper(strArray,1) loop
			IF split_part(strArray[i], '=', 1) = $2 THEN
				ret = substring(strArray[i] FROM position('=' in strArray[i]) + 1);
			END IF;
		end loop;
		IF ret != '' THEN
			ret := net.uri_to_text(ret);
		ELSE
			ret := NULL;
		END IF;
		RETURN ret;
	END IF;
END

$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;
ALTER FUNCTION net.getpar(text, text) OWNER TO postgres;

CREATE OR REPLACE FUNCTION net.getpare(text, text)
	RETURNS text AS
$BODY$
DECLARE
	strArray text[];
	ret text;

BEGIN
	-- Takes query string for first input, second input is the key for the value you want to extract
	-- returns value WITHOUT decoding using uri_to_text
	-- SELECT net.getpare('test1=value1&test2=value%202', 'test2');
	-- value%202
	strArray := string_to_array($1, '&');
	IF array_upper(strArray,1) IS NULL THEN
		RETURN NULL;
	ELSE
		for i IN 1..array_upper(strArray,1) loop
			IF split_part(strArray[i], '=', 1) = $2 THEN
				ret = substring(strArray[i] FROM position('=' in strArray[i]) + 1);
			END IF;
		end loop;
		IF ret = '' THEN
			ret := NULL;
		END IF;
		RETURN ret;
	END IF;

END

$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;

ALTER FUNCTION net.getpare(text, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION net.getpare(text, text) TO postgres;
GRANT EXECUTE ON FUNCTION net.getpare(text, text) TO public;

CREATE OR REPLACE FUNCTION net.uri_to_text(text)
	RETURNS text AS
$BODY$
DECLARE
	str_working text;
	str_slice text;
	arr_working text[];
	str_ret text;

BEGIN
	-- Takes uri encoded text as input, returns decoded text
	-- SELECT net.uri_to_text('test%203');
	-- test 3
	str_working := replace($1, '+', ' ');
	arr_working := regexp_split_to_array(str_working, E'%');
	FOR i IN 2 .. array_upper(arr_working,1) LOOP
		str_slice := substring(arr_working[i] from 1 for 2);
		IF str_slice < '2' OR str_slice > '7E' THEN
			IF str_slice ilike '0D' THEN
				arr_working[i] := chr(13) ||- substring(arr_working[i] from 3);
			ELSE
				arr_working[i] := substring(arr_working[i] from 3);
			END IF;
		ELSE
			arr_working[i] := COALESCE(convert_from(decode(substring(arr_working[i] from 1 for 2), 'hex'), 'UTF8'), '') || COALESCE(substring(arr_working[i] from 3), '');
		END IF;
	END LOOP;
	str_ret := array_to_string(arr_working, ''::text)::text;

	RETURN str_ret;
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;
ALTER FUNCTION net.uri_to_text(text) OWNER TO postgres;

CREATE OR REPLACE FUNCTION net.interval_nullable(str_input text)
  RETURNS interval AS
$BODY$
DECLARE

BEGIN
    RETURN str_input::interval;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL::interval;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

ALTER FUNCTION net.interval_nullable(str_input text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION net.interval_nullable(str_input text) TO public;

CREATE OR REPLACE FUNCTION net.jsonify(anyelement)
	RETURNS text AS
$BODY$
DECLARE
BEGIN
	-- Takes string, date, integer, etc
	-- Returns properly encoded JSON value
	-- SELECT net.jsonify('test');
	-- "test"
	RETURN rtrim(ltrim(array_to_json(ARRAY[[$1]])::text, '['), ']');
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;

ALTER FUNCTION net.jsonify(anyelement) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION net.jsonify(anyelement) TO postgres;
GRANT EXECUTE ON FUNCTION net.jsonify(anyelement) TO public;


SELECT net.getpar('test1=value1&test2=value%202', 'test1');
--value1

SELECT net.getpar('test1=value1&test2=value%202', 'test2');
--value 2

SELECT net.getpare('test1=value1&test2=value%202', 'test1');
--value1

SELECT net.getpare('test1=value1&test2=value%202', 'test2');
--value%202

SELECT net.text_to_uri('test 3');
--test%203

SELECT net.uri_to_text('test%203');
--test 3

SELECT net.jsonify('test'::text);
--"test"

SELECT net.jsonify(1);
--1
