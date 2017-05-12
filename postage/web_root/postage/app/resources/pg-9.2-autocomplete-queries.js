var autocompleteQuery = {}, autocompleteSearchQuery = {}, bolAutocompleteQueriesLoaded = true;


autocompleteSearchQuery.schema = ml(function () {/*
    SELECT * FROM (
        SELECT oid, nspname, 'schema'::text
          FROM pg_namespace
         WHERE nspname = $NAMETOKEN${{NAME}}$NAMETOKEN$ {{ADDITIONALWHERE}}
    ) list_schemas
*/});
autocompleteSearchQuery.table = ml(function () {/*
    SELECT * FROM (
          SELECT pg_class.oid, relname, 'table'::text
            FROM pg_class
       LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
           WHERE relkind IN ('r','s','t')
             AND relname = $NAMETOKEN${{NAME}}$NAMETOKEN$ {{ADDITIONALWHERE}}
    ) list_tables
*/});

autocompleteSearchQuery.view = ml(function () {/*
    SELECT * FROM (
          SELECT c.oid, c.relname, 'view'::text
            FROM pg_class c
       LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
           WHERE ((c.relhasrules AND
                   (EXISTS (SELECT r.rulename
                              FROM pg_rewrite r
                             WHERE ((r.ev_class = c.oid)
                               AND (bpchar(r.ev_type) = '1'::bpchar)) ))) OR (c.relkind = 'v'::char))
             AND relname = $NAMETOKEN${{NAME}}$NAMETOKEN$ {{ADDITIONALWHERE}}
    ) list_views
*/});

autocompleteQuery.operators = ml(function () {/*
    SELECT * FROM (
            SELECT DISTINCT oprname AS obj_name, 'Operator' AS obj_meta
              FROM pg_operator
          ORDER BY oprname
    ) list_operators
*/});

autocompleteQuery.tableFunctions = ml(function () {/*
    SELECT * FROM (
        SELECT p.proname AS funcname, 'tableFunction'::text AS obj_meta
            FROM pg_proc p
            LEFT JOIN pg_type ON pg_type.oid = prorettype
            WHERE pg_type.typname = 'record' AND p.proname LIKE '{{searchStr}}'
            ORDER BY funcname
    ) list_tables_functions
*/});

autocompleteQuery.funcSnippets = ml(function () {/*
    SELECT * FROM (
        SELECT DISTINCT quote_ident(pr.proname) || '(' || COALESCE(pg_get_function_arguments(pr.oid), '') || ')' AS obj_name, 'funcSnippet'::text AS obj_meta
            FROM pg_proc pr
            JOIN pg_type typ ON typ.oid = pr.prorettype
        LEFT JOIN pg_namespace ON pg_namespace.oid = pr.pronamespace
            WHERE typname <> 'trigger'
            AND pr.proname LIKE '{{searchStr}}'
            AND COALESCE(pg_get_function_arguments(pr.oid), '') NOT ILIKE '%internal%'
    ORDER BY obj_name
    ) list_funcSnippets
*/});

autocompleteQuery.encodings = ml(function () {/*
    SELECT * FROM (
        SELECT encoding_name AS obj_name, 'Encoding' AS obj_meta
          FROM (SELECT pg_encoding_to_char(i) AS encoding_name
                  FROM generate_series(0,100) i) encoding_list
        WHERE encoding_name IS NOT NULL AND encoding_name != ''
        ORDER BY encoding_name ASC
    ) list_encodings
*/});

autocompleteQuery.collates = ml(function () {/*
    SELECT * FROM (
              SELECT DISTINCT quote_ident(collcollate) AS obj_name, 'Collate' AS obj_meta
                FROM pg_catalog.pg_collation
               WHERE quote_ident(collcollate) IS NOT NULL AND quote_ident(collcollate) <> '""'
            ORDER BY quote_ident(collcollate) ASC
    ) list_collates
*/});

autocompleteQuery.returnTypes = ml(function () {/*
    SELECT * FROM (
        SELECT DISTINCT pg_type.typname as obj_name, 'returnType' AS obj_meta
           FROM pg_proc p
           LEFT JOIN pg_type ON pg_type.oid = prorettype
           WHERE pg_type.typname LIKE '{{searchStr}}'
    ) list_return_types
*/});


autocompleteQuery.policies = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(polname) AS obj_name, 'Policy'::text AS obj_meta
            FROM (SELECT DISTINCT polname FROM pg_policy) em
        ORDER BY polname ASC
    ) list_policies
*/});

autocompleteQuery.constraints = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(conname) AS obj_name, 'Constraint'::text AS obj_meta
            FROM (SELECT DISTINCT conname FROM pg_constraint) em
        ORDER BY conname ASC
    ) list_constraints
*/});

autocompleteQuery.triggers = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(tgname) AS obj_name, 'Trigger'::text AS obj_meta
            FROM (SELECT DISTINCT tgname FROM pg_trigger) em
        ORDER BY tgname ASC
    ) list_triggers
*/});

autocompleteQuery.rules = ml(function () {/*
    SELECT DISTINCT * FROM (
          SELECT quote_ident(rulename) AS obj_name, 'Rule'::text AS obj_meta
            FROM (SELECT DISTINCT rulename FROM pg_rewrite) em
        ORDER BY rulename ASC
    ) list_triggers
*/});

autocompleteQuery.databases = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(datname) AS obj_name, 'Database'::text AS obj_meta
            FROM pg_database
        ORDER BY datname ASC
    ) list_dbs
*/});

autocompleteQuery.all_keyword = ml(function () {/*
    SELECT * FROM (
            SELECT 'ALL'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_all_keyword
*/});

