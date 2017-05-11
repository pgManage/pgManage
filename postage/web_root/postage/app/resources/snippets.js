var snippets = [];


snippets.push(['CREATE_TABLE (Snippet)', 'SQLSnippet', ml(function () {/*CREATE TABLE ${1:schema}.${2:table} (
		id integer NOT NULL DEFAULT nextval(('${3:schema}.${4:global_seq}'::text)::regclass),
		${5}
		create_login name DEFAULT "session_user"(),
		change_login name DEFAULT "session_user"(),
		create_stamp timestamp with time zone DEFAULT date_trunc('second'::text, ('now'::text)::timestamp with time zone),
		change_stamp timestamp with time zone DEFAULT date_trunc('second'::text, ('now'::text)::timestamp with time zone),
		CONSTRAINT ${6:table}_pk PRIMARY KEY (id)
	) WITH (
		OIDS=FALSE
	);

	ALTER TABLE ${7:schema}.${8:view} OWNER TO postgres;
*/})]);

snippets.push(['CREATE_VIEW (Snippet)', 'SQLSnippet', ml(function () {/*CREATE OR REPLACE VIEW ${1:schema}.${2:view} AS
	${3}

	ALTER TABLE ${4:schema}.${5:view} OWNER TO postgres;
	GRANT SELECT,UPDATE,INSERT,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE ${6:schema}.${7:view} TO ${8:trusted_g};
*/})]);

// you need to escape dollar signs in the ml function because they are used for substitutions!!
snippets.push(['CREATE_FUNCTION (Snippet)', 'SQLSnippet', ml(function () {/*CREATE OR REPLACE FUNCTION ${1:schema}.${2:function}(str_args text)
	RETURNS text AS
	\$BODY\$
	DECLARE
		${3}
	BEGIN
		${4}
	END;
	\$BODY\$
	LANGUAGE plpgsql VOLATILE
	COST 100;

	ALTER FUNCTION ${5:schema}.${6:function}(str_args text) OWNER TO postgres;
	GRANT EXECUTE ON FUNCTION ${7:schema}.${8:function}(str_args text) TO ${9:trusted_g};
*/})]);

snippets.push(['CREATE_GROUP (Snippet)', 'SQLSnippet', ml(function () {/*CREATE ROLE ${1:trusted_g}
		NOLOGIN
		NOCREATEROLE
		NOSUPERUSER
		INHERIT
		NOCREATEDB
		NOREPLICATION
		CONNECTION LIMIT -1
		VALID UNTIL 'infinity';
*/})]);

snippets.push(['CREATE_ROLE (Snippet)', 'SQLSnippet', ml(function () {/*CREATE ROLE ${1:user_name}
		LOGIN PASSWORD '${2:password}'
		NOCREATEROLE
		NOSUPERUSER
		INHERIT
		NOCREATEDB
		NOREPLICATION
		CONNECTION LIMIT -1
		VALID UNTIL 'infinity';

	GRANT ${3:trusted_g} TO ${4:user_name};
*/})]);

snippets.push(['CREATE_SEQUENCE (Snippet)', 'SQLSnippet', ml(function () {/*CREATE SEQUENCE ${1:schema}.${2:sequence}
		INCREMENT 1
		MINVALUE 1
		MAXVALUE 9223372036854775807
		CACHE 1
		NO CYCLE;

	ALTER SEQUENCE ${3:schema}.${4:sequence} OWNER TO postgres;

	GRANT ALL ON TABLE ${5:schema}.${6:sequence} TO postgres;
*/})]);

snippets.push(['RESTART_SEQUENCE (Snippet)', 'SQLSnippet', ml(function () {/*ALTER SEQUENCE ${1:schema}.${2:sequence} RESTART;
*/})]);

snippets.push(['SELECT_SIMPLE (Snippet)', 'SQLSnippet', ml(function () {/*SELECT ${1:columns}
	FROM ${2:table}
	WHERE ${3:where};
*/})]);