autocompleteQuery.none_keyword = ml(function () {/*
    SELECT * FROM (
            SELECT 'NONE'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_none_keyword
*/});

autocompleteQuery.discard_keyword = ml(function () {/*
    SELECT * FROM (
            SELECT 'ALL'        AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'PLANS'      AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'SEQUENCES'  AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'TEMPORARY'  AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'TEMP'       AS obj_name, 'Keyword'::text AS obj_meta
    ) list_discard
*/});

autocompleteQuery.permissions = ml(function () {/*
    SELECT * FROM (
            SELECT 'ALL'            AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'ALL PRIVILEGES' AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'SELECT'         AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'INSERT'         AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'UPDATE'         AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'DELETE'         AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'TRUNCATE'       AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'REFERENCES'     AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'TRIGGER'        AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'USAGE'          AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'CREATE'         AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'CONNECT'        AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'TEMPORARY'      AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'TEMP'           AS obj_name, 'Permission'::text AS obj_meta
  UNION ALL SELECT 'EXECUTE'        AS obj_name, 'Permission'::text AS obj_meta
    ) list_permissions
*/});

autocompleteQuery.comment_objects = ml(function () {/*
    SELECT * FROM (
            SELECT 'AGGREGATE'                 AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'CAST'                      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'COLLATION'                 AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'COLUMN'                    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'CONSTRAINT'                AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'CONVERSION'                AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'DATABASE'                  AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'DOMAIN'                    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'EXTENSION'                 AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'EVENT TRIGGER'             AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'FOREIGN DATA WRAPPER'      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'FOREIGN TABLE'             AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'FUNCTION'                  AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'INDEX'                     AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'LARGE OBJECT'              AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'MATERIALIZED VIEW'         AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'OPERATOR'                  AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'OPERATOR CLASS'            AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'OPERATOR FAMILY'           AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'POLICY'                    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'PROCEDURAL LANGUAGE'       AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'LANGUAGE'                  AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'ROLE'                      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'RULE'                      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'SCHEMA'                    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'SEQUENCE'                  AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'SERVER'                    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TABLE'                     AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TABLESPACE'                AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH CONFIGURATION' AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH DICTIONARY'    AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH PARSER'        AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH TEMPLATE'      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TRANSFORM'                 AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TRIGGER'                   AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'TYPE'                      AS obj_name, 'Object Type'::text AS obj_meta
  UNION ALL SELECT 'VIEW'                      AS obj_name, 'Object Type'::text AS obj_meta
    ) list_comment_objects
*/});

autocompleteQuery.fetch_keyword = ml(function () {/*
    SELECT * FROM (
            SELECT 'NEXT'::text              AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'PRIOR'::text             AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'FIRST'::text             AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'LAST'::text              AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'ABSOLUTE <number>'::text AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'RELATIVE <number>'::text AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'ALL'::text               AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'FORWARD'::text           AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'FORWARD <number>'::text  AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'FORWARD ALL'::text       AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'BACKWARD'::text          AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'BACKWARD <number>'::text AS obj_name, 'FETCH Keyword'::text AS obj_meta
  UNION ALL SELECT 'BACKWARD ALL'::text      AS obj_name, 'FETCH Keyword'::text AS obj_meta
    ) list_comment_objects
*/});






autocompleteQuery.begin_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'ISOLATION LEVEL SERIALIZABLE'::text     AS obj_name, 'BEGIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'ISOLATION LEVEL REPEATABLE READ'::text  AS obj_name, 'BEGIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'ISOLATION LEVEL READ COMMITTED'::text   AS obj_name, 'BEGIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'ISOLATION LEVEL READ UNCOMMITTED'::text AS obj_name, 'BEGIN Keyword'::text AS obj_meta
    ) list_begin_keyword_one
*/});
autocompleteQuery.begin_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'READ WRITE'::text AS obj_name, 'BEGIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'READ ONLY'::text  AS obj_name, 'BEGIN Keyword'::text AS obj_meta
    ) list_begin_keyword_two
*/});
autocompleteQuery.begin_keyword_three = ml(function () {/*
    SELECT * FROM (
            SELECT 'DEFERRABLE'::text AS obj_name, 'BEGIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'NOT DEFERRABLE'::text  AS obj_name, 'BEGIN Keyword'::text AS obj_meta
    ) list_begin_keyword_three
*/});


autocompleteQuery.truncate_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'RESTART IDENTITY'::text     AS obj_name, 'TRUNCATE Keyword'::text AS obj_meta
  UNION ALL SELECT 'CONTINUE IDENTITY'::text  AS obj_name, 'TRUNCATE Keyword'::text AS obj_meta
    ) list_truncate_keyword_one
*/});
autocompleteQuery.truncate_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'CASCADE'::text AS obj_name, 'TRUNCATE Keyword'::text AS obj_meta
  UNION ALL SELECT 'RESTRICT'::text  AS obj_name, 'TRUNCATE Keyword'::text AS obj_meta
    ) list_truncate_keyword_two
*/});
autocompleteQuery.reassign_keyword_three = ml(function () {/*
    SELECT * FROM (
            SELECT 'TO'::text  AS obj_name, 'TRUNCATE Keyword'::text AS obj_meta
    ) list_truncate_keyword_three
*/});

autocompleteQuery.refresh_materialized_views_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'CONCURRENTLY'::text  AS obj_name, 'REFRESH Keyword'::text AS obj_meta
    ) list_refresh_materialized_views_keyword_one
*/});
autocompleteQuery.refresh_materialized_views_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'WITH DATA'::text  AS obj_name, 'REFRESH Keyword'::text AS obj_meta
  UNION ALL SELECT 'WITH NO DATA'::text  AS obj_name, 'REFRESH Keyword'::text AS obj_meta
    ) list_refresh_materialized_views_keyword_two
*/});

autocompleteQuery.reindex_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT '(VERBOSE)'::text  AS obj_name, 'REINDEX Keyword'::text AS obj_meta
    ) list_reindex_keyword_one
*/});
autocompleteQuery.reindex_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'INDEX'::text    AS obj_name, 'REINDEX Keyword'::text AS obj_meta
  UNION ALL SELECT 'TABLE'::text    AS obj_name, 'REINDEX Keyword'::text AS obj_meta
  UNION ALL SELECT 'SCHEMA'::text   AS obj_name, 'REINDEX Keyword'::text AS obj_meta
  UNION ALL SELECT 'DATABASE'::text AS obj_name, 'REINDEX Keyword'::text AS obj_meta
  UNION ALL SELECT 'SYSTEM'::text   AS obj_name, 'REINDEX Keyword'::text AS obj_meta
    ) list_reindex_keyword_two
*/});


autocompleteQuery.explain_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'ANALYZE'::text    AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'VERBOSE'::text    AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
    ) list_explain_keyword_one
*/});
autocompleteQuery.explain_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'COSTS'::text   AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'BUFFERS'::text AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'TIMING'::text  AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'FORMAT'::text  AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
    ) list_explain_keyword_two
*/});
autocompleteQuery.explain_keyword_three = ml(function () {/*
    SELECT * FROM (
            SELECT 'TEXT'::text  AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'XML'::text   AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'JSON'::text  AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
  UNION ALL SELECT 'YAML'::text  AS obj_name, 'EXPLAIN Keyword'::text AS obj_meta
    ) list_explain_keyword_three
*/});

autocompleteQuery.security_label_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'ON TABLE'::text                AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON COLUMN'::text               AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON AGGREGATE'::text            AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON DATABASE'::text             AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON DOMAIN'::text               AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON EVENT TRIGGER'::text        AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON FOREIGN TABLE'::text        AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON FUNCTION'::text             AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON LARGE OBJECT'::text         AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON MATERIALIZED VIEW'::text    AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON PROCEDURAL LANGUAGE'::text  AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON LANGUAGE'::text             AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON ROLE'::text                 AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON SCHEMA'::text               AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON SEQUENCE'::text             AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON TABLESPACE'::text           AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON TYPE'::text                 AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'ON VIEW'::text                 AS obj_name, 'Keyword'::text AS obj_meta
    ) list_security_label_keyword_one
*/});

autocompleteQuery.set_constraint_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'DEFERRED'::text  AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'IMMEDIATE'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_set_constraint_keyword_one
*/});


autocompleteQuery.copy_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'FROM'::text AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'TO'::text   AS obj_name, 'Keyword'::text AS obj_meta
    ) list_copy_keyword_one
*/});
autocompleteQuery.copy_keyword_two_a = ml(function () {/*
    SELECT * FROM (
            SELECT '''filename'''::text        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'PROGRAM ''command'''::text AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'STDIN'::text               AS obj_name, 'Keyword'::text AS obj_meta
    ) list_copy_keyword_two_a
*/});
autocompleteQuery.copy_keyword_two_b = ml(function () {/*
    SELECT * FROM (
            SELECT '''filename'''::text        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'PROGRAM ''command'''::text AS obj_name, 'Keyword'::text AS obj_meta
  UNION ALL SELECT 'STDOUT'::text              AS obj_name, 'Keyword'::text AS obj_meta
    ) list_copy_keyword_two_b
*/});
autocompleteQuery.copy_keyword_three = ml(function () {/*
    SELECT * FROM (
            SELECT 'FORMAT'::text                            AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OIDS TRUE'::text                         AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OIDS FALSE'::text                        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FREEZE TRUE'::text                       AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FREEZE FALSE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DELIMITER ''delimiter_character'''::text AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'NULL ''null_string'''::text              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'HEADER TRUE'::text                       AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'HEADER FALSE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'QUOTE ''quote_character'''::text         AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'ESCAPE ''escape_character'''::text       AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FORCE_QUOTE *'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FORCE_QUOTE (columns)'::text             AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FORCE_NOT_NULL (columns)'::text          AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FORCE_NULL (columns)'::text              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'ENCODING ''encoding_name'''::text        AS obj_name, ''::text AS obj_meta
    ) list_copy_keyword_three
*/});
autocompleteQuery.copy_keyword_four = ml(function () {/*
    SELECT * FROM (
            SELECT 'text'::text   AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'csv'::text    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'binary'::text AS obj_name, ''::text AS obj_meta
    ) list_copy_keyword_four
*/});

autocompleteQuery.analyze_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'VERBOSE'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_analyze_keyword_one
*/});

autocompleteQuery.cluster_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'VERBOSE'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_cluster_keyword_one
*/});
autocompleteQuery.cluster_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'USING'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_cluster_keyword_two
*/});


autocompleteQuery.security_label_providers = ml(function () {/*
    SELECT * FROM (
          SELECT DISTINCT ('FOR ' || provider) AS obj_name, 'Provider'::text AS obj_meta
            FROM pg_shseclabel
        ORDER BY provider ASC
    ) list_allcolumns
*/});

autocompleteQuery.security_labels = ml(function () {/*
    SELECT * FROM (
          SELECT DISTINCT ('FOR ' || label) AS obj_name, 'Security Label'::text AS obj_meta
            FROM pg_shseclabel
        ORDER BY label ASC
    ) list_allcolumns
*/});