snippets.push(['SELECT_ADVANCED (Snippet)', 'SQLSnippet', ml(function () {/*--Name: ${14:name}
    WITH ${15:with}
	SELECT ${1:columns}
	INTO ${2:into}
	FROM ${3:columns}
	WHERE ${4:where}
	GROUP BY ${5:groups}
	HAVING ${6:having}
	WINDOW ${7:window}
	${8:UNION}
	ORDER BY ${9:order}
	LIMIT ${10:limit}
	OFFSET ${11:offset}
	FETCH ${12:fetch}
	FOR ${13:for}
*/})]);

snippets.push(['VACUUM_COLUMN (Snippet)', 'SQLSnippet', ml(function () {/*VACUUM (${1:FULL }${2:FREEZE }${3:VERBOSE }${4:ANALYZE }${5:DISABLE_PAGE_SKIPPING}) ${6:schema}.${7:table} ${8:columns};
*/})]);

snippets.push(['VACUUM_TABLE (Snippet)', 'SQLSnippet', ml(function () {/*VACUUM (${1:FULL }${2:FREEZE }${3:VERBOSE}) {4:schema}.${5:table};
*/})]);

snippets.push(['INSERT_SELECT (Snippet)', 'SQLSnippet', ml(function () {/*INSERT INTO ${1:schema}.${2:table} (${3:columns})
	SELECT ${4:columns}
	FROM ${5:table}
	WHERE ${6:where};
*/})]);

snippets.push(['INSERT_VALUES (Snippet)', 'SQLSnippet', ml(function () {/*INSERT INTO ${1:schema}.${2:table} (${3:columns})
	VALUES (${4:columns});
*/})]);

snippets.push(['UPDATE_SIMPLE (Snippet)', 'SQLSnippet', ml(function () {/*UPDATE ${1:schema}.${2:table}
	SET ${3:set}
	WHERE ${4:where};
*/})]);

snippets.push(['UPDATE_FROM (Snippet)', 'SQLSnippet', ml(function () {/*UPDATE ${1:schema}.${2:table}
	SET ${3:set}
	FROM ${4:from}
	WHERE ${5:where};
*/})]);

snippets.push(['UPSERT_SELECT (Snippet)', 'SQLSnippet', ml(function () {/*INSERT INTO ${1:schema}.${2:table} (${3:columns})
	SELECT ${4:columns}
	FROM ${5:table}
	WHERE ${6:where}
	ON CONFLICT (${7:conflict_column}) DO UPDATE
	SET ${8:set}
	WHERE ${9:where};
*/})]);

snippets.push(['UPSERT_VALUES (Snippet)', 'SQLSnippet', ml(function () {/*INSERT INTO ${1:schema}.${2:table} (${3:columns})
	VALUES (${4:columns})
	ON CONFLICT (${5:conflict_column}) DO UPDATE
	SET ${6:set}
	WHERE ${7:where};
*/})]);

snippets.push(['DELETE_SIMPLE (Snippet)', 'SQLSnippet', ml(function () {/*DELETE ${1:schema}.${2:table}
	WHERE ${3:where};
*/})]);

snippets.push(['DELETE_USING (Snippet)', 'SQLSnippet', ml(function () {/*DELETE ${1:schema}.${2:table}
	USING ${3:from}
	WHERE ${4:where};
*/})]);

snippets.push(['CREATE_UNIQUE_INDEX (Snippet)', 'SQLSnippet', ml(function () {/*CREATE UNIQUE INDEX ${1:table}_pk ON ${2:schema}.${3:table} USING btree (id);
	CREATE UNIQUE INDEX ${4:CONCURRENTLY }${5:IF NOT EXISTS }${6:table}_idx ON ${7:schema}.${8:table} USING ${9:btree} (${10:columns});
*/})]);

snippets.push(['CREATE_INDEX (Snippet)', 'SQLSnippet', ml(function () {/*CREATE INDEX ${1:table}_pk ON ${2:schema}.${3:table} USING btree (${4:column});
	CREATE INDEX ${5:CONCURRENTLY }${6:IF NOT EXISTS }${7:table}_idx ON ${8:schema}.${9:table} USING ${10:btree} (${11:columns});
*/})]);

//console.log(snippets);