autocompleteQuery.current_database = ml(function () {/*
    SELECT * FROM (
            SELECT CURRENT_DATABASE()::text AS obj_name, 'Database'::text AS obj_meta
    ) list_current_database
*/});


autocompleteQuery.lock_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'IN ACCESS SHARE MODE'::text           AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN ROW SHARE MODE'::text              AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN ROW EXCLUSIVE MODE'::text          AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN SHARE UPDATE EXCLUSIVE MODE'::text AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN SHARE MODE'::text                  AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN SHARE ROW EXCLUSIVE MODE'::text    AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN EXCLUSIVE MODE'::text              AS obj_name, 'LOCK Keyword'::text AS obj_meta
  UNION ALL SELECT 'IN ACCESS EXCLUSIVE MODE'::text       AS obj_name, 'LOCK Keyword'::text AS obj_meta
    ) list_lock_keyword_two
*/});

autocompleteQuery.alter_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'AGGREGATE'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'COLLATION'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'CONVERSION'::text                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DATABASE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DEFAULT PRIVILEGES'::text        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DOMAIN'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'EVENT TRIGGER'::text             AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'EXTENSION'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN DATA WRAPPER'::text      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN TABLE'::text             AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FUNCTION'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'GROUP'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'INDEX'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'PROCEDURAL LANGUAGE'::text       AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'LANGUAGE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'LARGE OBJECT'::text              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'MATERIALIZED VIEW'::text         AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR CLASS'::text            AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR FAMILY'::text           AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'POLICY'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'ROLE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'RULE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SCHEMA'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SEQUENCE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SERVER'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SYSTEM'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TABLE'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TABLESPACE'::text                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH CONFIGURATION'::text AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH DICTIONARY'::text    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH PARSER'::text        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH TEMPLATE'::text      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TRIGGER'::text                   AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TYPE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'USER'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'USER MAPPING'::text              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'VIEW'::text                      AS obj_name, ''::text AS obj_meta
    ) list_alter_keyword_one
*/});

autocompleteQuery.drop_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'AGGREGATE'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'CAST'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'COLLATION'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'CONVERSION'::text                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DATABASE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DOMAIN'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'EVENT TRIGGER'::text             AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'EXTENSION'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN DATA WRAPPER'::text      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN TABLE'::text             AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FUNCTION'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'GROUP'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'INDEX'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'PROCEDURAL LANGUAGE'::text       AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'LANGUAGE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'MATERIALIZED VIEW'::text         AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR CLASS'::text            AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OPERATOR FAMILY'::text           AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'OWNED'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'POLICY'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'ROLE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'RULE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SCHEMA'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SEQUENCE'::text                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SERVER'::text                    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TABLE'::text                     AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TABLESPACE'::text                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH CONFIGURATION'::text AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH DICTIONARY'::text    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH PARSER'::text        AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TEXT SEARCH TEMPLATE'::text      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TRANSFORM'::text                 AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TRIGGER'::text                   AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TYPE'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'USER'::text                      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'USER MAPPING'::text              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'VIEW'::text                      AS obj_name, ''::text AS obj_meta
    ) list_drop_keyword_one
*/});



autocompleteQuery.lock_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'NOWAIT'::text  AS obj_name, 'LOCK Keyword'::text AS obj_meta
    ) list_lock_keyword_two
*/});


autocompleteQuery.reassign_keyword_one = ml(function () {/*
    SELECT * FROM (
            SELECT 'OWNED BY'::text  AS obj_name, 'REASSIGN Keyword'::text AS obj_meta
    ) list_reassign_keyword_one
*/});
autocompleteQuery.reassign_keyword_two = ml(function () {/*
    SELECT * FROM (
            SELECT 'CURRENT_USER'::text  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SESSION_USER'::text  AS obj_name, ''::text AS obj_meta
    ) list_reassign_keyword_two
*/});




autocompleteQuery.user_variables = ml(function () {/*
    SELECT * FROM (
            SELECT 'CURRENT_USER'::text  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SESSION_USER'::text  AS obj_name, ''::text AS obj_meta
    ) list_user_variables
*/});

autocompleteQuery.alter_keyword_rename = ml(function () {/*
    SELECT * FROM (
            SELECT 'RENAME TO'::text  AS obj_name, ''::text AS obj_meta
    ) list_alter_keyword_rename
*/});

autocompleteQuery.alter_keyword_set_schema = ml(function () {/*
    SELECT * FROM (
            SELECT 'SET SCHEMA'::text  AS obj_name, ''::text AS obj_meta
    ) list_alter_keyword_set_schema
*/});

autocompleteQuery.alter_keyword_owner_to = ml(function () {/*
    SELECT * FROM (
            SELECT 'OWNER TO'::text  AS obj_name, ''::text AS obj_meta
    ) list_alter_keyword_owner_to
*/});




autocompleteQuery.permissionobjects = ml(function () {/*
    SELECT * FROM (
            SELECT 'TABLE'                   AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SEQUENCE'                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DATABASE'                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'DOMAIN'                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN DATA WRAPPER'    AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FOREIGN SERVER'          AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'FUNCTION'                AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'ALL FUNCTIONS IN SCHEMA' AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'LANGUAGE lang_name'      AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'LARGE OBJECT'            AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'SCHEMA'                  AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TABLESPACE'              AS obj_name, ''::text AS obj_meta
  UNION ALL SELECT 'TYPE'                    AS obj_name, ''::text AS obj_meta
    ) list_permission_object_types
*/});

autocompleteQuery.set_keywords = ml(function () {/*
    SELECT * FROM (
                  SELECT 'SESSION'::text               AS obj_name, 'Keyword'::text AS obj_meta
        UNION ALL SELECT 'SESSION AUTHORIZATION'::text AS obj_name, 'Keyword'::text AS obj_meta
        UNION ALL SELECT 'ROLE'::text                  AS obj_name, 'Keyword'::text AS obj_meta
        UNION ALL SELECT 'TIME ZONE'::text             AS obj_name, 'Keyword'::text AS obj_meta
    ) list_setting_keywords
*/});

autocompleteQuery.show_keywords = ml(function () {/*
    SELECT * FROM (
                  SELECT 'ALL'::text  AS obj_name, 'Keyword'::text AS obj_meta
        UNION ALL SELECT 'ROLE'::text AS obj_name, 'Keyword'::text AS obj_meta
    ) list_show_keywords
*/});

autocompleteQuery.prepared_transactions = ml(function () {/*
    SELECT * FROM (
          SELECT '''' || gid || '''' AS obj_name, 'Prepared Transaction'::text AS obj_meta
            FROM pg_prepared_xacts
        ORDER BY gid ASC
    ) list_prepared_transactions
*/});

autocompleteQuery.large_objects = ml(function () {/*
    SELECT * FROM (
          SELECT oid::text AS obj_name, 'Large Object'::text AS obj_meta
            FROM pg_largeobject_metadata
    ) list_large_objects
*/});

autocompleteQuery.prepared_statements = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(name) AS obj_name, 'Prepared Statement'::text AS obj_meta
            FROM (SELECT name FROM pg_prepared_statements ORDER BY name ASC) prepared_statements
    ) list_prepared_statements
*/});


autocompleteQuery.listening_channels = ml(function () {/*
    SELECT * FROM (
              SELECT '*'::text AS obj_name, 'All Channels'::text AS obj_meta
        UNION ALL
            SELECT channel_name AS obj_name, 'Channel'::text AS obj_meta
              FROM (
                        SELECT *
                          FROM (SELECT pg_listening_channels() AS channel_name) channels
                      ORDER BY channel_name
                    ) channels_ordered
    ) list_prepared_statements
*/});


autocompleteQuery.text_search_tokens = ml(function () {/*
    SELECT * FROM (
        SELECT token.alias AS obj_name, 'Token'::text AS obj_meta
          FROM ts_token_type((
                   SELECT DISTINCT cfgparser
                     FROM pg_ts_config_map
                LEFT JOIN pg_ts_config ON pg_ts_config.oid = pg_ts_config_map.mapcfg
                LEFT JOIN pg_ts_parser ON pg_ts_parser.oid = pg_ts_config.cfgparser
            )) token
        ORDER BY token.alias
    ) list_text_search_tokens
*/});

autocompleteQuery.enum_qualified_values = ml(function () {/*
    SELECT * FROM (
          SELECT '''' || e.enumlabel || '''' AS obj_name, 'ENUM TYPE Value' AS obj_meta
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_namespace n ON n.oid = t.typnamespace
           WHERE t.oid = (SELECT '{{ENUMNAME}}'::regtype::oid)
        ORDER BY e.enumlabel ASC
    ) list_enum_qualified_values
*/});


autocompleteQuery.collations = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(collname) AS obj_name, 'Collation'::text AS obj_meta
            FROM pg_collation
        ORDER BY collname ASC
    ) list_collations
*/});


autocompleteQuery.settings = ml(function () {/*
    SELECT * FROM (
          SELECT "name" AS obj_name, 'Setting'::text AS obj_meta
            FROM pg_settings
           WHERE context = 'superuser' OR context = 'user'
        ORDER BY "name" ASC
    ) list_settings
*/});

autocompleteQuery.constraints = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(conname) AS obj_name, 'Constraint'::text AS obj_meta
            FROM pg_constraint
        ORDER BY conname ASC
    ) list_constraints
*/});

autocompleteQuery.qualified_constraints = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(conname) AS obj_name, 'Constraint'::text AS obj_meta
            FROM pg_constraint
           WHERE connamespace = '{{SCHEMAOID}}'
        ORDER BY conname ASC
    ) list_constraints
*/});

autocompleteQuery.servers = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(srvname) AS obj_name, 'Server'::text AS obj_meta
            FROM pg_foreign_server
        ORDER BY srvname ASC
    ) list_servers
*/});

autocompleteQuery.casts = ml(function () {/*
    SELECT * FROM (
             SELECT '(' || format_type(fromtype.oid, fromtype.typtypmod)
                        || ' AS '
                        || format_type(totype.oid, totype.typtypmod) || ')' AS obj_name
                        , 'Cast'::text AS obj_meta
               FROM pg_cast
               JOIN pg_type fromtype ON fromtype.oid = castsource
               JOIN pg_type totype   ON totype.oid = casttarget
           ORDER BY obj_name
    ) list_casts
*/});

autocompleteQuery.tables = ml(function () {/*
    SELECT DISTINCT * FROM (
          SELECT quote_ident(pg_class.relname) AS obj_name,
                 'Table'::text AS obj_meta
            FROM pg_class
       LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
           WHERE relkind IN ('r','s','t')
             AND pg_class.relnamespace <> {{CATALOG}}
             AND pg_class.relnamespace <> {{TOAST}} AND quote_ident(pg_class.relname) LIKE '{{searchStr}}'
        ORDER BY pg_namespace.nspname ASC, pg_class.relname ASC
    ) list_tables
*/});

autocompleteQuery.opclass = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(opcname) AS obj_name, 'Operator Class'::text AS obj_meta
            FROM pg_opclass
        ORDER BY opcname ASC
    ) list_opclass
*/});

autocompleteQuery.allcolumns = ml(function () {/*
    SELECT * FROM (
          SELECT DISTINCT quote_ident(attname) AS obj_name, 'Column'::text AS obj_meta
            FROM pg_attribute
           WHERE quote_ident(attname) NOT ILIKE '"........%' AND quote_ident(attname) LIKE '{{searchStr}}'
        ORDER BY quote_ident(attname) ASC
    ) list_allcolumns
*/});

autocompleteQuery.views = ml(function () {/*
    SELECT DISTINCT * FROM (
          SELECT quote_ident(c.relname) AS obj_name,
                 'View'::text AS obj_meta
            FROM pg_class c
       LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
           WHERE ((c.relhasrules AND
                   (EXISTS (SELECT r.rulename
                              FROM pg_rewrite r
                             WHERE ((r.ev_class = c.oid)
                               AND (bpchar(r.ev_type) = '1'::bpchar)) ))) OR (c.relkind = 'v'::char))
             AND c.relnamespace <> {{CATALOG}}
             AND c.relnamespace <> {{TOAST}} AND quote_ident(c.relname) LIKE '{{searchStr}}'
        ORDER BY pg_namespace.nspname ASC, c.relname ASC
    ) list_views
*/});

autocompleteQuery.types2 = ml(function () {/*
    SELECT DISTINCT * FROM (
        SELECT pg_type.typname AS obj_name, 'Type'::text AS obj_meta
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
         WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
           AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
           AND (pg_type.typtype <> 'd') AND pg_type.typname LIKE '{{searchStr}}'
      ORDER BY pg_type.typname
    ) list_types2
*/});

autocompleteQuery.types = ml(function () {/*
    SELECT * FROM (
        SELECT pg_type.typname AS obj_name, 'Type'::text AS obj_meta
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
         WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
           AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
           AND (pg_type.typtype <> 'd')
      ORDER BY pg_type.typname
    ) list_types --this is working
*/});

autocompleteQuery.schemas = ml(function () {/*
    SELECT * FROM (
        SELECT pg_namespace.nspname AS obj_name, 'Schema'::text AS obj_meta
          FROM pg_catalog.pg_namespace
         WHERE nspname NOT ILIKE 'pg_toast%'
           AND nspname NOT ILIKE 'pg_temp%' AND pg_namespace.nspname LIKE '{{searchStr}}'
           --AND nspname <> 'pg_catalog'
           --AND nspname <> 'information_schema'
      ORDER BY pg_namespace.nspname
    ) list_schemas
*/});

autocompleteQuery.columns = ml(function () {/*
    SELECT * FROM (
            SELECT attname AS obj_name, 'Column'::text AS obj_meta
             FROM pg_attribute
            WHERE attrelid = '{{PARENTOID}}' AND attnum >= 0 AND attisdropped = false
         ORDER BY attnum ASC
    ) list_columns
*/});


autocompleteQuery.extension = ml(function () {/*
    SELECT * FROM (
          SELECT extname AS obj_name, 'Extension'::text AS obj_meta
            FROM pg_catalog.pg_extension
        ORDER BY extname ASC
    ) list_extensions
*/});

autocompleteQuery.foreign_data_wrapper = ml(function () {/*
    SELECT * FROM (
          SELECT fdwname AS obj_name, 'Foreign Data Wrapper'::text AS obj_meta
            FROM pg_catalog.pg_foreign_data_wrapper
        ORDER BY fdwname ASC
    ) list_foreign_data_wrappers
*/});

autocompleteQuery.language = ml(function () {/*
    SELECT DISTINCT * FROM (
          SELECT lanname AS obj_name, 'Language'::text AS obj_meta
            FROM pg_catalog.pg_language
            WHERE lanname LIKE '{{searchStr}}'
        ORDER BY lanname ASC
    ) list_languages
*/});

autocompleteQuery.tablespace = ml(function () {/*
    SELECT DISTINCT * FROM (
          SELECT spcname AS obj_name, 'Tablespace'::text AS obj_meta
            FROM pg_catalog.pg_tablespace
            WHERE spcname LIKE '{{searchStr}}'
        ORDER BY spcname ASC
    ) list_tablespaces
*/});

autocompleteQuery.builtIns = ml(function () {/*
    SELECT * FROM (
        SELECT p.proname AS obj_name, 'builtIns'::text AS obj_meta
            FROM pg_proc p
            LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'pg_catalog' AND p.proname LIKE '{{searchStr}}'
            ORDER BY p.proname
    ) list_builtIns
*/});

autocompleteQuery.policies = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(polname) AS obj_name, 'Policy'::text AS obj_meta
            FROM pg_policy
        ORDER BY polname ASC
    ) list_tablespaces
*/});

autocompleteQuery.access_methods = ml(function () {/*
    SELECT * FROM (
        SELECT amname AS obj_name, 'Access Methods'::text AS obj_meta
          FROM pg_am
      ORDER BY amname
    ) list_access_methods
*/});

autocompleteQuery.btree_operator_families = ml(function () {/*
    SELECT * FROM (
           SELECT pg_namespace.nspname || '.' || opfname AS obj_name, 'BTree Operator Family'::text AS obj_meta
             FROM pg_opfamily
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_opfamily.opfnamespace
            WHERE opfmethod = (SELECT oid FROM pg_am WHERE amname = 'btree')
        ORDER BY pg_namespace.nspname ASC, opfname ASC
    ) list_btree_operator_families
*/});

autocompleteQuery.roles = ml(function () {/*
    SELECT * FROM (
        SELECT quote_ident(pg_roles.rolname) AS obj_name, 'Role'::text AS obj_meta
          FROM pg_catalog.pg_roles
      ORDER BY pg_roles.rolname
    ) list_roles
*/});
autocompleteQuery.logins = ml(function () {/*
    SELECT DISTINCT * FROM (
        SELECT quote_ident(pg_roles.rolname) AS obj_name, 'Role'::text AS obj_meta
          FROM pg_catalog.pg_roles
         WHERE rolcanlogin = TRUE AND pg_roles.rolname LIKE '{{searchStr}}'
      ORDER BY pg_roles.rolname
    ) list_logins
*/});
autocompleteQuery.groups = ml(function () {/*
    SELECT DISTINCT * FROM (
        SELECT pg_roles.rolname AS obj_name, 'Role'::text AS obj_meta
          FROM pg_catalog.pg_roles
         WHERE rolcanlogin = FALSE AND pg_roles.rolname LIKE '{{searchStr}}'
      ORDER BY pg_roles.rolname
    ) list_groups
*/});


autocompleteQuery.qualified_aggregates = ml(function () {/*
    SELECT * FROM (
           SELECT proname || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' AS obj_name, 'Aggregate'::text AS obj_meta
             FROM pg_aggregate ag
             JOIN pg_proc ON pg_proc.oid = ag.aggfnoid
            WHERE pronamespace = '{{SCHEMAOID}}' AND proisagg = TRUE
         ORDER BY proname ASC
    ) list_aggregates
*/});
autocompleteQuery.qualified_conversions = ml(function () {/*
    SELECT * FROM (
           SELECT conname AS obj_name, 'Conversion'::text AS obj_meta
             FROM pg_conversion
            WHERE connamespace = '{{SCHEMAOID}}'
         ORDER BY conname ASC
    ) list_conversion
*/});

autocompleteQuery.qualified_collations = ml(function () {/*
    SELECT * FROM (
           SELECT collname AS obj_name, 'Collation'::text AS obj_meta
             FROM pg_collation
            WHERE collnamespace = '{{SCHEMAOID}}'
         ORDER BY collname ASC
    ) list_collation
*/});

autocompleteQuery.qualified_domains = ml(function () {/*
    SELECT * FROM (
          SELECT typname AS obj_name, 'Domain'::text AS obj_meta
            FROM pg_type
           WHERE typtype = 'd' AND typnamespace = '{{SCHEMAOID}}'
        ORDER BY typname ASC
    ) list_domains
*/});

autocompleteQuery.event_triggers = ml(function () {/*
    SELECT * FROM (
          SELECT evtname AS obj_name, 'Event Trigger'::text AS obj_meta
            FROM pg_event_trigger
        ORDER BY evtname ASC
    ) list_event_triggers
*/});

autocompleteQuery.cursors = ml(function () {/*
    SELECT * FROM (
          SELECT name AS obj_name, 'Cursor'::text AS obj_meta
            FROM pg_cursors
        ORDER BY name ASC
    ) list_cursors
*/});

autocompleteQuery.qualified_foreign_tables = ml(function () {/*
    SELECT * FROM (
          SELECT pg_class.relname AS obj_name, 'Foreign Table'::text AS obj_meta
            FROM pg_foreign_table
       LEFT JOIN pg_class ON pg_class.oid = pg_foreign_table.ftrelid
       LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
           WHERE pg_class.relnamespace = '{{SCHEMAOID}}'
        ORDER BY pg_class.relname ASC
    ) list_foreign_tables
*/});
autocompleteQuery.qualified_functions = ml(function () {/*
    SELECT * FROM (
           SELECT proname || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' AS obj_name, 'Function'::text AS obj_meta
             FROM pg_proc
             JOIN pg_type ON pg_type.oid = pg_proc.prorettype
            WHERE pronamespace = '{{SCHEMAOID}}' AND proisagg = FALSE AND pg_type.typname <> 'trigger'
         ORDER BY proname ASC
    ) list_functions
*/});
autocompleteQuery.qualified_indexes = ml(function () {/*
    SELECT * FROM (
           SELECT pg_class.relname AS obj_name, 'Index'::text AS obj_meta
             FROM pg_catalog.pg_class
            WHERE relkind = 'i' AND relnamespace = {{SCHEMAOID}}
    ) list_indexes
*/});

autocompleteQuery.table_qualified_indexes = ml(function () {/*
    SELECT * FROM (
           SELECT pg_class.relname AS obj_name, 'Index'::text AS obj_meta
             FROM pg_class
        LEFT JOIN pg_index ON pg_index.indexrelid = pg_class.oid
            WHERE relkind = 'i' AND indrelid = (SELECT $NAMETOKEN${{TABLENAME}}$NAMETOKEN$::regclass::oid)
    ) list_indexes
*/});

autocompleteQuery.table_qualified_triggers = ml(function () {/*
    SELECT * FROM (
           SELECT pg_class.relname AS obj_name, 'Trigger'::text AS obj_meta
             FROM pg_class
        LEFT JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
            WHERE tgisinternal = FALSE AND tgrelid = (SELECT $NAMETOKEN${{TABLENAME}}$NAMETOKEN$::regclass::oid)
    ) list_triggers
*/});

autocompleteQuery.table_qualified_rules = ml(function () {/*
    SELECT * FROM (
           SELECT rulename AS obj_name, 'Rule'::text AS obj_meta
             FROM pg_rewrite
            WHERE ev_class = (SELECT $NAMETOKEN${{TABLENAME}}$NAMETOKEN$::regclass::oid)
    ) list_rules
*/});

autocompleteQuery.domain_qualified_constraints = ml(function () {/*
    SELECT * FROM (
           SELECT pg_constraint.conname AS obj_name, 'Constaint'::text AS obj_meta
             FROM pg_constraint
            WHERE pg_constraint.conname IS NOT NULL
              AND contypid = (SELECT $NAMETOKEN${{DOMAINNAME}}$NAMETOKEN$::regtype::oid)
    ) list_constraints
*/});

autocompleteQuery.table_qualified_constraints = ml(function () {/*
    SELECT * FROM (
           SELECT pg_constraint.conname AS obj_name, 'Constaint'::text AS obj_meta
             FROM pg_constraint
            WHERE pg_constraint.conname IS NOT NULL
              AND conrelid = (SELECT $NAMETOKEN${{TABLENAME}}$NAMETOKEN$::regclass::oid)
    ) list_constraints
*/});

autocompleteQuery.qualified_materialized_views = ml(function () {/*
    SELECT * FROM (
           SELECT pg_class.relname AS obj_name, 'Materialized View'::text AS obj_meta
             FROM pg_catalog.pg_class
            WHERE relkind = 'm' AND relnamespace = {{SCHEMAOID}}
    ) list_materialized_views
*/});

autocompleteQuery.qualified_operators = ml(function () {/*
    SELECT * FROM (
           SELECT pg_operator.oprname || ' (' || format_type(pg_operator.oprleft, NULL) || ', ' || format_type(pg_operator.oprright, NULL) || ')' AS obj_name, 'Operator'::text AS obj_meta
             FROM pg_operator
            WHERE oprnamespace = '{{SCHEMAOID}}'
         ORDER BY oprname ASC
    ) list_operators
*/});
autocompleteQuery.qualified_operator_classes = ml(function () {/*
    SELECT * FROM (
          SELECT opcname AS obj_name, 'Operator Class'::text AS obj_meta
            FROM pg_opclass
           WHERE pg_opclass.opcnamespace = {{SCHEMAOID}}
        ORDER BY opcname
    ) list_operator_class
*/});

autocompleteQuery.qualified_operator_families = ml(function () {/*
    SELECT * FROM (
          SELECT opfname AS obj_name, 'Operator Family'::text AS obj_meta
            FROM pg_opfamily
           WHERE pg_opfamily.opfnamespace = {{SCHEMAOID}}
        ORDER BY opfname
    ) list_operator_family
*/});
//autocompleteQuery.qualified_policies
//autocompleteQuery.qualified_rules
autocompleteQuery.qualified_sequences = ml(function () {/*
    SELECT * FROM (
          SELECT relname AS obj_name, 'Sequence'::text AS obj_meta
            FROM pg_class
           WHERE relkind = 'S' AND relnamespace = {{SCHEMAOID}}
        ORDER BY pg_class.relname ASC
    ) list_sequences
*/});
autocompleteQuery.qualified_tables = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(pg_class.relname) AS obj_name, 'Table'::text AS obj_meta
            FROM pg_class
       LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
           WHERE relkind IN ('r','s','t')
             AND pg_namespace.oid = {{SCHEMAOID}}
        ORDER BY pg_namespace.nspname ASC, pg_class.relname ASC
    ) list_tables
*/});

autocompleteQuery.qualified_text_search_configurations = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(cfgname) AS obj_name, 'Text Search Config'::text AS obj_meta
            FROM pg_ts_config
           WHERE cfgnamespace = {{SCHEMAOID}}
        ORDER BY cfgname ASC
    ) list_text_search_configurations
*/});

autocompleteQuery.qualified_text_search_dictionaries = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(dictname) AS obj_name, 'Text Search Dictionary'::text AS obj_meta
            FROM pg_ts_dict
           WHERE dictnamespace = {{SCHEMAOID}}
        ORDER BY dictname ASC
    ) list_text_search_dictionaries
*/});

autocompleteQuery.qualified_text_search_parsers = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(prsname) AS obj_name, 'Text Search Parser'::text AS obj_meta
            FROM pg_ts_parser
           WHERE prsnamespace = {{SCHEMAOID}}
        ORDER BY prsname ASC
    ) list_text_search_dictionaries
*/});

autocompleteQuery.qualified_text_search_templates = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(tmplname) AS obj_name, 'Text Search Template'::text AS obj_meta
            FROM pg_ts_template
           WHERE tmplnamespace = {{SCHEMAOID}}
        ORDER BY tmplname ASC
    ) list_text_search_templates
*/});

//autocompleteQuery.qualified_transforms
//autocompleteQuery.qualified_triggers

autocompleteQuery.qualified_types = ml(function () {/*
    SELECT * FROM (
    SELECT pg_type.typname AS obj_name, 'Type'::text AS obj_meta
      FROM pg_catalog.pg_type
     WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c'
                                       FROM pg_catalog.pg_class
                                      WHERE pg_class.oid = pg_type.typrelid))
       AND (NOT EXISTS (SELECT TRUE
                          FROM pg_catalog.pg_type elem
                         WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
       AND (pg_type.typnamespace = {{SCHEMAOID}})
       AND (pg_type.typtype <> 'd')
  ORDER BY typname ASC
    ) list_types
*/});

//autocompleteQuery.qualified_user_mappings

autocompleteQuery.qualified_views = ml(function () {/*
    SELECT * FROM (
          SELECT quote_ident(c.relname) AS obj_name, 'View'::text AS obj_meta
            FROM pg_class c
       LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
           WHERE ((c.relhasrules AND
                   (EXISTS (SELECT r.rulename
                              FROM pg_rewrite r
                             WHERE ((r.ev_class = c.oid)
                               AND (bpchar(r.ev_type) = '1'::bpchar)) ))) OR (c.relkind = 'v'::char))
             AND pg_namespace.oid = {{SCHEMAOID}}
        ORDER BY pg_namespace.nspname ASC, c.relname ASC
    ) list_views
*/});
