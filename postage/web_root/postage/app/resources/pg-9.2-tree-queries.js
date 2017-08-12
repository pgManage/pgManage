/*global ml*/
/*jslint white:true*/
'use strict';
var bolTreeQueriesLoaded = true, listQuery = {}, titleRefreshQuery = {}
  , scriptQuery = {}, infoQuery = {}, statQuery = {}, propQuery = {}
  , detailQuery = {}, associatedButtons = {};

function handleQueryVersionDifferences (versionNum) {
    
    
    //console.log(parseFloat(versionNum, 10) >= 9.5);
    //propQuery.prop_role:
    if (parseFloat(versionNum, 10) >= 9.5) {
        propQuery.prop_role = propQuery.objectRole = ml(function () {/*
          SELECT 1 AS sort,
                 'Name',
                 'OID',
                 'Expires',
                 'Can Login?',
                 'Superuser?',
                 'Can Create Databases?',
                 'Can Create Roles?',
                 'Bypasses row level security?',
                 'Inherits?',
                 'Replication?',
                 'Connection Limit',
                 'Comment'
        UNION ALL
          SELECT 2 AS sort,
                  pg_roles.rolname::text,
                  pg_roles.oid::text,
                  (CASE WHEN pg_roles.rolvaliduntil IS NULL
                          OR length(pg_roles.rolvaliduntil::date::text) = 0 
                          OR pg_roles.rolvaliduntil = 'infinity'
                            THEN 'Never' ELSE to_char(pg_roles.rolvaliduntil::date, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)') END)::text,
                  (CASE WHEN pg_roles.rolcanlogin    THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolsuper       THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolcreatedb    THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolcreaterole  THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolbypassrls     THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolinherit     THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolreplication THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolconnlimit > -1 THEN pg_roles.rolconnlimit::text ELSE 'No Limit' END)::text,
                  (description::text)::text
             FROM pg_roles
        LEFT JOIN pg_auth_members ON pg_roles.oid = pg_auth_members.member 
        LEFT JOIN pg_roles owner_role ON owner_role.oid = pg_auth_members.roleid 
        LEFT JOIN pg_description ON pg_roles.oid = pg_description.objoid
            WHERE pg_roles.oid = '{{INTOID}}'
         ORDER BY sort;
        */});
    } else {
        propQuery.prop_role = propQuery.objectRole = ml(function () {/*
          SELECT 1 AS sort,
                 'Name',
                 'OID',
                 'Expires',
                 'Can Login?',
                 'Superuser?',
                 'Can Create Databases?',
                 'Can Create Roles?',
                 --'Can Update Catalogs?',
                 --'Bypasses row level security?',
                 'Inherits?',
                 'Replication?',
                 'Connection Limit',
                 'Comment'
        UNION ALL
          SELECT 2 AS sort,
                  pg_roles.rolname::text,
                  pg_roles.oid::text,
                  (CASE WHEN pg_roles.rolvaliduntil IS NULL
                          OR length(pg_roles.rolvaliduntil::date::text) = 0 
                          OR pg_roles.rolvaliduntil = 'infinity'
                            THEN 'Never' ELSE to_char(pg_roles.rolvaliduntil::date, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)') END)::text,
                  (CASE WHEN pg_roles.rolcanlogin    THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolsuper       THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolcreatedb    THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolcreaterole  THEN 'Yes' ELSE 'No' END)::text,
                  --(CASE WHEN pg_roles.rolbypassrls     THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolinherit     THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolreplication THEN 'Yes' ELSE 'No' END)::text,
                  (CASE WHEN pg_roles.rolconnlimit > -1 THEN pg_roles.rolconnlimit::text ELSE 'No Limit' END)::text,
                  (description::text)::text
             FROM pg_roles
        LEFT JOIN pg_auth_members ON pg_roles.oid = pg_auth_members.member 
        LEFT JOIN pg_roles owner_role ON owner_role.oid = pg_auth_members.roleid 
        LEFT JOIN pg_description ON pg_roles.oid = pg_description.objoid
            WHERE pg_roles.oid = '{{INTOID}}'
         ORDER BY sort;
        */});
    }
    
}


var treeStructure = [
    // role
    [1, 'folder', 'objectGroup'],
        [2, 'script', 'objectRole'],
    [1, 'folder', 'objectLogin'],
        [2, 'script', 'objectRole'],
    
    // more
    [1, 'folder', 'objectCast'],
        [2, 'script', 'objectCast'],
        
    [1, 'script', 'objectDatabase'],
    
    [1, 'folder', 'objectExtension'],
        [2, 'script', 'objectExtension'],
        
    [1, 'folder', 'objectForeignDataWrapper'],
        [2, 'script', 'objectForeignDataWrapper'],
        
    [1, 'folder', 'informationSchemaView'],
        [2, 'script', 'informationSchemaView'],
        
    [1, 'folder', 'objectLanguage'],
        [2, 'script', 'objectLanguage'],
        
    [1, 'folder', 'objectForeignServer'],
        [2, 'script', 'objectForeignServer'],
        
    [1, 'folder', 'objectTablespace'],
        [2, 'script', 'objectTablespace'],
    
    // schema
    [1, 'folder,script', 'objectSchema'],
        [2, '', 'objectNothing'],
        [2, 'folder,refresh', 'objectAggregate'],
            [3, 'script', 'objectAggregate'],
        [2, 'folder,refresh', 'objectCollation'],
            [3, 'script', 'objectCollation'],
        [2, 'folder,refresh', 'objectConversion'],
            [3, 'script', 'objectConversion'],
        [2, 'folder,refresh', 'objectDomain'],
            [3, 'script', 'objectDomain'],
        [2, 'folder,refresh', 'objectForeignTable'],
            [3, 'script', 'objectForeignTable'],
        [2, 'folder,refresh', 'objectTextSearchConfiguration'],
            [3, 'script', 'objectTextSearchConfiguration'],
        [2, 'folder,refresh', 'objectTextSearchDictionary'],
            [3, 'script', 'objectTextSearchDictionary'],
        [2, 'folder,refresh', 'objectTextSearchParser'],
            [3, 'script', 'objectTextSearchParser'],
        [2, 'folder,refresh', 'objectTextSearchTemplate'],
            [3, 'script', 'objectTextSearchTemplate'],
        [2, 'folder,refresh', 'objectFunction'],
            [3, 'script', 'objectFunction'],
        //[2, 'folder,refresh', 'objectIndex'],
        //    [3, 'script', 'objectIndex'],
        [2, 'folder,refresh', 'objectOperator'],
            [3, 'script', 'objectOperator'],
        [2, 'folder,refresh', 'objectOperatorClass'],
            [3, 'script', 'objectOperatorClass'],
        [2, 'folder,refresh', 'objectOperatorFamily'],
            [3, 'script', 'objectOperatorFamily'],
        [2, 'folder,refresh', 'objectSequence'],
            [3, 'script', 'objectSequence'],
        [2, 'folder,refresh', 'objectTableList'],
            [3, 'folder,script', 'objectTable'],
                [4, 'folder', 'objectColumnList'],
                    [5, 'script', 'objectColumn'],
                [4, 'folder', 'objectConstraintList'],
                    [5, 'script', 'objectConstraint'],
                [4, 'folder', 'objectIndexList'],
                    [5, 'script', 'objectIndex'],
                [4, 'folder', 'objectKeyList'],
                    [5, 'script', 'objectKey'],
                [4, 'folder', 'objectRuleList'],
                    [5, 'script', 'objectRule'],
                [4, 'folder', 'objectTriggerList'],
                    [5, 'script', 'objectTrigger'],
        [2, 'folder,refresh', 'objectTriggerFunction'],
            [3, 'script', 'objectFunction'],
        [2, 'folder,refresh', 'objectType'],
            [3, 'script', 'objectType'],
        [2, 'folder,refresh', 'objectViewList'],
            [3, 'folder,script', 'objectView'],
                [4, 'folder', 'objectColumnList'],
                    [5, 'script', 'objectColumn'],
                [4, 'folder', 'objectConstraintList'],
                    [5, 'script', 'objectConstraint'],
                [4, 'folder', 'objectIndexList'],
                    [5, 'script', 'objectIndex'],
                [4, 'folder', 'objectKeyList'],
                    [5, 'script', 'objectKey'],
                [4, 'folder', 'objectRuleList'],
                    [5, 'script', 'objectRule'],
                [4, 'folder', 'objectTriggerList'],
                    [5, 'script', 'objectTrigger'],
];









listQuery.schemas = ml(function () {/*
     SELECT oid, nspname AS name
       FROM pg_namespace
      WHERE (
                (NOT nspname LIKE 'pg\_%')
                OR
                nspname = 'pg_catalog'
            )
        AND (NOT nspname LIKE 'information%')
   ORDER BY nspname;
*/});


listQuery.objectSchema = listQuery.schemaContents = ml(function () {/*
    WITH folders AS (
        SELECT 999 AS srt, '' AS oid, 'Empty' as name, 'objectNothing' AS obj_query, 1 AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Aggregates' AS name, 'objectAggregate' AS obj_query, (SELECT count(proname) AS result
                FROM pg_aggregate ag
                JOIN pg_proc pr ON pr.oid = ag.aggfnoid
               WHERE pr.pronamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Collations' AS name, 'objectCollation' AS obj_query, (SELECT count(collname) AS result
                FROM pg_collation
               WHERE collnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Conversions' AS name, 'objectConversion' AS obj_query, (SELECT count(conname) AS result
                FROM pg_conversion
               WHERE connamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Domains' AS name, 'objectDomain' AS obj_query, (SELECT count(typname) AS result
            FROM pg_type
           WHERE typtype = 'd' AND typnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Foreign Tables' AS name, 'objectForeignTable' AS obj_query, (SELECT count(relname) AS result
                FROM pg_foreign_table
           LEFT JOIN pg_class ON pg_class.oid = pg_foreign_table.ftrelid
               WHERE relnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'TS Configurations' AS name, 'objectTextSearchConfiguration' AS obj_query, (SELECT count(cfgname) AS result
                FROM pg_ts_config
               WHERE cfgnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'TS Dictionaries' AS name, 'objectTextSearchDictionary' AS obj_query, (SELECT count(dictname) AS result
                FROM pg_ts_dict
               WHERE dictnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'TS Parsers' AS name, 'objectTextSearchParser' AS obj_query, (SELECT count(prsname) AS result
                FROM pg_ts_parser
               WHERE prsnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'TS Templates' AS name, 'objectTextSearchTemplate' AS obj_query, (SELECT count(tmplname) AS result
                FROM pg_ts_template
               WHERE tmplnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Functions' AS name, 'objectFunction' AS obj_query, (SELECT count(proname) AS result
               FROM pg_proc pr
               JOIN pg_type typ ON typ.oid = pr.prorettype
              WHERE proisagg = FALSE
                AND typname <> 'trigger'
                AND pr.pronamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        --SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Indexes' AS name, 'objectIndex' AS obj_query,
        --            (SELECT count(relname)
        --              FROM pg_catalog.pg_class
        --             WHERE relkind = 'i' AND relnamespace = '{{INTOID}}'::oid) AS obj_count
        --UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Operators' AS name, 'objectOperator' AS obj_query, (SELECT count(oprname) AS result
               FROM pg_operator
              WHERE pg_operator.oprnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Operator Classes' AS name, 'objectOperatorClass' AS obj_query, (SELECT count(opcname) AS result
               FROM pg_opclass
              WHERE pg_opclass.opcnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Operator Families' AS name, 'objectOperatorFamily' AS obj_query, (SELECT count(opfname) AS result
               FROM pg_opfamily
              WHERE pg_opfamily.opfnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Sequences' AS name, 'objectSequence' AS obj_query, (SELECT count(relname)
               FROM pg_class
              WHERE relkind = 'S'
                AND pg_class.relnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Tables' AS name, 'objectTableList' AS obj_query, (SELECT count(relname) AS result
                 FROM pg_class rel
                WHERE relkind IN ('r','s','t')
                  AND rel.relnamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Trigger Functions' AS name, 'objectTriggerFunction' AS obj_query, (SELECT count(proname) AS result
               FROM pg_proc
               JOIN pg_type typ ON typ.oid=prorettype
              WHERE proisagg = FALSE
                AND typname = 'trigger'
                AND pg_proc.pronamespace = '{{INTOID}}'::oid) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Types' AS name, 'objectType' AS obj_query, (
                                                    
            SELECT count(pg_type.typname)
              FROM pg_catalog.pg_type pg_type
         LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
             WHERE (pg_type.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = pg_type.typrelid))
               AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
               AND (pg_type.typnamespace = '{{INTOID}}'::oid)
               AND (pg_type.typtype <> 'd')) AS obj_count
        UNION
        SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Views' AS name, 'objectViewList' AS obj_query, (SELECT count(c.relname) AS result
              FROM pg_class c
              WHERE ((c.relhasrules AND (EXISTS (
                      SELECT r.rulename FROM pg_rewrite r
                      WHERE r.ev_class = c.oid))))
                AND c.relnamespace = '{{INTOID}}'::oid AND (c.relkind = 'v' OR c.relkind = 'm')) AS obj_count
        --ORDER BY srt ASC, name ASC
        --UNION
        --SELECT 2 AS srt, '{{INTOID}}' AS oid, 'Views' AS name, 'objectViewList' AS obj_query, (SELECT count(pg_views.viewname) AS result
        --FROM pg_views
        --    WHERE pg_views.schemaname = '{{STRSQLSAFENAME}}') AS obj_count
        ORDER BY srt ASC, name ASC
    )
    SELECT oid, CASE WHEN name = 'Empty' THEN 'Nothing In This Folder' ELSE name || ' (' || obj_count::text || ')' END, obj_query
      FROM folders
     WHERE srt = CASE WHEN (SELECT sum(obj_count) FROM folders filders_where) > 1 THEN 2 ELSE 999 END
       AND obj_count > 0;
*/});


/*

columns
keys
constraints
triggers
indexes

*/


listQuery.objectTable = ml(function () {/*

SELECT {{INTOID}} AS oid, 'Columns (' || COUNT(attname) || ')' AS caption, 'objectColumnList' AS obj_query
    FROM pg_attribute
    LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = attrelid
    WHERE attrelid = {{INTOID}} AND attname NOT LIKE '...%' AND attname NOT LIKE 'cmin' AND attname NOT LIKE 'cmax' AND attname NOT LIKE 'xmin' AND attname NOT LIKE 'xmax' AND attname NOT LIKE 'ctid' AND attname NOT LIKE 'tableoid'
        HAVING COUNT(attname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Indexes (' || COUNT(clidx.relname) || ')' AS caption, 'objectIndexList' AS obj_query
    FROM pg_class cl 
    JOIN pg_index idx ON cl.oid = idx.indrelid 
    JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
    LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
    WHERE (cl.oid = {{INTOID}} OR cl.relname = '{{STRSQLSAFENAME}}')
      AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0
        HAVING COUNT(clidx.relname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Triggers (' || COUNT(pg_trigger.tgname) || ')' AS caption, 'objectTriggerList' AS obj_query
    FROM pg_class 
    JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_class.oid = {{INTOID}} AND pg_trigger.tgisinternal != TRUE
    HAVING COUNT(pg_trigger.tgname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Constraints (' || COUNT(conname) || ')' AS caption, 'objectConstraintList' AS obj_query
         FROM 
            (SELECT oid, *
               FROM pg_constraint
              WHERE pg_constraint.conrelid = {{INTOID}} AND contype <> 't'
           ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                          WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                          WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                    pg_constraint.conname ASC) AS constrain
                    HAVING COUNT(conname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Keys (' || COUNT(conname || ' ' || pg_get_constraintdef(oid, true)) || ')' AS caption, 'objectKeyList' AS obj_query
         FROM 
            (SELECT oid, *
               FROM pg_constraint
              WHERE pg_constraint.conrelid = {{INTOID}} AND pg_get_constraintdef(oid, true) ILIKE '%key%'
           ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                          WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                          WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                    pg_constraint.conname ASC) AS constrain
                    HAVING COUNT(conname || ' ' || pg_get_constraintdef(oid, true)) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Rules (' ||COUNT(drp) || ')' AS caption, 'objectRuleList' AS obj_query
        FROM ( SELECT pg_rewrite.rulename as drp
            FROM pg_class c
            LEFT JOIN pg_rewrite ON c.oid=pg_rewrite.ev_class
            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.oid = {{INTOID}}) AS rules
            HAVING COUNT(drp) > 0
    ORDER BY caption*/});

// listQuery.objectView = ml(function () {/*
//     SELECT {{INTOID}} AS oid,
//             COALESCE(attname,'') ||
//                 ' (' ||
//                     COALESCE(format_type(atttypid, atttypmod),'') ||
//                 ')',
//             '' AS schema_name,
//             'CL' AS bullet
//       FROM pg_catalog.pg_attribute
//      WHERE pg_attribute.attisdropped IS FALSE AND pg_attribute.attnum > 0
//       AND attrelid = {{INTOID}}
//   ORDER BY attnum ASC;
// */});



listQuery.objectView = ml(function () {/*

SELECT {{INTOID}} AS oid, 'Columns (' || COUNT(attname) || ')' AS caption, 'objectColumnList' AS obj_query
    FROM pg_attribute
    LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = attrelid
    WHERE attrelid = {{INTOID}} AND attname NOT LIKE '...%' AND attname NOT LIKE 'cmin' AND attname NOT LIKE 'cmax' AND attname NOT LIKE 'xmin' AND attname NOT LIKE 'xmax' AND attname NOT LIKE 'ctid' AND attname NOT LIKE 'tableoid'
        HAVING COUNT(attname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Indexes (' || COUNT(clidx.relname) || ')' AS caption, 'objectIndexList' AS obj_query
    FROM pg_class cl 
    JOIN pg_index idx ON cl.oid = idx.indrelid 
    JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
    LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
    WHERE (cl.oid = {{INTOID}} OR cl.relname = '{{STRSQLSAFENAME}}')
      AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0
        HAVING COUNT(clidx.relname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Triggers (' || COUNT(pg_trigger.tgname) || ')' AS caption, 'objectTriggerList' AS obj_query
    FROM pg_class 
    JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_class.oid = {{INTOID}} AND pg_trigger.tgisinternal != TRUE
    HAVING COUNT(pg_trigger.tgname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Constraints (' || COUNT(conname) || ')' AS caption, 'objectConstraintList' AS obj_query
         FROM 
            (SELECT oid, *
               FROM pg_constraint
              WHERE pg_constraint.conrelid = {{INTOID}} AND contype <> 't'
           ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                          WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                          WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                    pg_constraint.conname ASC) AS constrain
                    HAVING COUNT(conname) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Keys (' || COUNT(conname || ' ' || pg_get_constraintdef(oid, true)) || ')' AS caption, 'objectKeyList' AS obj_query
         FROM 
            (SELECT oid, *
               FROM pg_constraint
              WHERE pg_constraint.conrelid = {{INTOID}} AND pg_get_constraintdef(oid, true) ILIKE '%key%'
           ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                          WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                          WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                    pg_constraint.conname ASC) AS constrain
                    HAVING COUNT(conname || ' ' || pg_get_constraintdef(oid, true)) > 0
    UNION
    SELECT {{INTOID}} AS oid, 'Rules (' ||COUNT(drp) || ')' AS caption, 'objectRuleList' AS obj_query
        FROM ( SELECT pg_rewrite.rulename as drp
            FROM pg_class c
            LEFT JOIN pg_rewrite ON c.oid=pg_rewrite.ev_class
            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.oid = {{INTOID}}) AS rules
            HAVING COUNT(drp) > 0
    ORDER BY caption*/});



titleRefreshQuery.objectAggregate = titleRefreshQuery.aggregateNumber = ml(function () {/*
    SELECT count(proname) AS result
      FROM pg_aggregate ag
      JOIN pg_proc pr ON pr.oid = ag.aggfnoid
     WHERE pr.pronamespace = {{INTOID}};
*/});

titleRefreshQuery.objectCollation = titleRefreshQuery.collationNumber = ml(function () {/*
      SELECT count(collname) AS result
        FROM pg_collation
       WHERE collnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectConversion = titleRefreshQuery.conversionNumber = ml(function () {/*
      SELECT count(conname) AS result
        FROM pg_conversion
       WHERE connamespace = {{INTOID}};
*/});


titleRefreshQuery.objectDomain = titleRefreshQuery.domainNumber = ml(function () {/*
      SELECT count(typname) AS result
        FROM pg_type
       WHERE typtype = 'd' AND typnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectForeignTable = titleRefreshQuery.foreignTableNumber = ml(function () {/*
      SELECT count(relname) AS result
        FROM pg_foreign_table
   LEFT JOIN pg_class ON pg_class.oid = pg_foreign_table.ftrelid
       WHERE relnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectTextSearchConfiguration = titleRefreshQuery.TSConfigurationNumber = ml(function () {/*
    SELECT count(cfgname) AS result
      FROM pg_ts_config
     WHERE cfgnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectTextSearchDictionary = titleRefreshQuery.TSDictionaryNumber = ml(function () {/*
    SELECT count(dictname) AS result
      FROM pg_ts_dict
     WHERE dictnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectTextSearchParser = titleRefreshQuery.TSParserNumber = ml(function () {/*
    SELECT count(prsname) AS result
      FROM pg_ts_parser
     WHERE prsnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectTextSearchTemplate = titleRefreshQuery.TSTemplateNumber = ml(function () {/*
    SELECT count(tmplname) AS result
      FROM pg_ts_template
     WHERE tmplnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectFunction = titleRefreshQuery.functionNumber = ml(function () {/*
     SELECT count(proname) AS result
       FROM pg_proc pr
       JOIN pg_type typ ON typ.oid = pr.prorettype
      WHERE proisagg = FALSE AND typname <> 'trigger' AND pr.pronamespace = {{INTOID}};
*/});

titleRefreshQuery.objectIndex = titleRefreshQuery.indexNumber = ml(function () {/*
    SELECT count(relname)
      FROM pg_catalog.pg_class
     WHERE relkind = 'i' AND relnamespace = {{INTOID}};
*/});

titleRefreshQuery.objectOperator = titleRefreshQuery.operatorNumber = ml(function () {/*
     SELECT count(oprname) AS result
       FROM pg_operator
      WHERE pg_operator.oprnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectOperatorClass = titleRefreshQuery.operatorClassNumber = ml(function () {/*
    SELECT count(opcname) AS result
      FROM pg_opclass
     WHERE pg_opclass.opcnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectOperatorFamily = titleRefreshQuery.operatorFamilyNumber = ml(function () {/*
    SELECT count(opfname) AS result
      FROM pg_opfamily
     WHERE pg_opfamily.opfnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectSequence = titleRefreshQuery.sequenceNumber = ml(function () {/*
    SELECT count(relname)
      FROM pg_class
     WHERE relkind = 'S' AND pg_class.relnamespace = {{INTOID}};
*/});

titleRefreshQuery.objectConstraintList = titleRefreshQuery.constraintNumber = ml(function () {/*
SELECT count(conname || ' ' || pg_get_constraintdef(oid, true)) AS result
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.conrelid = {{INTOID}} AND contype <> 't'
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain;
*/});

titleRefreshQuery.objectTriggerList = titleRefreshQuery.triggerNumber = ml(function () {/*
SELECT COUNT(pg_trigger.tgname) AS result
    FROM pg_class 
    JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_class.oid = {{INTOID}} AND pg_trigger.tgisinternal != TRUE
*/});

titleRefreshQuery.objectRuleList = titleRefreshQuery.ruleNumber = ml(function () {/*
SELECT count(drp) AS result
        	FROM (SELECT pg_rewrite.rulename as drp
          FROM pg_class c
        LEFT JOIN pg_rewrite ON c.oid = pg_rewrite.ev_class
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.oid = {{INTOID}}) AS rules
*/});

titleRefreshQuery.objectIndexList = titleRefreshQuery.indexNumber = ml(function () {/*
SELECT count(clidx.relname) AS result
        FROM pg_class cl 
        JOIN pg_index idx ON cl.oid = idx.indrelid 
        JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
        LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
        WHERE (cl.oid = {{INTOID}} OR cl.relname = '{{STRSQLSAFENAME}}')
          AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0;
*/});

titleRefreshQuery.objectKeyList = titleRefreshQuery.keyNumber = ml(function () {/*
SELECT count(conname) AS result
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.conrelid = {{INTOID}} AND pg_get_constraintdef(oid, true) ILIKE '%key%'
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain;
*/});

titleRefreshQuery.objectColumnList = titleRefreshQuery.columnNumber = ml(function () {/*
SELECT count(attname) AS result
        FROM pg_attribute
        LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = attrelid
        WHERE attrelid = {{INTOID}} AND attname NOT LIKE '...%' AND attname NOT LIKE 'cmin' AND attname NOT LIKE 'cmax' AND attname NOT LIKE 'xmin' AND attname NOT LIKE 'xmax' AND attname NOT LIKE 'ctid' AND attname NOT LIKE 'tableoid';
*/});

titleRefreshQuery.objectTableList = titleRefreshQuery.tableNumber = ml(function () {/*
    SELECT count(relname) AS result
      FROM pg_class rel
     WHERE relkind IN ('r','s','t') AND rel.relnamespace = {{INTOID}};
*/});


titleRefreshQuery.objectTriggerFunction = titleRefreshQuery.triggerNumber = ml(function () {/*
    SELECT count(proname) AS result
      FROM pg_proc
      JOIN pg_type typ ON typ.oid=prorettype
     WHERE proisagg = FALSE AND typname = 'trigger' AND pg_proc.pronamespace = {{INTOID}};
*/});


titleRefreshQuery.objectType = titleRefreshQuery.typeNumber = ml(function () {/*
    SELECT count(pg_type.typname) AS result
      FROM pg_catalog.pg_type pg_type
 LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     WHERE (pg_type.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = pg_type.typrelid))
       AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
       AND (pg_type.typnamespace = {{INTOID}})
       AND (pg_type.typtype <> 'd');
*/});


titleRefreshQuery.objectViewList = titleRefreshQuery.viewNumber = ml(function () {/*
    SELECT count(c.relname) AS result
      FROM pg_class c
     WHERE ((c.relhasrules AND (EXISTS (
          SELECT r.rulename FROM pg_rewrite r
           WHERE r.ev_class = c.oid)))) AND c.relnamespace = {{INTOID}} AND (c.relkind = 'v' OR c.relkind = 'm');
    
    --SELECT count(pg_views.viewname) AS result
    --    FROM pg_views
    --        WHERE pg_views.schemaname = '{{INTOID}}'::regclass
*/});



listQuery.objectColumnList = ml(function () {/*
--SELECT {{INTOID}}, quote_ident(attname) AS name, schemaname AS schema_name, 'CL' AS bullet
--        FROM pg_attribute
--        LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = attrelid
--        WHERE attrelid = {{INTOID}} AND attname NOT LIKE '...%' AND attname NOT LIKE 'cmin' AND attname NOT LIKE 'cmax' AND attname NOT LIKE 'xmin' AND attname NOT LIKE 'xmax' AND attname NOT LIKE 'ctid' AND attname NOT LIKE 'tableoid'
--        ORDER BY attnum;

   SELECT {{INTOID}} AS oid, COALESCE(attname,'') || ' (' || CASE WHEN COALESCE(format_type(atttypid, atttypmod),'') = 'timestamp with time zone' THEN 'timestamptz' WHEN COALESCE(format_type(atttypid, atttypmod),'') ILIKE 'character varying%' THEN 'varchar' || substring(COALESCE(format_type(atttypid, atttypmod)), 18) ELSE COALESCE(format_type(atttypid, atttypmod),'') END || ')', '{{SCHEMA}}' AS schema_name, 'CL' AS bullet
       FROM pg_catalog.pg_attribute
      WHERE pg_attribute.attisdropped IS FALSE AND pg_attribute.attnum > 0
       AND attrelid = {{INTOID}}
   ORDER BY attnum ASC;
   
   
   
   
*/});

listQuery.objectTriggerList = ml(function () {/*
SELECT {{INTOID}}, quote_ident(pg_trigger.tgname) AS name, '{{SCHEMA}}' AS schema_name, 'TR' AS bullet
    FROM pg_class 
    JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_class.oid = {{INTOID}} AND pg_trigger.tgisinternal != TRUE
*/});

listQuery.objectRuleList = ml(function () {/*
SELECT {{INTOID}}, quote_ident(drp) AS name, '{{SCHEMA}}' AS schema_name, 'RL' AS bullet
        	FROM ( SELECT pg_rewrite.rulename as drp
          FROM pg_class c
        LEFT JOIN pg_rewrite ON c.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.oid = {{INTOID}}) AS rules
*/});

listQuery.objectConstraintList = ml(function () {/*
SELECT {{INTOID}}, quote_ident(conname) AS name, '{{SCHEMA}}' AS schema_name, 'CN' AS bullet
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.conrelid = {{INTOID}} AND contype <> 't'
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain
        ORDER BY name;
*/});

listQuery.objectKeyList = ml(function () {/*
SELECT constrain.oid, quote_ident(conname) AS name, '{{SCHEMA}}' AS schema_name, COALESCE(UPPER(contype), '') || 'K' AS bullet
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.conrelid = {{INTOID}} AND pg_get_constraintdef(oid, true) ILIKE '%key%'
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain;
*/});

listQuery.objectIndexList = ml(function () {/*
SELECT {{INTOID}}, quote_ident(clidx.relname) AS name, '{{SCHEMA}}' AS schema_name, 'IN' AS bullet
        FROM pg_class cl 
        JOIN pg_index idx ON cl.oid = idx.indrelid 
        JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
        LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
        WHERE (cl.oid = {{INTOID}} OR cl.relname = '{{STRSQLSAFENAME}}')
          AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0;
*/});

listQuery.objectTableList = ml(function () {/*
      SELECT pg_class.oid, quote_ident(relname) AS name, pg_namespace.nspname AS schema_name, '' AS bullet, 'TB' AS separate_bullet
        FROM pg_class
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
       WHERE relkind IN ('r','s','t') AND pg_class.relnamespace = {{INTOID}}
    ORDER BY relname;
*/});





listQuery.objectTriggerFunction = listQuery.triggers = ml(function () {/*
      SELECT pr.oid, quote_ident(pr.proname) || '()' AS name, pg_namespace.nspname AS schema_name, 'TF' AS bullet
        FROM pg_proc pr
        JOIN pg_type typ ON typ.oid = prorettype
   LEFT JOIN pg_namespace ON pg_namespace.oid = pr.pronamespace
       WHERE proisagg = FALSE AND typname = 'trigger' AND pr.pronamespace = {{INTOID}}
    ORDER BY proname;
*/});


listQuery.objectType = listQuery.types = ml(function () {/*
    SELECT pg_type.oid, quote_ident(pg_type.typname) AS name, pg_namespace.nspname AS schema_name, 'TY' AS bullet
      FROM pg_catalog.pg_type pg_type
 LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
       AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
       AND (pg_type.typnamespace = {{INTOID}})
       AND (pg_type.typtype <> 'd')
  ORDER BY pg_type.typname;
*/});


listQuery.objectViewList = listQuery.views = ml(function () {/*
      SELECT c.oid, quote_ident(c.relname) AS name, pg_namespace.nspname AS schema_name, '' AS bullet, CASE WHEN c.relkind = 'v' THEN 'VW' ELSE 'MV' END AS separate_bullet
        FROM pg_class c
   LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
       WHERE (
                (
                    c.relhasrules AND
                    (
                        EXISTS (
                            SELECT r.rulename
                              FROM pg_rewrite r
                             WHERE (
                                        (r.ev_class = c.oid) AND
                                        (bpchar(r.ev_type) = '1'::bpchar)
                                    )
                        )
                    )
                ) OR
                (c.relkind = 'v'::char) OR
                (c.relkind = 'm'::char)
            )
         AND c.relnamespace = {{INTOID}}
    ORDER BY relkind, relname;
*/});




listQuery.objectSequence = listQuery.sequences = ml(function () {/*
      SELECT pg_class.oid, quote_ident(pg_class.relname) AS name, pg_namespace.nspname AS schema_name, 'SQ' AS bullet
        FROM pg_class
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
       WHERE relkind = 'S' AND pg_class.relnamespace = {{INTOID}}
    ORDER BY pg_class.relname;
*/});

listQuery.objectCollation = listQuery.collations = ml(function () {/*
      SELECT pg_collation.oid, quote_ident(pg_collation.collname) AS name, pg_namespace.nspname AS schema_name, 'CL' AS bullet
        FROM pg_catalog.pg_collation
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
       WHERE pg_collation.collnamespace = {{INTOID}}
    ORDER BY pg_collation.collname;
*/});

listQuery.objectConversion = listQuery.conversions = ml(function () {/*
      SELECT pg_conversion.oid, quote_ident(pg_conversion.conname) AS name, pg_namespace.nspname AS schema_name, 'CN' AS bullet
        FROM pg_catalog.pg_conversion
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_conversion.connamespace
       WHERE pg_conversion.connamespace = {{INTOID}}
    ORDER BY pg_conversion.conname;
*/});

listQuery.objectOperator = listQuery.operators = ml(function () {/*
      SELECT pg_operator.oid,
             pg_operator.oprname || ' (' ||
                    format_type(pg_operator.oprleft, NULL) || ', ' ||
                    format_type(pg_operator.oprright, NULL) ||
                ')' AS name, 
             pg_namespace.nspname AS schema_name, 'OP' AS bullet
        FROM pg_operator
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_operator.oprnamespace
       WHERE pg_operator.oprnamespace = {{INTOID}}
    ORDER BY pg_operator.oprname || ' (' || format_type(pg_operator.oprleft, NULL) || ', ' || format_type(pg_operator.oprright, NULL) || ')';
*/});

listQuery.objectOperatorClass = listQuery.operatorclasses = ml(function () {/*
      SELECT pg_opclass.oid, quote_ident(opcname) AS name, pg_namespace.nspname AS schema_name, 'OC' AS bullet
        FROM pg_opclass
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_opclass.opcnamespace
       WHERE pg_opclass.opcnamespace = {{INTOID}}
    ORDER BY opcname;
*/});

listQuery.objectOperatorFamily = listQuery.operatorfamilies = ml(function () {/*
      SELECT pg_opfamily.oid, quote_ident(opfname) AS name, pg_namespace.nspname AS schema_name, 'OF' AS bullet
        FROM pg_opfamily
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_opfamily.opfnamespace
       WHERE pg_opfamily.opfnamespace = {{INTOID}}
    ORDER BY opfname;
*/});



listQuery.objectDomain = listQuery.domains = ml(function () {/*
      SELECT pg_type.oid, quote_ident(pg_type.typname) AS name, pg_namespace.nspname AS schema_name, 'DO' AS bullet
        FROM pg_type
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
       WHERE pg_type.typtype = 'd' AND pg_type.typnamespace = {{INTOID}}
    ORDER BY pg_type.typname;
*/});


listQuery.objectTextSearchConfiguration = listQuery.tsconfigurations = ml(function () {/*
      SELECT pg_ts_config.oid, quote_ident(pg_ts_config.cfgname) AS name, pg_namespace.nspname AS schema_name, 'TC' AS bullet
        FROM pg_ts_config
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_ts_config.cfgnamespace
       WHERE pg_ts_config.cfgnamespace = {{INTOID}}
    ORDER BY pg_ts_config.cfgname;
*/});


listQuery.objectForeignTable = listQuery.foreigntables = ml(function () {/*
      SELECT pg_class.oid, quote_ident(pg_class.relname) AS name, pg_namespace.nspname AS schema_name, 'FT' AS bullet
        FROM pg_foreign_table
   LEFT JOIN pg_class ON pg_class.oid = pg_foreign_table.ftrelid
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
       WHERE pg_class.relnamespace = {{INTOID}}
    ORDER BY pg_class.relname;
*/});


listQuery.objectTextSearchDictionary = listQuery.tsdictionaries = ml(function () {/*
      SELECT pg_ts_dict.oid, quote_ident(pg_ts_dict.dictname) AS name, pg_namespace.nspname AS schema_name, 'TD' AS bullet
        FROM pg_ts_dict
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_ts_dict.dictnamespace
       WHERE pg_ts_dict.dictnamespace = {{INTOID}}
    ORDER BY pg_ts_dict.dictname;
*/});


listQuery.objectTextSearchParser = listQuery.tsparsers = ml(function () {/*
      SELECT pg_ts_parser.oid, quote_ident(pg_ts_parser.prsname) AS name, pg_namespace.nspname AS schema_name, 'TP' AS bullet
        FROM pg_ts_parser
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_ts_parser.prsnamespace
       WHERE pg_ts_parser.prsnamespace = {{INTOID}}
    ORDER BY pg_ts_parser.prsname;
*/});


listQuery.objectTextSearchTemplate = listQuery.tstemplates = ml(function () {/*
      SELECT pg_ts_template.oid, quote_ident(pg_ts_template.tmplname) AS name, pg_namespace.nspname AS schema_name, 'TT' AS bullet
        FROM pg_ts_template
   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_ts_template.tmplnamespace
       WHERE pg_ts_template.tmplnamespace = {{INTOID}}
    ORDER BY pg_ts_template.tmplname;
*/});


listQuery.objectFunction = listQuery.functions = ml(function () {/*
      SELECT pr.oid,
             quote_ident(pr.proname) || '(' || COALESCE(pg_get_function_identity_arguments(pr.oid), '') || ')' AS name,
             pg_namespace.nspname AS schema_name, 'FN' AS bullet
        FROM pg_proc pr
        JOIN pg_type typ ON typ.oid = pr.prorettype
   LEFT JOIN pg_namespace ON pg_namespace.oid = pr.pronamespace
       WHERE pr.proisagg = FALSE
         AND typname <> 'trigger'
         AND pr.pronamespace = {{INTOID}}
    ORDER BY proname || '(' || COALESCE(pg_get_function_identity_arguments(pr.oid), '') || ')';
*/});

listQuery.objectIndex = listQuery.indexes = ml(function () {/*
    SELECT pg_class.oid, quote_ident(pg_class.relname) AS name, pg_namespace.nspname AS schema_name, 'IN' AS bullet
      FROM pg_catalog.pg_class
 LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
     WHERE relkind = 'i' AND relnamespace = {{INTOID}};
*/});


listQuery.objectAggregate = listQuery.aggregates = ml(function () {/*
       SELECT pr.oid,
              quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' AS name,
              pg_namespace.nspname AS schema_name, 'AG' AS bullet
         FROM pg_aggregate ag
         JOIN pg_proc pr ON pr.oid = ag.aggfnoid
    LEFT JOIN pg_namespace ON pg_namespace.oid = pr.pronamespace
        WHERE pr.pronamespace = {{INTOID}}
     ORDER BY proname || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')';
*/});


listQuery.objectGroup = listQuery.groups = ml(function () {/*
     SELECT pg_roles.oid, quote_ident(rolname) AS name, 'preview' AS type
       FROM pg_roles
      WHERE rolcanlogin = 'f'
   ORDER BY rolname ASC;
*/});


listQuery.objectLogin = listQuery.roles = ml(function () {/*
     SELECT pg_roles.oid, quote_ident(rolname) AS name, 'preview' AS type
       FROM pg_roles
      WHERE rolcanlogin = 't'
   ORDER BY rolname ASC;
*/});

listQuery.objectCast = listQuery.casts = ml(function () {/*
     SELECT pg_cast.oid, format_type(st.oid,NULL) || '->' || format_type(tt.oid,tt.typtypmod) AS name
       FROM pg_cast
       JOIN pg_type st ON st.oid = castsource
       JOIN pg_type tt ON tt.oid = casttarget
   ORDER BY name;
*/});


listQuery.objectLanguage = listQuery.languages = ml(function () {/*
     SELECT pg_language.oid, quote_ident(lanname) AS name, 'preview' AS type
       FROM pg_language;
      --WHERE lanname != 'internal' AND lanispl IS TRUE;
*/});

listQuery.objectExtension = listQuery.extensions = 'SELECT oid, quote_ident(extname) AS name FROM pg_catalog.pg_extension ORDER BY extname ASC;';
listQuery.objectTablespace = listQuery.tablespaces = 'SELECT oid, quote_ident(spcname) AS name FROM pg_catalog.pg_tablespace ORDER BY spcname ASC;';

listQuery.informationSchemaView = listQuery.ANSICatalog = ml(function () {/*
         SELECT c.oid, quote_ident(c.relname) AS name
           FROM pg_class c
      LEFT JOIN pg_namespace ON relnamespace=pg_namespace.oid
          WHERE pg_namespace.nspname = 'information_schema'
       ORDER BY name;
    */});


listQuery.objectForeignServer = listQuery.servers = ml(function () {/*
     SELECT oid, quote_ident(srvname) AS name
       FROM pg_foreign_server
   ORDER BY name;
*/});


listQuery.objectForeignDataWrapper = listQuery.fdw = ml(function () {/*
     SELECT oid, quote_ident(fdwname) AS name
       FROM pg_foreign_data_wrapper
   ORDER BY name;
*/});


associatedButtons.objectAggregate = ['propertyButton', 'dependButton'];
scriptQuery.objectAggregate = ml(function () {/*
    -- DROP statement
    SELECT (SELECT  '-- DROP AGGREGATE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' || E';\n\n'
    FROM pg_proc
    LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_proc.oid = {{INTOID}} AND proisagg)
    
    || (SELECT  'CREATE AGGREGATE ' || quote_ident(fnnsp.nspname) || '.' || quote_ident(fnpr.proname) || '(' || COALESCE(oidvectortypes(fnpr.proargtypes), '') || ') (' 
    	|| rtrim(
    		CASE WHEN aggtransfn    IS NOT NULL     THEN E'\n  SFUNC='    ||
    	            CASE WHEN sfnsp.nspname != 'pg_catalog' THEN quote_ident(sfnsp.nspname) || '.' ELSE '' END || quote_ident(sfpr.proname)
    	            || ',' ELSE '' END ||
    		CASE WHEN format_type(aggtranstype::oid, null) IS NOT NULL THEN E'\n  STYPE='     || format_type(aggtranstype::oid, null) || ',' ELSE '' END ||
    		CASE WHEN aggfinalfn   != '-'::regproc THEN E'\n  FINALFUNC=' ||
    		        CASE WHEN flnsp.nspname != 'pg_catalog' THEN quote_ident(flnsp.nspname) || '.' ELSE '' END || quote_ident(flpr.proname)
    		        || ',' ELSE '' END ||
    		CASE WHEN agginitval   IS NOT NULL     THEN E'\n  INITCOND='  || quote_literal(agginitval)   || ',' ELSE '' END ||
    		CASE WHEN aggsortop    != 0            THEN E'\n  SORTOP='    ||
    		        CASE WHEN opnsp.nspname != '' THEN quote_ident(opnsp.nspname) || '.' ELSE '' END || quote_ident(pg_operator.oprname) ||
    		        ' (' || format_type(oprleft, NULL) || ', ' || format_type(oprright, NULL) || ')' || ',' ELSE '' END
                        , ',') || E'\n);\n\n'
    FROM pg_aggregate
    LEFT JOIN pg_proc       fnpr      ON fnpr.oid      = pg_aggregate.aggfnoid
    LEFT JOIN pg_namespace  fnnsp     ON fnnsp.oid = fnpr.pronamespace
    LEFT JOIN pg_proc       sfpr      ON sfpr.oid      = pg_aggregate.aggtransfn
    LEFT JOIN pg_namespace  sfnsp     ON sfnsp.oid = sfpr.pronamespace
    LEFT JOIN pg_proc       flpr      ON flpr.oid      = pg_aggregate.aggfinalfn
    LEFT JOIN pg_namespace  flnsp     ON flnsp.oid = flpr.pronamespace
    LEFT JOIN pg_operator        ON pg_operator.oid  = pg_aggregate.aggsortop
    LEFT JOIN pg_namespace opnsp ON opnsp.oid = pg_operator.oprnamespace
    WHERE fnpr.oid = {{INTOID}} AND fnpr.proisagg)
    
    -- OWNER
    || (SELECT E'ALTER AGGREGATE ' || COALESCE(quote_ident(nspname),'') || '.' || COALESCE(quote_ident(proname),'') || '(' || COALESCE(oidvectortypes(proargtypes), '') || ') OWNER TO ' || pg_roles.rolname || ';'
    FROM pg_aggregate
    JOIN pg_proc ON pg_proc.oid = pg_aggregate.aggfnoid
    LEFT JOIN pg_roles ON pg_proc.proowner=pg_roles.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_proc.oid = {{INTOID}} AND proisagg) 
    
    -- grants:
    || CASE WHEN (SELECT count(*)
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg) em
    	WHERE acl::text like '=%') > 0

        THEN (SELECT array_to_string(array_agg(E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
        	|| ' TO ' || substring(acl from 0 for strpos(acl, '=')) || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END),',')
        	FROM (SELECT acl, name FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' as name
        		FROM pg_proc 
        		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        		WHERE pg_proc.oid = {{INTOID}} AND proisagg) em
        	WHERE acl::text not like '=%'
            ORDER BY acl) em) 
        
        ELSE '' END
    
    || CASE WHEN -- public exists?
    	(SELECT count(*)
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg) em
    	WHERE acl::text like '=%') >0 
    
       THEN
    	-- public grant:
    	(SELECT E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
    		|| ' TO public' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg) em
    	WHERE acl::text like '=%')
    
       ELSE
    	-- public revoke
    	(SELECT E'\nREVOKE ALL ON FUNCTION ' || name || ' FROM public;'
    	FROM (SELECT quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(oidvectortypes(proargtypes), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg) em)
       END;
    */});

associatedButtons.objectTrigger = [];
scriptQuery.objectTrigger = ml(function () {/*
    SELECT 
            -- DROP statement
            (
                SELECT  '-- Trigger: ' ||
                                quote_ident(pg_trigger.tgname) || ' ON ' ||
                                quote_ident(pg_namespace.nspname) || '.' ||
                                quote_ident(pg_class.relname) || E';\n\n' || 
                        '-- DROP TRIGGER ' ||
                                quote_ident(pg_trigger.tgname) || ' ON ' ||
                                quote_ident(pg_namespace.nspname) || '.' ||
                                quote_ident(pg_class.relname) || E';\n'
                  FROM pg_trigger
                  JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
                  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                 WHERE (
                            pg_trigger.oid = {{INTOID}}
                         OR pg_namespace.nspname || '.' || pg_trigger.tgname = '{{STRSQLSAFENAME}}'
                       )
                   AND pg_trigger.tgisinternal != TRUE
            )
            
            -- CREATE STATEMENT
            || (
                SELECT regexp_replace(
                            regexp_replace(
                                regexp_replace(
                                    regexp_replace(
                                        pg_get_triggerdef(pg_trigger.oid, true),
                                        ' BEFORE ', E'\n   BEFORE '
                                    ),
                                    ' ON ', E'\n   ON '
                                ),
                                ' FOR ', E'\n   FOR '
                            ),
                            ' EXECUTE ', E'\n   EXECUTE '
                        ) || E';\n\n'
                  FROM pg_trigger
                  JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
                  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                 WHERE (
                            pg_trigger.oid = {{INTOID}}
                         OR pg_namespace.nspname || '.' || pg_trigger.tgname = '{{STRSQLSAFENAME}}'
                       )
                   AND pg_trigger.tgisinternal != TRUE
            );
    */});




associatedButtons.objectFunction = ['propertyButton', 'dependButton'];
scriptQuery.objectTriggerFunction = scriptQuery.objectFunction = ml(function () {/*
    ---- DROP statement
    --SELECT (SELECT  '-- DROP FUNCTION ' || quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' || E';\n\n'
    --FROM pg_proc
    --LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    --
    ---- CREATE STATEMENT
    --|| (SELECT  'CREATE OR REPLACE FUNCTION ' || quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') 
    --	|| E')\n  RETURNS ' || pg_get_function_result(pg_proc.oid) || E' AS\n'
    --	|| CASE WHEN prolang = '12' THEN
    --		'    ' || quote_literal(prosrc) || E'\n'
    --	    WHEN prolang = '13' THEN
    --		'    ' || quote_literal(probin) || ', ' || quote_literal(prosrc) || E'\n'
    --	    ELSE
    --		'$BODY$' || prosrc || E'$BODY$\n'
    --	    END
    --	||'  LANGUAGE ' || quote_ident(lanname) 
    --	|| CASE WHEN provolatile = 'v' THEN
    --		' VOLATILE'
    --	    WHEN provolatile = 'i' THEN
    --		' IMMUTABLE'
    --	    WHEN provolatile = 's' THEN
    --		' STABLE'
    --	    END
    --	|| CASE WHEN prosecdef THEN ' SECURITY DEFINER' ELSE '' END
    --	|| CASE WHEN proisstrict THEN E' STRICT\n' ELSE E'\n' END
    --	|| E'  COST ' || procost ||
    --	CASE WHEN prorows <> 0 THEN E'\n  ROWS ' || prorows ELSE '' END || E';\n\n'
    --FROM pg_proc 
    --LEFT JOIN pg_language ON pg_language.oid = pg_proc.prolang
    --LEFT JOIN pg_namespace ON pg_namespace.oid=pg_proc.pronamespace
    --WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    --
    ---- OWNER
    --|| (SELECT E'ALTER FUNCTION ' || COALESCE(quote_ident(nspname),'') || '.' || COALESCE(quote_ident(proname),'') || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ') OWNER TO ' || pg_roles.rolname || ';'
    --FROM pg_proc
    --LEFT JOIN pg_roles ON pg_proc.proowner=pg_roles.oid
    --JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    --WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    --
    ---- grants:
    --|| CASE WHEN (SELECT count(*)
    --	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' as name
    --		FROM pg_proc 
    --		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    --	WHERE acl::text not like '=%') > 0
    
    --    THEN (SELECT array_to_string(array_agg(E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
    --    	|| ' TO ' || substring(acl from 0 for strpos(acl, '=')) || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END),'')
    --    	FROM (SELECT acl, name FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' as name
    --    		FROM pg_proc 
    --    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --    		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    --    	WHERE acl::text not like '=%'
    --        ORDER BY acl) em) 
    --    
    --    ELSE '' END
    --
    --|| CASE WHEN -- public exists?
    --	(SELECT count(*)
    --	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' as name
    --		FROM pg_proc 
    --		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    --	WHERE acl::text like '=%') > 0 
    --
    --   THEN
    --	-- public grant:
    --	(SELECT E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
    --		|| ' TO public' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END
    --	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' as name
    --		FROM pg_proc 
    --		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    --	WHERE acl::text like '=%')
    --
    --   ELSE
    --	-- public revoke
    --	(SELECT E'\nREVOKE ALL ON FUNCTION ' || name || ' FROM public;'
    --	FROM (SELECT quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' as name
    --		FROM pg_proc 
    --		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em)
    --   END
    --
    ---- COMMENT
    --|| (SELECT CASE WHEN description IS NOT NULL THEN E'\n\nCOMMENT ON FUNCTION ' 
    --	|| quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' 
    --	|| $$ IS '$$ || description || $$';$$ ELSE '' END 
    --	FROM pg_proc 
    --	LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --	LEFT JOIN pg_description ON pg_proc.oid=pg_description.objoid
    --	WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    --	
    ---- SELECT
    --|| (SELECT CASE WHEN typname != 'trigger' THEN E'\n\n--SELECT ' 
    --	|| quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')' 
    --	|| E';\n' ELSE '' END 
    --	FROM pg_proc 
    --	LEFT JOIN pg_type ON pg_type.oid = pg_proc.prorettype
    --	LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    --	LEFT JOIN pg_description ON pg_proc.oid=pg_description.objoid
    --	WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE);
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    	-- DROP statement
    SELECT (SELECT  '-- DROP FUNCTION ' || quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' || E';\n\n'
    FROM pg_proc
    LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    
    -- CREATE STATEMENT
    || (SELECT  'CREATE OR REPLACE FUNCTION ' || quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') 
    	|| E')\n  RETURNS ' || pg_get_function_result(pg_proc.oid) || E' AS\n'
    	|| CASE WHEN prolang = '12' THEN
    		'    ' || quote_literal(prosrc) || E'\n'
    	    WHEN prolang = '13' THEN
    		'    ' || quote_literal(probin) || ', ' || quote_literal(prosrc) || E'\n'
    	    ELSE
    		'$BODY$' || prosrc || E'$BODY$\n'
    	    END
    	||'  LANGUAGE ' || quote_ident(lanname) 
    	|| CASE WHEN provolatile = 'v' THEN
    		' VOLATILE'
    	    WHEN provolatile = 'i' THEN
    		' IMMUTABLE'
    	    WHEN provolatile = 's' THEN
    		' STABLE'
    	    END
    	|| CASE WHEN prosecdef THEN ' SECURITY DEFINER' ELSE '' END
    	|| CASE WHEN proisstrict THEN E' STRICT\n' ELSE E'\n' END
    	|| E'  COST ' || procost ||
    	CASE WHEN prorows <> 0 THEN E'\n  ROWS ' || prorows ELSE '' END || E';\n\n'
    FROM pg_proc 
    LEFT JOIN pg_language ON pg_language.oid = pg_proc.prolang
    LEFT JOIN pg_namespace ON pg_namespace.oid=pg_proc.pronamespace
    WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    
    -- OWNER
    || (SELECT E'ALTER FUNCTION ' || COALESCE(quote_ident(nspname),'') || '.' || COALESCE(quote_ident(proname),'') || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ') OWNER TO ' || pg_roles.rolname || ';'
    FROM pg_proc
    LEFT JOIN pg_roles ON pg_proc.proowner=pg_roles.oid
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    
    -- grants:
    || CASE WHEN (SELECT count(*)
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    	WHERE acl::text not like '=%') > 0

        THEN (SELECT array_to_string(array_agg(E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
        	|| ' TO ' || substring(acl from 0 for strpos(acl, '=')) || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END),'')
        	FROM (SELECT acl, name FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' as name
        		FROM pg_proc 
        		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
        	WHERE acl::text not like '=%'
            ORDER BY acl) em) 
        
        ELSE '' END
    
    || CASE WHEN -- public exists?
    	(SELECT count(*)
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    	WHERE acl::text like '=%') > 0 
    
       THEN
    	-- public grant:
    	(SELECT E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
    		|| ' TO public' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END
    	FROM (SELECT unnest(proacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em
    	WHERE acl::text like '=%')
    
       ELSE
    	-- public revoke
    	(SELECT E'\nREVOKE ALL ON FUNCTION ' || name || ' FROM public;'
    	FROM (SELECT quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' as name
    		FROM pg_proc 
    		LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    		WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE) em)
       END
    
    -- COMMENT
    || (SELECT CASE WHEN description IS NOT NULL THEN E'\n\nCOMMENT ON FUNCTION ' 
    	|| quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' 
    	|| $$ IS '$$ || description || $$';$$ ELSE '' END 
    	FROM pg_proc 
    	LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    	LEFT JOIN pg_description ON pg_proc.oid=pg_description.objoid
    	WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE)
    	
    -- SELECT
    || (SELECT CASE WHEN typname != 'trigger' THEN E'\n\n--SELECT ' || CASE WHEN pg_get_function_result(pg_proc.oid) ILIKE '%setof%' OR pg_get_function_result(pg_proc.oid) ILIKE '%table%' THEN '* FROM ' ELSE '' END
    	|| quote_ident(nspname) || '.' || quote_ident(proname) || '(' || COALESCE(pg_get_function_identity_arguments(pg_proc.oid), '') || ')' 
    	|| E';\n' ELSE '' END 
    	FROM pg_proc 
    	LEFT JOIN pg_type ON pg_type.oid = pg_proc.prorettype
    	LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    	LEFT JOIN pg_description ON pg_proc.oid=pg_description.objoid
    	WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE);
    */});


// associatedButtons.objectIndex = ['propertyButton', 'dependButton'];
// scriptQuery.objectIndex = ml(function () {/*
//     SELECT '-- Index: ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_index_class.relname)) || E';\n\n' ||
//           '-- DROP INDEX ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_index_class.relname)) || E';\n\n' ||
//           CASE WHEN pg_index.indisvalid THEN '' ELSE E'-- INVALID INDEX. Postgres ignores this index when you query the index''s target, but it still adds overhead to updates.\n' END || pg_get_indexdef(pg_index.indexrelid) || E';\n'
//     FROM pg_catalog.pg_class
//     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
//     LEFT JOIN pg_catalog.pg_index ON pg_index.indrelid = pg_class.oid
//     LEFT JOIN pg_catalog.pg_class pg_index_class ON pg_index.indexrelid = pg_index_class.oid
//     LEFT JOIN pg_catalog.pg_namespace pg_index_class_namespace ON pg_index_class_namespace.oid = pg_index_class.relnamespace
//     WHERE pg_index_class.relkind = 'i' AND pg_index_class.oid = {{INTOID}};
// */});

associatedButtons.objectIndex = ['propertyButton', 'dependButton'];
scriptQuery.objectIndex = ml(function () {/*
SELECT '-- Index: ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_index_class.relname)) || E';\n\n' ||
           '-- DROP INDEX ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_index_class.relname)) || E';\n\n' ||
           CASE WHEN pg_index.indisvalid THEN '' ELSE E'-- INVALID INDEX. Postgres ignores this index when you query the index''s target, but it still adds overhead to updates.\n' END || pg_get_indexdef(pg_index.indexrelid) || E';\n'
    FROM pg_catalog.pg_class
    LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    LEFT JOIN pg_catalog.pg_index ON pg_index.indrelid = pg_class.oid
    LEFT JOIN pg_catalog.pg_class pg_index_class ON pg_index.indexrelid = pg_index_class.oid
    LEFT JOIN pg_catalog.pg_namespace pg_index_class_namespace ON pg_index_class_namespace.oid = pg_index_class.relnamespace
    WHERE pg_index_class.relkind = 'i' AND pg_namespace.nspname || '.' || pg_index_class.relname = '{{STRSQLSAFENAME}}';
*/});

associatedButtons.objectKey = ['propertyButton', 'dependButton'];
scriptQuery.objectKey = ml(function () {/*
SELECT '-- Constraint: ' || conname || E';\n\n' ||
    '-- ALTER TABLE ' || '{{SCHEMA}}.' || pg_class.relname || ' DROP CONSTRAINT ' || conname || E';\n' ||
    '-- ALTER TABLE ' || '{{SCHEMA}}.' || pg_class.relname || ' ADD CONSTRAINT ' || conname || ' ' || pg_get_constraintdef(oid, true) || E';\n'
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.oid = {{INTOID}}
                ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain
                        
            LEFT JOIN pg_class ON pg_class.relfilenode = conrelid
            LIMIT 1;
*/});


associatedButtons.objectRole = ['propertyButton', 'dependButton'];
scriptQuery.objectRole = ml(function () {/*
        SELECT '-- Role: ' || quote_ident(r.rolname) || E'\n\n-- DROP ROLE ' || quote_ident(r.rolname) || E';\n\n' ||
                'CREATE ROLE ' || quote_ident(r.rolname) ||
                E'\n    ' || CASE WHEN r.rolcanlogin        THEN E'LOGIN\n    PASSWORD ''*******''' ELSE 'NOLOGIN' END ||
                E'\n    ' || CASE WHEN NOT r.rolcreaterole  THEN 'NO' ELSE '' END || 'CREATEROLE' || 
                E'\n    ' || CASE WHEN NOT r.rolsuper       THEN 'NO' ELSE '' END || 'SUPERUSER' || 
                E'\n    ' || CASE WHEN NOT r.rolinherit     THEN 'NO' ELSE '' END || 'INHERIT' || 
                E'\n    ' || CASE WHEN NOT r.rolcreatedb    THEN 'NO' ELSE '' END || 'CREATEDB' || 
                E'\n    ' || CASE WHEN NOT r.rolreplication THEN 'NO' ELSE '' END || 'REPLICATION' || 
                E'\n    CONNECTION LIMIT ' || r.rolconnlimit ||
                
                E'\n    VALID UNTIL ' || CASE WHEN r.rolvaliduntil is null
                                                OR length(r.rolvaliduntil::date::text) < 1
                                                OR r.rolvaliduntil = 'infinity'
                                              THEN E'\'infinity\''
                                              ELSE r.rolvaliduntil::date::text
                                         END || ';' ||
                E'\n' ||
                COALESCE(
                    (
                        SELECT array_to_string(array_agg(E'\nALTER ROLE ' || quote_ident(r.rolname) || ' SET ' || em.unnest || ';'), '')
                          FROM (
                                SELECT DISTINCT unnest(s.setconfig)
                            ) em
                    ), '') ||
                COALESCE(
                    (
                        SELECT array_to_string(array_agg(E'\nGRANT ' || quote_ident(em.unnest) || ' TO ' || quote_ident(r.rolname) || ';'), '')
                          FROM (
                                SELECT DISTINCT unnest(array_agg(g.rolname))
                            ) em
                    ), '') ||
                COALESCE(E'\n\n/*' ||
                    NULLIF((
                        SELECT array_to_string(array_agg(E'\nGRANT ' || quote_ident(r.rolname) || ' TO ' || quote_ident(em.unnest) || ';'), '')
                          FROM (
                                SELECT DISTINCT unnest(array_agg(og.rolname))
                            ) em
                    ), '') || E'\n*' || '/', '')
           FROM pg_roles r
      LEFT JOIN pg_auth_members m ON r.oid = m.member
      LEFT JOIN pg_roles g ON g.oid = m.roleid
      LEFT JOIN pg_auth_members om ON r.oid = om.roleid
      LEFT JOIN pg_roles og ON og.oid = om.member
      LEFT JOIN pg_db_role_setting s ON r.oid = s.setrole
      LEFT JOIN pg_database d ON d.oid = s.setdatabase
          WHERE r.oid = {{INTOID}} -- OR r.rolname = '{{STRSQLSAFENAME}}' -- errs when single quote in name
       GROUP BY r.oid, r.rolname, r.rolcanlogin, r.rolcreaterole, r.rolsuper, r.rolinherit, r.rolcreatedb,
                r.rolreplication, r.rolconnlimit, r.rolvaliduntil, s.setconfig;
    */});

associatedButtons.objectLanguage = ['propertyButton', 'dependButton'];
scriptQuery.objectLanguage = ml(function () {/*
    SELECT
        -- name line / drop line / create line
        (
               SELECT '-- Language: ' || quote_ident(pg_language.lanname) || E'\n\n' ||
                      '-- LANGUAGE ' || quote_ident(pg_language.lanname) || E';\n\n' ||
                      'CREATE LANGUAGE ' || quote_ident(pg_language.lanname)
                 FROM pg_language
                WHERE pg_language.oid = '{{INTOID}}'
        ) ||
        
        -- handler line / inline line / validator line
        (
               SELECT CASE WHEN hndlr_proc.proname IS NOT NULL
                           THEN E'\n    HANDLER ' || (quote_ident(hndlr_nsp.nspname) || '.' ||
                                                      quote_ident(hndlr_proc.proname)) ELSE '' END ||
                      CASE WHEN inlne_proc.proname IS NOT NULL
                           THEN E'\n    INLINE ' || (quote_ident(inlne_nsp.nspname) || '.' ||
                                                      quote_ident(inlne_proc.proname)) ELSE '' END ||
                      CASE WHEN vlidtr_proc.proname IS NOT NULL
                           THEN E'\n    VALIDATOR ' || (quote_ident(vlidtr_nsp.nspname) || '.' ||
                                                      quote_ident(vlidtr_proc.proname)) ELSE '' END
                 FROM pg_language
            LEFT JOIN pg_proc hndlr_proc ON hndlr_proc.oid = pg_language.lanplcallfoid
            LEFT JOIN pg_namespace hndlr_nsp ON hndlr_nsp.oid = hndlr_proc.pronamespace
            LEFT JOIN pg_proc inlne_proc ON inlne_proc.oid = pg_language.laninline
            LEFT JOIN pg_namespace inlne_nsp ON inlne_nsp.oid = inlne_proc.pronamespace
            LEFT JOIN pg_proc vlidtr_proc ON vlidtr_proc.oid = pg_language.lanvalidator
            LEFT JOIN pg_namespace vlidtr_nsp ON vlidtr_nsp.oid = vlidtr_proc.pronamespace
                WHERE pg_language.oid = '{{INTOID}}'
        ) ||
        
        -- end semicolon
        (';') ||
        
        -- owner
        (
               SELECT E'\n\nALTER LANGUAGE ' || (quote_ident(pg_language.lanname)) || ' OWNER TO ' || quote_ident(pg_roles.rolname) || E';'
                 FROM pg_language
            LEFT JOIN pg_roles ON pg_roles.oid = pg_language.lanowner
                WHERE pg_language.oid = '{{INTOID}}'
        ) ||
        
        -- grants
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U($|[^*])' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON LANGUAGE ' ||
                                        quote_ident(pg_language.lanname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ';'
                                ),
                                E'\n'
                            )
                       FROM unnest(lanacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)($|[^*])'
                    )
              FROM pg_language
             WHERE pg_language.oid = {{INTOID}}
        ), '') ||
        
        -- grants with grant options
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U\*' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON LANGUAGE ' ||
                                        quote_ident(pg_language.lanname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ' WITH GRANT OPTION;'
                                ),
                                E'\n'
                            )
                       FROM unnest(lanacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)\*'
                    )
              FROM pg_language
             WHERE pg_language.oid = {{INTOID}}
        ), '') ||
        
        -- comment
        (
               SELECT CASE WHEN description IS NOT NULL
                           THEN E'\n\nCOMMENT ON LANGUAGE ' ||
                                        (quote_ident(pg_language.lanname)) || ' IS ' ||
                                        quote_literal(pg_description.description) || ';' ELSE '' END
                 FROM pg_language
            LEFT JOIN pg_description ON pg_description.objoid = pg_language.oid
                WHERE pg_language.oid = '{{INTOID}}'
        );
    */});

associatedButtons.objectSchema = ['propertyButton', 'dependButton', 'dumpButton'];
scriptQuery.objectSchema = ml(function () {/*  
        SELECT (SELECT '-- DROP SCHEMA ' || quote_ident(nspname) || E';\n\n' ||
          'CREATE SCHEMA ' || quote_ident(nspname) || E'\n  AUTHORIZATION ' || quote_ident(pg_roles.rolname) || E';\n' ||
          COALESCE(E'\nCOMMENT ON SCHEMA '|| quote_ident(nspname) || ' IS ' || quote_literal(pg_description.description) || E';\n', '') || E'\n' ||
          
        	COALESCE((SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U($|[^*])' THEN 'USAGE' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'C($|[^*])' THEN 'CREATE' END ) em
        		WHERE perms is not null),',')) ||
        	' ON SCHEMA ' || quote_ident(nspname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || 
        	E';'), E'\n')
        	FROM unnest(nspacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U|C)($|[^*])' 
        	),'') ||
            
        	COALESCE((SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U\*' THEN 'USAGE' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'C\*' THEN 'CREATE' END ) em
        		WHERE perms is not null),',')) ||
        	' ON SCHEMA ' || quote_ident(nspname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || 
        	E' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(nspacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U|C)\*' 
        	),'')
        FROM pg_catalog.pg_namespace nsp
        LEFT JOIN pg_roles ON pg_roles.oid = nsp.nspowner
        LEFT JOIN pg_description ON pg_description.objoid = nsp.oid
        WHERE nsp.oid = {{INTOID}})
        
        || COALESCE((SELECT array_to_string(array_agg(
        	(SELECT array_to_string((SELECT array_agg('ALTER DEFAULT PRIVILEGES IN SCHEMA ' || quote_ident(nspname) || E'\n   GRANT ' || ok) FROM 
        	    (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt) 
        		FROM (  SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        			UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        			UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        			UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        			UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        			UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        			UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END) em
        			WHERE perms is not null),',') ||
        	' ON ' || ' ' || E'\n   TO ' ||
              	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' 
        		ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || E';\n' as ok
        
        	FROM unnest(defaclacl)
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])') as em),'')
        	)
        	),'')
        
        FROM pg_default_acl
        LEFT JOIN pg_namespace ON pg_default_acl.defaclnamespace = pg_namespace.oid
        WHERE defaclnamespace = {{INTOID}}),'')
        
        || COALESCE((SELECT array_to_string(array_agg(
        	(SELECT array_to_string((SELECT array_agg('ALTER DEFAULT PRIVILEGES IN SCHEMA ' || quote_ident(nspname) || E'\n   GRANT ' || ok) FROM 
        	    (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt) 
        		FROM (  SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        			UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        			UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        			UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        			UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        			UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        			UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END) em
        			WHERE perms is not null),',') ||
        	' ON ' || ' ' || E'\n   TO ' ||
              	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' 
        		ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || E';\n' as ok
        
        	FROM unnest(defaclacl)
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*') as em),'')
        	)
        	),'')
        
        FROM pg_default_acl
        LEFT JOIN pg_namespace ON pg_default_acl.defaclnamespace = pg_namespace.oid
        WHERE defaclnamespace = {{INTOID}}),'');
    */});

associatedButtons.objectCollation = ['propertyButton', 'dependButton'];
scriptQuery.objectCollation = ml(function () {/*  
    SELECT 
        -- ######### top comments #########
        (SELECT '-- Collation: ' || (quote_ident(nspname) || '.' || quote_ident(collname)) || E';\n\n' ||
                '-- DROP COLLATION ' || (quote_ident(nspname) || '.' || quote_ident(collname)) || E';\n\n'
           FROM pg_catalog.pg_collation
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
          WHERE pg_collation.oid = {{INTOID}}::oid -- OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'
                                                    ) ||
        
        -- ############ CREATE ############
        (SELECT 'CREATE COLLATION ' || (quote_ident(nspname) || '.' || quote_ident(collname)) || E'\n'
           FROM pg_catalog.pg_collation
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
          WHERE pg_collation.oid = {{INTOID}}::oid -- OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'
                                                    ) ||
        
        -- ########## parameters ##########
        (SELECT E'\t(LC_COLLATE=''' || collcollate || ''', LC_CTYPE=''' || collctype || E''');\n\n'
           FROM pg_catalog.pg_collation
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
          WHERE pg_collation.oid = {{INTOID}}::oid -- OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'
                                                    ) ||
        
        -- ############ ALTER ############
        (SELECT 'ALTER COLLATION ' || (quote_ident(nspname) || '.' || quote_ident(collname)) ||
                                        ' OWNER TO ' || rolname || E';\n'
           FROM pg_catalog.pg_collation
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
      LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_collation.collowner
          WHERE pg_collation.oid = {{INTOID}}::oid -- OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'
                                                    ) ||
        
        -- ########### COMMENT ###########
        COALESCE(
            (SELECT E'\nCOMMENT ON COLLATION ' || (quote_ident(nspname) || '.' || quote_ident(collname)) ||
                                        ' IS ' || quote_literal(description) || E';\n\n'
           FROM pg_catalog.pg_collation
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_collation.collnamespace
      LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_collation.oid
          WHERE pg_collation.oid = {{INTOID}}::oid -- OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'
                                                    ), '');
    */});
          //WHERE pg_collation.oid = {{INTOID}}::oid) ||
          //WHERE pg_collation.oid = {{INTOID}}::oid OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}') ||
          //WHERE pg_collation.oid = {{INTOID}}::oid OR (nspname || '.' || collname) = '{{STRSQLSAFENAME}}'))

associatedButtons.objectConversion = ['propertyButton', 'dependButton'];
scriptQuery.objectConversion = ml(function () {/*
SELECT
        -- ######### top comments #########
    (SELECT '-- Conversion: ' || (quote_ident(nspname) || '.' || quote_ident(conname)) || E';\n\n' ||
            '-- DROP CONVERSION ' || (quote_ident(nspname) || '.' || quote_ident(conname)) || E';\n\n'
    FROM pg_conversion
    LEFT JOIN pg_namespace ON pg_conversion.connamespace = pg_namespace.oid
    WHERE pg_conversion.oid = {{INTOID}}::oid) ||
        
        -- ######### CREATE #########
    (SELECT 'CREATE' || (CASE WHEN condefault THEN ' DEFAULT' ELSE ' ' END) || ' CONVERSION ' || (quote_ident(nspname) || '.' || quote_ident(conname))
    FROM pg_conversion
    LEFT JOIN pg_namespace ON pg_conversion.connamespace = pg_namespace.oid
    WHERE pg_conversion.oid = {{INTOID}}::oid) ||
        
        -- ######### parameters #########
    (SELECT E'\n  FOR ''' || pg_encoding_to_char(conforencoding) ||
        E'''\n  TO ''' || pg_encoding_to_char(contoencoding) ||
        E'''\n  FROM ' || conproc::regproc::text || E';\n\n'::text
    FROM pg_conversion
    LEFT JOIN pg_namespace ON pg_conversion.connamespace = pg_namespace.oid
    WHERE pg_conversion.oid = {{INTOID}}::oid) ||
        
        -- ############ ALTER ############
        (SELECT 'ALTER CONVERSION ' || (quote_ident(nspname) || '.' || quote_ident(conname)) ||
                                        ' OWNER TO ' || rolname || E';\n'
           FROM pg_catalog.pg_conversion
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_conversion.connamespace
      LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_conversion.conowner
          WHERE pg_conversion.oid = {{INTOID}}::oid) ||
        
        -- ########### COMMENT ###########
        COALESCE(
            (SELECT E'\nCOMMENT ON CONVERSION ' || (quote_ident(nspname) || '.' || quote_ident(conname)) ||
                                        ' IS ' || quote_literal(description) || E';\n\n'
           FROM pg_catalog.pg_conversion
      LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_conversion.connamespace
      LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_conversion.oid
          WHERE pg_conversion.oid = {{INTOID}}::oid), '');
*/});



associatedButtons.objectOperator = ['propertyButton', 'dependButton'];
// smooooooth
scriptQuery.objectOperator = ml(function () {/*  
        SELECT '-- Operator: ' || nsp.nspname || '.' || op.oprname || 
        	'(' || format_type(op.oprleft, NULL) || ', ' || format_type(op.oprright, NULL) || ');' ||
        	E'\n\n-- DROP OPERATOR ' || nsp.nspname || '.' || op.oprname || 
        	'(' || format_type(op.oprleft, NULL) || ', ' || format_type(op.oprright, NULL) || ');' ||
        	E'\n\nCREATE OPERATOR ' || nsp.nspname || '.' || op.oprname || 
        	E' (\n   PROCEDURE = ' || op.oprcode ||
        	E',\n   LEFTARG = ' || format_type(op.oprleft, null) ||
        	E',\n   RIGHTARG = ' || format_type(op.oprright, null) ||  ');' ||
        	E'\n\nALTER OPERATOR ' || nsp.nspname || '.' || op.oprname || '(' || format_type(op.oprleft, null) || ', ' || format_type(op.oprright, null) || ') OWNER TO ' || rol.rolname || ';'
        FROM pg_operator op 
        JOIN pg_namespace nsp ON nsp.oid = op.oprnamespace 
        JOIN pg_roles rol ON rol.oid = op.oprowner 
        WHERE op.oid = {{INTOID}} OR (nsp.nspname || '.' || op.oprname || ' (' || format_type(op.oprleft, NULL) || ', ' || format_type(op.oprright, NULL) || ')') = '{{STRSQLSAFENAME}}';
    */});



associatedButtons.objectSequence = ['propertyButton', 'dependButton', 'statButton'];
scriptQuery.objectSequence = ml(function () {/*
        SELECT (SELECT '-- DROP SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E';\n\n' ||
              
               '-- Last value taken from this sequence: ' || (SELECT last_value FROM {{STRSQLSAFENAME}})::text || E'\n' ||
              E'-- To set the value of the sequence:\n/' || E'*\n' ||
              E'     -- restart sequence at desired value:\n' ||
              E'     ALTER SEQUENCE {{STRSQLSAFENAME}} RESTART WITH ' || (SELECT last_value FROM {{STRSQLSAFENAME}})::text || E';\n' ||
              E'     -- advance sequence to clear out it''s cache:\n' ||
               '     SELECT nextval(''{{STRSQLSAFENAME}}'') FROM generate_series(1, ' || (SELECT cache_value FROM {{STRSQLSAFENAME}})::text || E');\n' ||
               '*' || E'/\n\n' ||
              
              'CREATE SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E'\n' ||
              '  INCREMENT ' || s.increment || E'\n' ||
              '  MINVALUE '  || s.minimum_value || E'\n' ||
              '  MAXVALUE '  || s.maximum_value || E'\n' ||
              '  START '     || {{STRSQLSAFENAME}}.last_value || E'\n' ||
              '  CACHE '     || (SELECT cache_value FROM {{STRSQLSAFENAME}})::text || E'\n' ||
              '  ' || (CASE WHEN (SELECT is_cycled FROM {{STRSQLSAFENAME}}) THEN '' ELSE 'NO ' END) || E'CYCLE' ||
              COALESCE((SELECT E'\n  OWNED BY ' || pg_depend.refobjid::regclass || '.' || pg_attribute.attname
                           FROM pg_depend
                           JOIN pg_attribute ON pg_attribute.attrelid = pg_depend.refobjid
                                            AND pg_attribute.attnum = pg_depend.refobjsubid
                          WHERE pg_depend.objid = '{{STRSQLSAFENAME}}'::regclass
                            AND pg_depend.refobjsubid > 0)::text, '') || E';\n\n' ||
              'ALTER SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' OWNER TO ' || pg_roles.rolname || E';\n\n' ||
              '-- ALTER SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E' RESTART;\n\n' ||
              COALESCE('COMMENT ON SEQUENCE 
                            ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
                            ' IS ' || quote_literal(pg_description.description) || E';\n\n', '') 
        	
        FROM {{STRSQLSAFENAME}}, pg_class c 
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_roles ON pg_roles.oid = c.relowner
        LEFT JOIN pg_description ON pg_description.objoid = c.oid
        LEFT JOIN information_schema.sequences s ON s.sequence_schema = n.nspname
                                             AND s.sequence_name = c.relname
        WHERE c.relkind = 'S'::char AND (c.oid = {{INTOID}} OR n.nspname || '.' || c.relname = '{{STRSQLSAFENAME}}'))
        
        
        
        || COALESCE((SELECT array_to_string(array_agg(
        	(SELECT array_to_string((SELECT array_agg('GRANT ' || ok) FROM 
        	    (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt) 
        		FROM (  SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        			UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        			UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U($|[^*])' THEN 'USAGE' END) em
        			WHERE perms is not null),',') ||
        	' ON TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' TO ' ||
              	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' 
        		ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || E';\n' as ok
        
        	FROM unnest(c.relacl)
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|U)($|[^*])') as em),'')
        	)
        	),'')
        FROM pg_class c 
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_roles ON pg_roles.oid = c.relowner
        LEFT JOIN pg_description ON pg_description.objoid = c.oid
        LEFT JOIN information_schema.sequences s ON s.sequence_schema = n.nspname
                                             AND s.sequence_name = c.relname
        WHERE c.relkind = 'S'::char AND (c.oid = {{INTOID}} OR n.nspname || '.' || c.relname = '{{STRSQLSAFENAME}}')),'')
        
        || COALESCE((SELECT array_to_string(array_agg(
        	(SELECT array_to_string((SELECT array_agg('GRANT ' || ok) FROM 
        	    (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt) 
        		FROM (  SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        			UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        			UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U\*' THEN 'USAGE' END) em
        			WHERE perms is not null),',') ||
        	' ON TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' TO ' ||
              	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' 
        		ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || E' WITH GRANT OPTION;\n' as ok
        
        	FROM unnest(c.relacl)
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|U)\*') as em),'')
        	)
        	),'')
        FROM pg_class c 
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_roles ON pg_roles.oid = c.relowner
        LEFT JOIN pg_description ON pg_description.objoid = c.oid
        LEFT JOIN information_schema.sequences s ON s.sequence_schema = n.nspname
                                             AND s.sequence_name = c.relname
        WHERE c.relkind = 'S'::char AND (c.oid = {{INTOID}} OR n.nspname || '.' || c.relname = '{{STRSQLSAFENAME}}')),'');
    */});

        
associatedButtons.objectRule = ['dependButton'];
scriptQuery.objectRule = ml(function () {/*
SELECT E'-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        ' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
        E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        E'\n\n' as perms
        FROM pg_class
        LEFT JOIN pg_rewrite ON pg_class.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_rewrite.oid = {{INTOID}} OR pg_namespace.nspname || '.' || quote_ident(pg_rewrite.rulename) = '{{STRSQLSAFENAME}}')
    */});

associatedButtons.objectColumn = ['dependButton', 'statButton'];
scriptQuery.objectColumn = ml(function () {/*
SELECT '-- Column: ' || attname || E';\n\n' ||
    COALESCE(COALESCE((SELECT COALESCE('-- Null Fraction: ' || null_frac || E';\n', E'-- No null fraction found\n') || 
        COALESCE('-- Average Width: ' || avg_width || E';\n', E'-- No average width found\n') || 
        COALESCE('-- Distinct Values: ' || n_distinct::text || E';\n', E'-- No distinct values found\n') || 
        COALESCE('-- Most Common Values:' || most_common_vals::text || E';\n', E'-- No common values found\n') || 
        COALESCE('-- Most Common Frequencies: ' || most_common_freqs::text || E';\n', E'-- No common frequencies found\n') || 
        COALESCE('-- Histogram Bounds: ' || histogram_bounds::text || E';\n', E'-- No histogram bounds found\n') || 
        COALESCE('-- Correlation: ' || correlation::text || E';\n\n', E'-- No correlation found\n')
            FROM pg_stats
            LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.schemaname = pg_stats.schemaname AND pg_stat_user_tables.relname = pg_stats.tablename
            WHERE pg_stat_user_tables.relid = {{INTOID}}
            AND attname = '{{STRSQLSAFENAME}}'
            ORDER BY relid DESC
            LIMIT 1), E'-- No statistics found\n\n') ||
    '-- ALTER TABLE ' || pg_stat_user_tables.schemaname || '.' || pg_stat_user_tables.relname || ' DROP COLUMN IF EXISTS ' || attname || E';\n' ||
    '-- ALTER TABLE ' || pg_stat_user_tables.schemaname || '.' || pg_stat_user_tables.relname || ' ADD COLUMN IF NOT EXISTS ' || attname || ' ' || (
        SELECT COALESCE(format_type(atttypid, atttypmod),'') FROM pg_catalog.pg_attribute
            WHERE pg_attribute.attisdropped IS FALSE AND pg_attribute.attnum > 0 AND attrelid = {{INTOID}} AND attname = '{{STRSQLSAFENAME}}'
          --  ORDER BY attnum ASC
            LIMIT 1) || E';\n'||
    '-- ALTER TABLE ' || pg_stat_user_tables.schemaname || '.' || pg_stat_user_tables.relname || ' ALTER COLUMN ' || attname || E' SET DATA TYPE <data_type>;\n', '')
        FROM pg_attribute
        LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = attrelid
        WHERE attrelid = {{INTOID}} AND attname = '{{STRSQLSAFENAME}}'
*/});
    
    
associatedButtons.objectConstraint = ['dependButton'];
scriptQuery.objectConstraint = ml(function () {/*
SELECT '-- Constraint: ' || conname || E';\n\n' ||
    '-- ALTER TABLE ' || '{{SCHEMA}}.' || relname || ' DROP CONSTRAINT ' || conname || E';\n' ||
    '-- ALTER TABLE ' || '{{SCHEMA}}.' || relname || ' ADD CONSTRAINT ' || conname || ' ' || pg_get_constraintdef(oid, true) || E';\n'
             FROM 
                (SELECT pg_constraint.oid, *
                   FROM pg_constraint
                   LEFT JOIN pg_catalog.pg_statio_user_tables ON pg_statio_user_tables.relid = {{INTOID}}
                  WHERE pg_constraint.conrelid = {{INTOID}} AND conname = '{{STRRELNAME}}'::text
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) AS constrain
                        LIMIT 1;
*/});

//snapback
associatedButtons.objectTable = ['propertyButton', 'dependButton', 'statButton', 'dataObjectButtons'];
scriptQuery.objectTable = ml(function () {/*
           
           
    SELECT (SELECT '-- Table: ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
    (SELECT '-- Estimated Rows ' || (COALESCE(reltuples, 0)::BIGINT) || E';\n' ||
                    '-- Last Vacuum: ' || CASE WHEN last_vacuum is not null THEN to_char(last_vacuum, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END
                        || ', Last AutoVacuum: ' || CASE WHEN last_autovacuum is not null THEN to_char(last_autovacuum, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END || E';\n' ||
                    '-- Last Analyze: ' || CASE WHEN last_analyze is not null THEN to_char(last_analyze, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END
                        || ', Last AutoAnalyze: ' || CASE WHEN last_autoanalyze is not null THEN to_char(last_autoanalyze, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END || E';\n'
                    FROM pg_catalog.pg_class
              LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
              LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = pg_class.oid
                   WHERE pg_class.oid = {{INTOID}})
            || E'\n-- DROP TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname)
            || E';\n\nCREATE ' || CASE pg_class.relpersistence WHEN 'u' THEN 'UNLOGGED ' WHEN 't' THEN 'TEMP ' ELSE '' END
            || 'TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname)
            || E' (\n' ||
                    COALESCE(
                        array_to_string(
                            array_agg(
                                '  ' ||
                                COALESCE(em1.attname, '') || ' ' || COALESCE(format_type(em1.atttypid, em1.atttypmod), '') ||
                                CASE WHEN
                                    em1.attnotnull THEN ' NOT NULL'
                                                    ELSE '' END ||
                                CASE WHEN
                                    em1.atthasdef  THEN ' DEFAULT ' || pg_catalog.pg_get_expr(em1.adbin, em1.adrelid)
                                                    ELSE '' END ||
                                CASE WHEN em1.collname IS NOT NULL AND em1.collname != 'default'
                                    THEN ' COLLATE ' || quote_ident(em1.collname)
                                    ELSE '' END
                            ),
                        E',\n'),
                    '') ||
                    COALESCE(em2.con_full, '') ||
            E'\n)' || (E' WITH (\n  ' || 
                            CASE WHEN pg_class.relhasoids THEN
                                'OIDS=TRUE'
                            ELSE
                                'OIDS=FALSE'
                            END ||
                            (CASE WHEN array_upper(reloptions, 1) > 0
                                    THEN E',\n  ' || array_to_string(reloptions, E',\n  ')
                                    ELSE ''
                            END) || E'\n);') ||
              E'\n\nALTER TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
              ' OWNER TO ' || pg_roles.rolname || E';\n\n' ||
                
                -- get table and column comments
                (
                     SELECT  COALESCE(
                                array_to_string(
                                    array_agg(
                                        COALESCE(
                                            full_text,
                                            ''
                                        )
                                    ),
                                E'\n'),
                            '') AS full_text
                      FROM (
                               SELECT COALESCE(
                                            (
                                                'COMMENT ON ' || (
                                                        CASE WHEN objsubid = 0 THEN 'TABLE' ELSE 'COLUMN' END
                                                ) || ' ' ||
                                                quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
                                                (
                                                    CASE WHEN objsubid = 0 THEN '' ELSE '.' || quote_ident(pg_attribute.attname) END
                                                ) ||
                                                ' IS ' ||
                                                quote_literal(pg_description.description) || E';'
                                            ),
                                            ''
                                        ) AS full_text
                                 FROM pg_description
                            LEFT JOIN pg_class ON pg_class.oid = pg_description.objoid 
                            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                            LEFT JOIN pg_attribute ON attrelid = pg_description.objoid
                                                  AND pg_attribute.attnum = pg_description.objsubid
                                WHERE objoid = {{INTOID}}
                             ORDER BY objsubid ASC
                        ) descriptions
                )
        
        FROM pg_class
        --LEFT JOIN pg_description ON pg_class.oid = pg_description.objoid AND pg_description.objsubid IS NULL
        
        LEFT JOIN (SELECT attrelid, quote_ident(attname) AS attname, atttypid, atttypmod, typname, attnotnull, atthasdef, pg_attrdef.adbin, pg_attrdef.adrelid,
                   CASE WHEN typname = 'varchar' AND atttypmod = 6 THEN 'chk_'
                        WHEN typname ~ '^(text|varchar|bpchar|name|char)$' THEN 'str_'
                        WHEN typname = 'int2' THEN 'shr_'
                        WHEN typname = 'int4' THEN 'int_'
                        WHEN typname = 'int8' THEN 'lng_'
                        WHEN typname = 'numeric' THEN 'num_'
                        WHEN typname = 'date' THEN 'dte_'
                        WHEN typname ~ '^(abstime|time|timetz)$' THEN 'tme_'
                        WHEN typname ~ '^(timestamp|timestamptz)$' THEN 'dtetme_'
                        WHEN typname = 'oid' THEN 'oid_' END || attname AS att_var, pg_collation.collname
          FROM pg_attribute
          JOIN pg_type ON pg_type.oid = pg_attribute.atttypid
        LEFT OUTER JOIN pg_attrdef ON pg_attrdef.adrelid = pg_attribute.attrelid AND pg_attrdef.adnum = pg_attribute.attnum
        LEFT JOIN pg_collation ON pg_collation.oid = pg_attribute.attcollation
          WHERE pg_attribute.attisdropped IS FALSE AND pg_attribute.attnum > 0
          ORDER BY attnum ASC) em1 ON pg_class.oid = em1.attrelid
                
                
          -- CONSTRAINTs
        LEFT JOIN (SELECT conrelid AS oid, array_to_string(array_agg(
                E',\n  CONSTRAINT ' || pg_constraint.conname || ' ' || pg_get_constraintdef(pg_constraint.oid, true)-- ||
                                        --(CASE WHEN pg_constraint.confmatchtype = 'f' THEN ' MATCH FULL'
                                        --      WHEN pg_constraint.confmatchtype = 'p' THEN ' MATCH PARTIAL'
                                        --      WHEN pg_constraint.confmatchtype = 'u' THEN ' MATCH SIMPLE' ELSE '' END) ||
                                        --(CASE WHEN pg_constraint.confdeltype = 'a' THEN ' ON DELETE NO ACTION'
                                        --      WHEN pg_constraint.confdeltype = 'r' THEN ' ON DELETE RESTRICT'
                                        --      WHEN pg_constraint.confdeltype = 'c' THEN ' ON DELETE CASCADE'
                                        --      WHEN pg_constraint.confdeltype = 'n' THEN ' ON DELETE SET NULL'
                                        --      WHEN pg_constraint.confdeltype = 'd' THEN ' ON DELETE SET DEFAULT' ELSE '' END) ||
                                        --(CASE WHEN pg_constraint.confupdtype = 'a' THEN ' ON UPDATE NO ACTION'
                                        --      WHEN pg_constraint.confupdtype = 'r' THEN ' ON UPDATE RESTRICT'
                                        --      WHEN pg_constraint.confupdtype = 'c' THEN ' ON UPDATE CASCADE'
                                        --      WHEN pg_constraint.confupdtype = 'n' THEN ' ON UPDATE SET NULL'
                                        --      WHEN pg_constraint.confupdtype = 'd' THEN ' ON UPDATE SET DEFAULT' ELSE '' END)
              ), E'') as con_full
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.oid IS NOT NULL
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) pg_constraint
        GROUP BY conrelid) em2 ON pg_class.oid = em2.oid
          
          
        
        -- back to the unknown program
         JOIN pg_roles ON pg_roles.oid = pg_class.relowner
         JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = pg_class.oid
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}'
        GROUP BY pg_namespace.nspname, pg_class.relname, pg_class.relpersistence, pg_class.relacl,
                pg_class.relhasoids, pg_roles.rolname, em2.oid, em2.con_full, reloptions) --pg_description.description
                
        -- This section pulls the GRANT lines
        || COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || 
        	';' ), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])' 
        	)
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ),'')
        
        -- This section pulls the GRANT lines 'WITH GRANT OPTION'
        ||  COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*' )
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ), '')
        
        -- also does GRANT lines, for column permissions?
        || COALESCE(
        (SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]' THEN 'SELECT (' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w[^*]' THEN 'UPDATE (' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a[^*]' THEN 'INSERT (' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x[^*]' THEN 'REFERENCES (' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),', '
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN substr((regexp_split_to_array(att.attacl::text,'[=/]'))[1], 2) = '' THEN 'public' ELSE quote_ident(substr((regexp_split_to_array(att.attacl::text,'[=/]'))[1], 2)) END ||
        	';' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]|w[^*]|a[^*]|x[^*]')ok),'')), '')
        
        -- also does GRANT lines, perhaps for column permissions? WITH GRANT OPTION
        || COALESCE((SELECT E'\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r\*' THEN 'SELECT(' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w\*' THEN 'UPDATE(' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a\*' THEN 'INSERT(' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x\*' THEN 'REFERENCES(' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),','
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN (regexp_split_to_array(att.attacl::text,'[=/]'))[1] = '' THEN 'public' ELSE quote_ident((regexp_split_to_array(att.attacl::text,'[=/]'))[1]) END  ||
        	' WITH GRANT OPTION;' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ '(r|w|a|x)\*')ok),'')), '')
        
        -- Displays RULEs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(perms) FROM (
        
        SELECT E'-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        ' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
        E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        E'\n\n' as perms
        FROM pg_class
        LEFT JOIN pg_rewrite ON pg_class.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_rewrite.rulename <> '_RETURN' AND (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') )ok),'')), '')
        
        -- Displays TRIGGERs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        
        SELECT '-- Trigger: ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' || 
        	'-- DROP TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' ||
        	regexp_replace(regexp_replace(regexp_replace(regexp_replace(pg_get_triggerdef(pg_trigger.oid, true),
        	' BEFORE ', E'\n   BEFORE '), ' ON ', E'\n   ON '), ' FOR ', E'\n   FOR '), ' EXECUTE ', E'\n   EXECUTE ') || E';\n\n' as perms
        FROM pg_class 
        JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND pg_trigger.tgisinternal != TRUE
        )ok),'')), '')
        
        -- Returns INDEXes
        || COALESCE((SELECT E'\n\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        SELECT E'-- Index: ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E'\n-- DROP INDEX ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E';\n' ||
        	regexp_replace(pg_get_indexdef(clidx.oid), ' USING ', E'\n   USING ') || E';\n' as perms
        FROM pg_class cl 
        JOIN pg_index idx ON cl.oid = idx.indrelid 
        JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
        LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
        WHERE (cl.oid = {{INTOID}} OR nsp.nspname || '.' || cl.relname = '{{STRSQLSAFENAME}}')
          AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0
     ORDER BY clidx.relname
        )ok),'')), '') 
        
    
        || E'\n\n-- SQL prototypes '
        || (
            SELECT E'\n\n/' || E'*\nSELECT ' || COALESCE(string_agg(quote_ident(attname), ', ' ORDER BY attnum), '') ||
                E'\n  FROM ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                   FROM pg_class
                              LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                  WHERE pg_class.oid = {{INTOID}} ) || ';'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nINSERT INTO ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                        FROM pg_class
                                   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                       WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n            (' || COALESCE(string_agg(quote_ident(attname), ', ' ORDER BY attnum), '') || ')' ||
                E'\n     VALUES (' || COALESCE(string_agg(quote_ident(attname), ', ' ORDER BY attnum), '') || ');'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nUPDATE ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                   FROM pg_class
                              LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                  WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n   SET ' || COALESCE(string_agg(quote_ident(attname) || ' = new.' || quote_ident(attname), E'\n     , ' ORDER BY attnum), '') || ';'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nDELETE FROM ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                        FROM pg_class
                                   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                       WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n      WHERE -CONDITIONS-;\n*' || '/'
        );
      
      
      
        
           -- SELECT 
   --     -- ######### top comments #########
   --     (SELECT '-- Table: ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname)) || E';\n' ||
   --         '-- Estimated Rows ' || (COALESCE(reltuples, 0)::BIGINT) || E';\n' ||
   --         '-- Last Vacuum: ' || CASE WHEN last_vacuum is not null THEN to_char(last_vacuum, 'mm/dd/yyyy HH:MM AM') ELSE ' N/A, Last AutoVacuum: ' END 
   --             || CASE WHEN last_autovacuum is not null THEN to_char(last_autovacuum, 'mm/dd/yyyy HH:MM AM') ELSE ' N/A' END || E';\n' ||
   --         '-- Last Analyze: ' || CASE WHEN last_analyze is not null THEN to_char(last_analyze, 'mm/dd/yyyy HH:MM AM') ELSE ' N/A, Last AutoAnalyze: ' END
   --             || CASE WHEN last_autoanalyze is not null THEN to_char(last_autoanalyze, 'mm/dd/yyyy HH:MM AM') ELSE ' N/A' END || E';\n' ||
   --         '-- DROP TABLE ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname)) || E';\n\n'
   --         FROM pg_catalog.pg_class
   --   LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
   --   LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = pg_class.oid
   --        WHERE pg_class.oid = {{INTOID}}::oid ||) ||
   --     
   --     -- ############ CREATE ############
   --     (SELECT 'CREATE TABLE ' || (quote_ident(nspname) || '.' || quote_ident(relname)) || E' (\n'
   --        FROM pg_catalog.pg_class
   --   LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
   --       WHERE pg_class.oid = {{INTOID}}::oid) ||
   --     
   --     -- ############ COLUMNS ############
   --     
   --     
   --     
   --     
   --     -- ########### CHECK CONSTRAINTS ###########
   --     
   --     
   --     
   --     
   --     -- ######## FOREIGN KEY CONSTRAINTS ########
   --     
   --     
   --     
   --     
   --     -- ######## PRIMARY KEY CONSTRAINTS ########
   --     
   --     
   --     
   --     
   --     -- ########## UNIQUE CONSTRAINTS ##########
   --     
   --     
   --     
   --     
   --     -- ########## CONSTRAINT TRIGGERS ##########
   --     
   --     
   --     
   --     
   --     -- ######### EXCLUSION CONSTRAINTS #########
   --     
   --     
   --     
   --     
   --     -- ######### LIKE #########
   --     
   --     
   --     
   --     
   --     -- ############# CLOSE #############
   --     
   --     (SELECT E'\n)'::text) ||
   --     
   --     -- ############## INHERITS ##############
   --     
   --     
   --     
   --     -- ############## WITH ##############
   --     
   --     (SELECT E' WITH (\n  ' || array_to_string(
   --                                     ((CASE WHEN pg_class.relhasoids THEN 'OIDS=TRUE' ELSE 'OIDS=FALSE' END) || reloptions),
   --                                     E',\n  '
   --                                 ) ||
   --                                 E'\n);\n\n'
   --        FROM pg_catalog.pg_class
   --       WHERE pg_class.oid = {{INTOID}}::oid) ||
   --     
   --     -- ############# OWNER #############
   --     (SELECT 'ALTER TABLE ' || (quote_ident(nspname) || '.' || quote_ident(relname)) ||
   --                                     ' OWNER TO ' || rolname || E';\n'
   --        FROM pg_catalog.pg_class
   --   LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
   --   LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_class.relowner
   --       WHERE pg_class.oid = {{INTOID}}::oid) ||
   -- 
   --     -- ########### COMMENT ###########
   --     COALESCE(
   --         (SELECT E'\nCOMMENT ON TABLE ' || (quote_ident(nspname) || '.' || quote_ident(relname)) ||
   --                                     ' IS ' || quote_literal(description) || E';\n\n'
   --        FROM pg_catalog.pg_class
   --   LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
   --   LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_class.oid
   --       WHERE pg_class.oid = {{INTOID}}::oid), '')
   --     
   --     
   --     
   --     -- ############ GRANT ############
   --     
   --     
   --     
   --     -- ########### REVOKE ###########
   --     
   --     
   --     
   --     -- ########### TRIGGERS ###########
   --     
   --     
   --     
   --     -- ########### INDEXES ###########
   --     
   --     
   --     
   --     -- ########### SAMPLE QUERIES ###########
   --     
   --     
   -- 
    */});


scriptQuery.objectTableNoComment = ml(function () {/*
           
           
    SELECT (SELECT '-- Table: ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
    (SELECT '-- Estimated Rows ' || (COALESCE(reltuples, 0)::BIGINT) || E';\n' ||
                    '-- Last Vacuum: ' || CASE WHEN last_vacuum is not null THEN to_char(last_vacuum, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END
                        || ', Last AutoVacuum: ' || CASE WHEN last_autovacuum is not null THEN to_char(last_autovacuum, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END || E';\n' ||
                    '-- Last Analyze: ' || CASE WHEN last_analyze is not null THEN to_char(last_analyze, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END
                        || ', Last AutoAnalyze: ' || CASE WHEN last_autoanalyze is not null THEN to_char(last_autoanalyze, 'mm/dd/yyyy HH:MM AM') ELSE 'N/A' END || E';\n'
                    FROM pg_catalog.pg_class
              LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
              LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = pg_class.oid
                   WHERE pg_class.oid = {{INTOID}}) ||
            E'\n-- DROP TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
            E';\n\nCREATE TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
            E' (\n' ||
                    COALESCE(
                        array_to_string(
                            array_agg(
                                '  ' ||
                                COALESCE(em1.attname, '') || ' ' || COALESCE(format_type(em1.atttypid, em1.atttypmod), '') ||
                                CASE WHEN
                                    em1.attnotnull THEN ' NOT NULL'
                                                    ELSE '' END ||
                                CASE WHEN
                                    em1.atthasdef  THEN ' DEFAULT ' || pg_catalog.pg_get_expr(em1.adbin, em1.adrelid)
                                                    ELSE '' END ||
                                CASE WHEN em1.collname IS NOT NULL AND em1.collname != 'default'
                                    THEN ' COLLATE ' || quote_ident(em1.collname)
                                    ELSE '' END
                            ),
                        E',\n'),
                    '') ||
                    COALESCE(em2.con_full, '') ||
            E'\n)' || (E' WITH (\n  ' || 
                            CASE WHEN pg_class.relhasoids THEN
                                'OIDS=TRUE'
                            ELSE
                                'OIDS=FALSE'
                            END ||
                            (CASE WHEN array_upper(reloptions, 1) > 0
                                    THEN E',\n  ' || array_to_string(reloptions, E',\n  ')
                                    ELSE ''
                            END) || E'\n);') ||
              E'\n\nALTER TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
              ' OWNER TO ' || pg_roles.rolname || E';\n\n' ||
                
                -- get table and column comments
                (
                     SELECT  COALESCE(
                                array_to_string(
                                    array_agg(
                                        COALESCE(
                                            full_text,
                                            ''
                                        )
                                    ),
                                E'\n'),
                            '') AS full_text
                      FROM (
                               SELECT COALESCE(
                                            (
                                                'COMMENT ON ' || (
                                                        CASE WHEN objsubid = 0 THEN 'TABLE' ELSE 'COLUMN' END
                                                ) || ' ' ||
                                                quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
                                                (
                                                    CASE WHEN objsubid = 0 THEN '' ELSE '.' || quote_ident(pg_attribute.attname) END
                                                ) ||
                                                ' IS ' ||
                                                quote_literal(pg_description.description) || E';'
                                            ),
                                            ''
                                        ) AS full_text
                                 FROM pg_description
                            LEFT JOIN pg_class ON pg_class.oid = pg_description.objoid 
                            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                            LEFT JOIN pg_attribute ON attrelid = pg_description.objoid
                                                  AND pg_attribute.attnum = pg_description.objsubid
                                WHERE objoid = {{INTOID}}
                             ORDER BY objsubid ASC
                        ) descriptions
                )
        
        FROM pg_class
        --LEFT JOIN pg_description ON pg_class.oid = pg_description.objoid AND pg_description.objsubid IS NULL
        
        LEFT JOIN (SELECT attrelid, quote_ident(attname) AS attname, atttypid, atttypmod, typname, attnotnull, atthasdef, pg_attrdef.adbin, pg_attrdef.adrelid,
                   CASE WHEN typname = 'varchar' AND atttypmod = 6 THEN 'chk_'
                        WHEN typname ~ '^(text|varchar|bpchar|name|char)$' THEN 'str_'
                        WHEN typname = 'int2' THEN 'shr_'
                        WHEN typname = 'int4' THEN 'int_'
                        WHEN typname = 'int8' THEN 'lng_'
                        WHEN typname = 'numeric' THEN 'num_'
                        WHEN typname = 'date' THEN 'dte_'
                        WHEN typname ~ '^(abstime|time|timetz)$' THEN 'tme_'
                        WHEN typname ~ '^(timestamp|timestamptz)$' THEN 'dtetme_'
                        WHEN typname = 'oid' THEN 'oid_' END || attname AS att_var, pg_collation.collname
          FROM pg_attribute
          JOIN pg_type ON pg_type.oid = pg_attribute.atttypid
        LEFT OUTER JOIN pg_attrdef ON pg_attrdef.adrelid = pg_attribute.attrelid AND pg_attrdef.adnum = pg_attribute.attnum
        LEFT JOIN pg_collation ON pg_collation.oid = pg_attribute.attcollation
          WHERE pg_attribute.attisdropped IS FALSE AND pg_attribute.attnum > 0
          ORDER BY attnum ASC) em1 ON pg_class.oid = em1.attrelid
                
                
          -- CONSTRAINTs
        LEFT JOIN (SELECT conrelid AS oid, array_to_string(array_agg(
                E',\n  CONSTRAINT ' || pg_constraint.conname || ' ' || pg_get_constraintdef(pg_constraint.oid, true)-- ||
                                        --(CASE WHEN pg_constraint.confmatchtype = 'f' THEN ' MATCH FULL'
                                        --      WHEN pg_constraint.confmatchtype = 'p' THEN ' MATCH PARTIAL'
                                        --      WHEN pg_constraint.confmatchtype = 'u' THEN ' MATCH SIMPLE' ELSE '' END) ||
                                        --(CASE WHEN pg_constraint.confdeltype = 'a' THEN ' ON DELETE NO ACTION'
                                        --      WHEN pg_constraint.confdeltype = 'r' THEN ' ON DELETE RESTRICT'
                                        --      WHEN pg_constraint.confdeltype = 'c' THEN ' ON DELETE CASCADE'
                                        --      WHEN pg_constraint.confdeltype = 'n' THEN ' ON DELETE SET NULL'
                                        --      WHEN pg_constraint.confdeltype = 'd' THEN ' ON DELETE SET DEFAULT' ELSE '' END) ||
                                        --(CASE WHEN pg_constraint.confupdtype = 'a' THEN ' ON UPDATE NO ACTION'
                                        --      WHEN pg_constraint.confupdtype = 'r' THEN ' ON UPDATE RESTRICT'
                                        --      WHEN pg_constraint.confupdtype = 'c' THEN ' ON UPDATE CASCADE'
                                        --      WHEN pg_constraint.confupdtype = 'n' THEN ' ON UPDATE SET NULL'
                                        --      WHEN pg_constraint.confupdtype = 'd' THEN ' ON UPDATE SET DEFAULT' ELSE '' END)
              ), E'') as con_full
             FROM 
                (SELECT oid, *
                   FROM pg_constraint
                  WHERE pg_constraint.oid IS NOT NULL
               ORDER BY (CASE WHEN contype = 'p' THEN 1 WHEN contype = 'u' THEN 2
                              WHEN contype = 'c' THEN 3 WHEN contype = 'f' THEN 4
                              WHEN contype = 't' THEN 5 WHEN contype = 'x' THEN 6 END) ASC,
                        pg_constraint.conname ASC) pg_constraint
        GROUP BY conrelid) em2 ON pg_class.oid = em2.oid
          
          
        
        -- back to the unknown program
         JOIN pg_roles ON pg_roles.oid = pg_class.relowner
         JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.relid = pg_class.oid
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}'
        GROUP BY pg_namespace.nspname, pg_class.relname, pg_class.relacl,
                pg_class.relhasoids, pg_roles.rolname, em2.oid, em2.con_full, reloptions) --pg_description.description
                
        -- This section pulls the GRANT lines
        || COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || 
        	';' ), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])' 
        	)
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ),'')
        
        -- This section pulls the GRANT lines 'WITH GRANT OPTION'
        ||  COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*' )
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ), '')
        
        -- also does GRANT lines, perhaps for column permissions?
        || COALESCE(
        (SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]' THEN 'SELECT(' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w[^*]' THEN 'UPDATE(' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a[^*]' THEN 'INSERT(' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x[^*]' THEN 'REFERENCES(' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),','
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN (regexp_split_to_array(att.attacl::text,'[=/]'))[1] = '' THEN 'public' ELSE quote_ident((regexp_split_to_array(att.attacl::text,'[=/]'))[1]) END ||
        	';' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]|w[^*]|a[^*]|x[^*]')ok),'')), '')
        
        -- also does GRANT lines, perhaps for column permissions? WITH GRANT OPTION
        || COALESCE((SELECT E'\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r\*' THEN 'SELECT(' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w\*' THEN 'UPDATE(' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a\*' THEN 'INSERT(' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x\*' THEN 'REFERENCES(' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),','
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN (regexp_split_to_array(att.attacl::text,'[=/]'))[1] = '' THEN 'public' ELSE quote_ident((regexp_split_to_array(att.attacl::text,'[=/]'))[1]) END  ||
        	' WITH GRANT OPTION;' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ '(r|w|a|x)\*')ok),'')), '')
        
        -- Displays RULEs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(perms) FROM (
        
        SELECT E'-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        ' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
        E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        E'\n\n' as perms
        FROM pg_class
        LEFT JOIN pg_rewrite ON pg_class.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_rewrite.rulename <> '_RETURN' AND (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') )ok),'')), '')
        
        -- Displays TRIGGERs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        
        SELECT '-- Trigger: ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' || 
        	'-- DROP TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' ||
        	regexp_replace(regexp_replace(regexp_replace(regexp_replace(pg_get_triggerdef(pg_trigger.oid, true),
        	' BEFORE ', E'\n   BEFORE '), ' ON ', E'\n   ON '), ' FOR ', E'\n   FOR '), ' EXECUTE ', E'\n   EXECUTE ') || E';\n\n' as perms
        FROM pg_class 
        JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND pg_trigger.tgisinternal != TRUE
        )ok),'')), '')
        
        -- Returns INDEXes
        || COALESCE((SELECT E'\n\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        SELECT E'-- Index: ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E'\n-- DROP INDEX ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E';\n' ||
        	regexp_replace(pg_get_indexdef(clidx.oid), ' USING ', E'\n   USING ') || E';\n' as perms
        FROM pg_class cl 
        JOIN pg_index idx ON cl.oid = idx.indrelid 
        JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
        LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
        WHERE (cl.oid = {{INTOID}} OR nsp.nspname || '.' || cl.relname = '{{STRSQLSAFENAME}}')
          AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0
     ORDER BY clidx.relname
        )ok),'')), ''); 
*/});

scriptQuery.objectTableNoCreate = ml(function () {/*
    
    SELECT (
        COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE (regexp_split_to_array(unnest::text,'[=/]'))[1] END || 
        	';' ), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])' 
        	)
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ),'')
        
        -- This section pulls the GRANT lines 'WITH GRANT OPTION'
        ||  COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*' )
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}' ), '')
        
        -- also does GRANT lines, perhaps for column permissions?
        || COALESCE(
        (SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]' THEN 'SELECT(' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w[^*]' THEN 'UPDATE(' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a[^*]' THEN 'INSERT(' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x[^*]' THEN 'REFERENCES(' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),','
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN (regexp_split_to_array(att.attacl::text,'[=/]'))[1] = '' THEN 'public' ELSE quote_ident((regexp_split_to_array(att.attacl::text,'[=/]'))[1]) END ||
        	';' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r[^*]|w[^*]|a[^*]|x[^*]')ok),'')), '')
        
        -- also does GRANT lines, perhaps for column permissions? WITH GRANT OPTION
        || COALESCE((SELECT E'\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (SELECT 'GRANT ' || (SELECT array_to_string((SELECT array_agg(perms)
        	FROM (	SELECT 4, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'r\*' THEN 'SELECT(' || att.attname || ')' END as perms
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'w\*' THEN 'UPDATE(' || att.attname || ')' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'a\*' THEN 'INSERT(' || att.attname || ')' END
        		UNION SELECT 1, CASE WHEN (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ 'x\*' THEN 'REFERENCES(' || att.attname || ')' END ) em
        		WHERE perms is not null
        		ORDER BY 1),','
        		)) ||
        	' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || 
        	' TO ' || CASE WHEN (regexp_split_to_array(att.attacl::text,'[=/]'))[1] = '' THEN 'public' ELSE quote_ident((regexp_split_to_array(att.attacl::text,'[=/]'))[1]) END  ||
        	' WITH GRANT OPTION;' as perms
        FROM pg_class 
        LEFT JOIN pg_attribute att ON att.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND (regexp_split_to_array((att.attacl)::text, '[=/]'))[2] ~ '(r|w|a|x)\*')ok),'')), '')
        
        -- Displays RULEs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(perms) FROM (
        
        SELECT E'-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        ' ON ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n' ||
        E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        E'\n\n' as perms
        FROM pg_class
        LEFT JOIN pg_rewrite ON pg_class.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_rewrite.rulename <> '_RETURN' AND (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') )ok),'')), '')
        
        -- Displays TRIGGERs
        || COALESCE((SELECT E'\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        
        SELECT '-- Trigger: ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' || 
        	'-- DROP TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' || quote_ident(nspname) || '.' || quote_ident(relname) || E';\n' ||
        	regexp_replace(regexp_replace(regexp_replace(regexp_replace(pg_get_triggerdef(pg_trigger.oid, true),
        	' BEFORE ', E'\n   BEFORE '), ' ON ', E'\n   ON '), ' FOR ', E'\n   FOR '), ' EXECUTE ', E'\n   EXECUTE ') || E';\n\n' as perms
        FROM pg_class 
        JOIN pg_trigger ON pg_trigger.tgrelid = pg_class.oid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE (pg_class.oid = {{INTOID}} OR pg_namespace.nspname || '.' || pg_class.relname = '{{STRSQLSAFENAME}}') AND pg_trigger.tgisinternal != TRUE
        )ok),'')), '')
        
        -- Returns INDEXes
        || COALESCE((SELECT E'\n\n\n' || array_to_string((SELECT array_agg(ok.perms || E'\n') FROM (
        SELECT E'-- Index: ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E'\n-- DROP INDEX ' || quote_ident(nsp.nspname) || '.' || quote_ident(clidx.relname) || 
        	E';\n' ||
        	regexp_replace(pg_get_indexdef(clidx.oid), ' USING ', E'\n   USING ') || E';\n' as perms
        FROM pg_class cl 
        JOIN pg_index idx ON cl.oid = idx.indrelid 
        JOIN pg_class clidx ON clidx.oid = idx.indexrelid 
        LEFT JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace 
        WHERE (cl.oid = {{INTOID}} OR nsp.nspname || '.' || cl.relname = '{{STRSQLSAFENAME}}')
          AND (SELECT count(*) FROM pg_constraint con WHERE con.conindid = clidx.oid) = 0
     ORDER BY clidx.relname
        )ok),'')), '')); 
*/});


associatedButtons.objectForeignTable = ['propertyButton', 'dependButton'];
scriptQuery.objectForeignTable = ml(function () {/*
    SELECT
        -- name line / drop line
        (
               SELECT '-- Foreign Table: ' ||
                                quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E'\n\n' ||
                      '-- DROP FOREIGN TABLE ' ||
                                quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || E';\n\n'
                 FROM pg_class
            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                WHERE pg_class.oid = '{{INTOID}}'
        ) ||
        
        -- create line
        (
               SELECT 'CREATE FOREIGN TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' '
                 FROM pg_class
            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                WHERE pg_class.oid = '{{INTOID}}'
        ) ||
        
        -- parentheses and columns
        (
               SELECT '(' ||
                        string_agg(
                            E'\n    ' || quote_ident(attname)
                                      || ' ' || format_type(atttypid, atttypmod)
                                      || CASE WHEN attfdwoptions IS NOT NULL
                                              THEN (' OPTIONS (' ||
                                                   (SELECT string_agg(
                                                                (quote_ident(option_name) || ' ' || quote_literal(option_value)
                                                            ), ', ')
                                                       FROM pg_options_to_table(attfdwoptions)) ||
                                                    ')') ELSE '' END
                                      || CASE WHEN attnotnull THEN ' NOT NULL' ELSE '' END,
                        ', ') ||
                      E'\n)'
                 FROM (SELECT *
                         FROM pg_attribute
                        WHERE (attrelid = '{{INTOID}}') AND attnum > 0
                     ORDER BY attnum ASC) pg_attribute
        ) ||
        
        -- server
        (
               SELECT E'\n    SERVER ' || pg_foreign_server.srvname
                 FROM pg_class
            LEFT JOIN pg_foreign_table ON pg_foreign_table.ftrelid = pg_class.oid
            LEFT JOIN pg_foreign_server ON pg_foreign_server.oid = pg_foreign_table.ftserver
                WHERE pg_class.oid = '{{INTOID}}'
        ) ||
        
        -- options
        (
               SELECT CASE WHEN ftoptions IS NOT NULL
                           THEN (E'\n    OPTIONS (' ||
                                   (SELECT string_agg(
                                                (quote_ident(option_name) || ' ' || quote_literal(option_value)
                                            ), ', ')
                                       FROM pg_options_to_table(ftoptions)) ||
                                    ')') ELSE '' END
                 FROM pg_foreign_table
                WHERE ftrelid = '{{INTOID}}'
        ) ||
        
        -- end semicolon
        (';') ||
        
        -- owner
        (
               SELECT E'\n\nALTER FOREIGN TABLE ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname))
                            || ' OWNER TO ' || quote_ident(pg_roles.rolname) || E';'
                 FROM pg_class
            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            LEFT JOIN pg_roles ON pg_roles.oid = pg_class.relowner
                WHERE pg_class.oid = '{{INTOID}}'
        ) ||
        
        -- grants
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms ORDER BY srt)
                                                      FROM (
    SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
     UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
     UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
     UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
     UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
     UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
     UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON TABLE ' ||
                                        quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ';'
                                ),
                                E'\n'
                            )
                       FROM unnest(relacl) 
                      --WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*'
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])'
                    )
              FROM pg_class
              JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
             WHERE pg_class.oid = {{INTOID}}
        ), '') ||
        
        -- grants with grant options
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms ORDER BY srt)
                                                      FROM (
    SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
     UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
     UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
     UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
     UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
     UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
     UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON TABLE ' ||
                                        quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ' WITH GRANT OPTION;'
                                ),
                                E'\n'
                            )
                       FROM unnest(relacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*'
                    )
              FROM pg_class
              JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
             WHERE pg_class.oid = {{INTOID}}
        ), '') ||
        
        -- comment
        (
               SELECT CASE WHEN description IS NOT NULL
                           THEN E'\n\nCOMMENT ON FOREIGN TABLE ' ||
                                        (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname)) || ' IS ' ||
                                        quote_literal(pg_description.description) || ';' ELSE '' END
                 FROM pg_class
            LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            LEFT JOIN pg_description ON pg_description.objoid = pg_class.oid
                WHERE pg_class.oid = '{{INTOID}}'
        );
*/});

associatedButtons.objectView = ['propertyButton', 'dependButton', 'dataObjectButtons'];
scriptQuery.objectView = ml(function () {/*
        SELECT  (SELECT array_to_string(array_agg(full_sql), E'\n')
        	FROM (SELECT '-- DROP VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E';\n\n' ||
        	       'CREATE OR REPLACE VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || 
        	       COALESCE(' WITH (' || array_to_string(reloptions, ', ') || ')', '')
        	       || E' AS\n' ||
        	       pg_get_viewdef(c.oid, 100) || E'\n\n' ||
        	       'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
        		 E' OWNER TO ' || quote_ident(pg_roles.rolname) || E';\n' ||
        	       COALESCE('COMMENT ON VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
        		 E' IS ' || quote_literal(pg_description.description) || E';\n', '') AS full_sql--, c.relacl
        	  FROM pg_class c
        	LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        	LEFT JOIN pg_roles ON pg_roles.oid = c.relowner
        	LEFT JOIN pg_description ON pg_description.objoid = c.oid
        	 WHERE (c.relkind = 'v'::char OR c.relkind = 'm'::char) AND (c.oid = {{INTOID}} OR (n.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em)
         
        || COALESCE((SELECT E'\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	';' ), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])' 
        	)
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_class.relname) = '{{STRSQLSAFENAME}}' ),'')
        
        || COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*' )
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_class.relname) = '{{STRSQLSAFENAME}}' ), '')
        	
        
        || COALESCE((SELECT E'\n' || array_to_string(array_agg(drp),E'\n')
        	FROM ( SELECT E'\n-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        		  ' ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E';\n' ||
        		  E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        		  '' as drp
          FROM pg_class c
        LEFT JOIN pg_rewrite ON c.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE pg_rewrite.rulename <> '_RETURN' AND (c.oid = {{INTOID}} OR (n.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em
        	),'')
        
        
        || COALESCE((SELECT E'\n' || array_to_string(array_agg(trg),E'\n')
        	FROM ( SELECT E'\n-- DROP TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' ||
            quote_ident(pg_namespace.nspname) || '.' || quote_ident(c.relname) || E';\n' ||
            replace(replace(replace(replace(pg_get_triggerdef(pg_trigger.oid, true),' INSTEAD ', E'\n   INSTEAD ')
            ,' ON ', E'\n   ON ')
            ,' FOR ', E'\n   FOR ')
            ,' EXECUTE ', E'\n   EXECUTE ') || E';\n' as trg
          FROM pg_class c
          JOIN pg_trigger ON pg_trigger.tgrelid = c.oid
        LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
        WHERE (c.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em
        	),'') 
        || E'\n\n-- SQL prototypes ' ||
        (
            SELECT E'\n\n/' || E'*\nSELECT ' || string_agg(quote_ident(attname), ', ') ||
                E'\n  FROM ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                   FROM pg_class
                              LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                  WHERE pg_class.oid = {{INTOID}} ) || ';'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nINSERT INTO ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                        FROM pg_class
                                   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                       WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n            (' || string_agg(quote_ident(attname), ', ') || ')' ||
                E'\n     VALUES (' || string_agg(quote_ident(attname), ', ') || ');'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nUPDATE ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                   FROM pg_class
                              LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                  WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n   SET ' || string_agg(quote_ident(attname) || ' = new.' || quote_ident(attname), E'\n     , ') || ';'
              FROM pg_catalog.pg_attribute
             WHERE attrelid = {{INTOID}}
               AND attnum >= 0
               AND attisdropped = FALSE
        ) || (
            SELECT E'\n\nDELETE FROM ' || (SELECT quote_ident(nspname) || '.' || quote_ident(relname)
                                        FROM pg_class
                                   LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                                       WHERE pg_class.oid = {{INTOID}} ) ||
                E'\n      WHERE -CONDITIONS-;\n*' || '/'
        );
    */});

scriptQuery.objectViewNoComment = ml(function () {/*
        SELECT  (SELECT array_to_string(array_agg(full_sql), E'\n')
        	FROM (SELECT '-- DROP VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E';\n\n' ||
        	       'CREATE OR REPLACE VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || 
        	       COALESCE(' WITH (' || array_to_string(reloptions, ', ') || ')', '')
        	       || E' AS\n' ||
        	       pg_get_viewdef(c.oid, 100) || E'\n\n' ||
        	       'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
        		 E' OWNER TO ' || quote_ident(pg_roles.rolname) || E';\n' ||
        	       COALESCE('COMMENT ON VIEW ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) ||
        		 E' IS ' || quote_literal(pg_description.description) || E';\n', '') AS full_sql--, c.relacl
        	  FROM pg_class c
        	LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        	LEFT JOIN pg_roles ON pg_roles.oid = c.relowner
        	LEFT JOIN pg_description ON pg_description.objoid = c.oid
        	 WHERE (c.relkind = 'v'::char OR c.relkind = 'm'::char) AND (c.oid = {{INTOID}} OR (n.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em)
         
        || COALESCE((SELECT E'\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	';' ), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])' 
        	)
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_class.relname) = '{{STRSQLSAFENAME}}' ),'')
        
        || COALESCE((SELECT E'\n\n' || (SELECT array_to_string(array_agg( 'GRANT ' || 
        	(SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r\*' THEN 'SELECT' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w\*' THEN 'UPDATE' END
        		UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a\*' THEN 'INSERT' END
        		UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd\*' THEN 'DELETE' END
        		UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D\*' THEN 'TRUNCATE' END
        		UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x\*' THEN 'REFERENCES' END
        		UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't\*' THEN 'TRIGGER' END ) em
        		WHERE perms is not null),',')) ||
        	' ON TABLE ' || quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_class.relname) || ' TO ' ||
        	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	' WITH GRANT OPTION;'), E'\n')
        	FROM unnest(relacl) 
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)\*' )
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_class.relname) = '{{STRSQLSAFENAME}}' ), '')
        	
        
        || COALESCE((SELECT E'\n' || array_to_string(array_agg(drp),E'\n')
        	FROM ( SELECT E'\n-- DROP RULE ' || quote_ident(pg_rewrite.rulename) ||
        		  ' ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E';\n' ||
        		  E'\nCREATE OR REPLACE ' || substring(pg_get_ruledef(pg_rewrite.oid, true), 8) ||
        		  '' as drp
          FROM pg_class c
        LEFT JOIN pg_rewrite ON c.oid=pg_rewrite.ev_class
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE pg_rewrite.rulename <> '_RETURN' AND (c.oid = {{INTOID}} OR (n.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em
        	),'')
        
        
        || COALESCE((SELECT E'\n' || array_to_string(array_agg(trg),E'\n')
        	FROM ( SELECT E'\n-- DROP TRIGGER ' || quote_ident(pg_trigger.tgname) || ' ON ' ||
            quote_ident(pg_namespace.nspname) || '.' || quote_ident(c.relname) || E';\n' ||
            replace(replace(replace(replace(pg_get_triggerdef(pg_trigger.oid, true),' INSTEAD ', E'\n   INSTEAD ')
            ,' ON ', E'\n   ON ')
            ,' FOR ', E'\n   FOR ')
            ,' EXECUTE ', E'\n   EXECUTE ') || E';\n' as trg
          FROM pg_class c
          JOIN pg_trigger ON pg_trigger.tgrelid = c.oid
        LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
        WHERE (c.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || c.relname) = '{{STRSQLSAFENAME}}')) em
        	),'');
    */});


associatedButtons.objectCast = ['propertyButton', 'dependButton'];
scriptQuery.objectCast = ml(function () {/*  
        SELECT '-- DROP CAST (' || pg_type1.typname || ' AS ' || pg_type2.typname || E') \n\n' ||
         'CREATE CAST (' || pg_type1.typname || ' AS ' || pg_type2.typname || E')\n' ||
         '  ' ||
            CASE castmethod
                      WHEN 'f' THEN 'WITH FUNCTION ' ||
                                    quote_ident(nsp.nspname) || '.' || quote_ident(pg_proc.proname) || '(' || oidvectortypes(proargtypes) || ')'
                      WHEN 'i' THEN 'WITH INOUT'
                      WHEN 'b' THEN 'WITHOUT FUNCTION' END ||
            CASE castcontext
                      WHEN 'e' THEN ''
                      WHEN 'a' THEN ' AS ASSIGNMENT'
                      WHEN 'i' THEN ' AS IMPLICIT' END || ';'
         FROM pg_catalog.pg_cast
        LEFT JOIN pg_catalog.pg_type pg_type1 ON pg_type1.oid = pg_cast.castsource
        LEFT JOIN pg_catalog.pg_type pg_type2 ON pg_type2.oid = pg_cast.casttarget
        LEFT JOIN pg_catalog.pg_proc ON pg_proc.oid = pg_cast.castfunc
        LEFT JOIN pg_catalog.pg_namespace nsp ON nsp.oid = pg_proc.pronamespace
        WHERE pg_cast.oid = {{INTOID}} OR (format_type(pg_type1.oid,NULL) || '->' || format_type(pg_type2.oid,pg_type2.typtypmod)) = '{{STRSQLSAFENAME}}';
    */});

associatedButtons.informationSchemaView = [];
scriptQuery.informationSchemaView = ml(function () {/*
    SELECT '-- Information Schema Query' || E'\n\nSELECT * \n  FROM information_schema.' || $ASDF${{STRSQLSAFENAME}}$ASDF$ || E';\n';
*/});

associatedButtons.objectDatabase = ['propertyButton', 'dependButton'];
scriptQuery.objectDatabase = ml(function () {/*  
        SELECT
        (SELECT '-- DROP DATABASE ' || quote_ident(datname) || E';\n\n' ||
             'CREATE DATABASE ' || quote_ident(datname) || E'\n  WITH ' ||
             trim(trailing E'\n ' from
               COALESCE('OWNER = ' || quote_ident(rolname) || E'\n       ', '') ||
               COALESCE('ENCODING = ' || quote_literal(pg_encoding_to_char(encoding)) || E'\n       ', '') ||
               COALESCE('TABLESPACE = ' || spcname || E'\n       ', '') ||
               COALESCE('LC_COLLATE = ' || quote_literal(datcollate) || E'\n       ', '') ||
               COALESCE('LC_CTYPE = ' || quote_literal(datctype) || E'\n       ', '') ||
               COALESCE('CONNECTION LIMIT = ' || datconnlimit || E'\n       ', '')) || E';\n\n' ||
             COALESCE((SELECT array_to_string(array_agg( 'GRANT ' || 
        	 (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	 FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'C($|[^*])' THEN 'CREATE' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'c($|[^*])' THEN 'CONNECT' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'T($|[^*])' THEN 'TEMPORARY' END ) em
        		WHERE perms is not null),',')) ||
        	 ' ON DATABASE ' || quote_ident(datname) || ' TO ' ||
        	 CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	 E';\n'), E'\n')
        	 FROM unnest(datacl) 
        	 WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(C|c|T)($|[^*])' 
        	 ),'') ||
        
        	 COALESCE((SELECT array_to_string(array_agg( 'GRANT ' || 
        	 (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt)
        	 FROM (	SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'C\*' THEN 'CREATE' END as perms
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'c\*' THEN 'CONNECT' END
        		UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'T\*' THEN 'TEMPORARY' END ) em
        		WHERE perms is not null),',')) ||
        	 ' ON DATABASE ' || quote_ident(datname) || ' TO ' ||
        	 CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
        	 E' WITH GRANT OPTION;\n'), E'\n')
        	 FROM unnest(datacl) 
        	 WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(C|c|T)\*' 
        	 ),'') ||
             COALESCE((SELECT array_to_string(array_agg(E'\nALTER DATABASE ' || quote_ident(datname) || ' SET ' || em.unnest || ';'), '')
                         FROM (SELECT unnest(setconfig)) em), '') || E'\n' ||
             COALESCE('COMMENT ON DATABASE ' || quote_ident(datname) || ' IS ' || quote_literal(description) || ';', '')
             FROM pg_database
        LEFT JOIN pg_tablespace ON pg_tablespace.oid = pg_database.dattablespace
        LEFT JOIN pg_shdescription ON pg_shdescription.objoid = pg_database.oid
        LEFT JOIN pg_roles ON pg_roles.oid = pg_database.datdba
        LEFT JOIN pg_db_role_setting ON pg_database.oid = pg_db_role_setting.setdatabase
            WHERE datname = CURRENT_DATABASE()) ||
        COALESCE((SELECT array_to_string(array_agg(
        	(SELECT array_to_string((SELECT array_agg('ALTER DEFAULT PRIVILEGES\n   GRANT ' || ok) FROM 
        	    (SELECT array_to_string((SELECT array_agg(perms ORDER BY srt) 
        		FROM (  SELECT 1 as srt, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'r($|[^*])' THEN 'SELECT' END as perms
        			UNION SELECT 2, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'w($|[^*])' THEN 'UPDATE' END
        			UNION SELECT 3, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'a($|[^*])' THEN 'INSERT' END
        			UNION SELECT 4, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'd($|[^*])' THEN 'DELETE' END
        			UNION SELECT 5, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'D($|[^*])' THEN 'TRUNCATE' END
        			UNION SELECT 6, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'x($|[^*])' THEN 'REFERENCES' END
        			UNION SELECT 7, CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 't($|[^*])' THEN 'TRIGGER' END) em
        			WHERE perms is not null),',') ||
        	' ON ' || ' ' || E'\n   TO ' ||
            	CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'public' 
        		ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || E';\n' as ok
        
        	FROM unnest(defaclacl)
        	WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(r|w|a|d|D|x|t)($|[^*])') as em),'')
        	)
        	),'')
        FROM pg_default_acl
        WHERE defaclnamespace = 0),'');
    */});

associatedButtons.objectExtension = ['propertyButton', 'dependButton'];
scriptQuery.objectExtension = ml(function () {/*
            SELECT '-- Extension: ' || quote_ident(extname) || E'\n\n' ||
                   '-- DROP EXTENSION ' || quote_ident(extname) || E';\n\n' ||
                   'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extname) || E'\n' ||
                   CASE WHEN extversion IS NOT NULL OR extnamespace IS NOT NULL THEN '  WITH ' ELSE '' END ||
                   COALESCE('SCHEMA ' || quote_ident(pg_namespace.nspname), '') ||
                   CASE WHEN extversion IS NOT NULL AND extnamespace IS NOT NULL THEN E'\n      ' ELSE '' END ||
                   COALESCE('VERSION ' || extversion, '') || ';'--, *
             FROM pg_catalog.pg_extension
        LEFT JOIN pg_catalog.pg_namespace ON pg_extension.extnamespace = pg_namespace.oid
            WHERE pg_extension.oid = {{INTOID}} OR extname = '{{STRSQLSAFENAME}}'
         ORDER BY extname;
    */});

associatedButtons.objectTextSearchConfiguration = ['propertyButton', 'dependButton'];
scriptQuery.objectTextSearchConfiguration = ml(function () {/*
    SELECT '-- Text Search Configuration: ' || quote_ident(COALESCE(pg_ts_config.cfgname, '')) || E'\n\n' ||
           '-- DROP TEXT SEARCH CONFIGURATION ' || quote_ident(COALESCE(pg_ts_config.cfgname, '')) || E';\n\n' ||
           'CREATE TEXT SEARCH CONFIGURATION ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_config.cfgname, '') ||
            E' (\n\tPARSER = ' || COALESCE(quote_ident(pg_ts_parser.prsname), '') || E'\n);\n' ||
            E'\n' ||
            array_to_string(array_agg('ALTER TEXT SEARCH CONFIGURATION ' ||
                COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_config.cfgname, '') ||
                ' ADD MAPPING FOR ' || COALESCE((SELECT t.alias FROM pg_catalog.ts_token_type(cfgparser) AS t WHERE t.tokid = maptokentype), '') ||
                ' WITH ' || COALESCE(pg_ts_dict.dictname, '') || ';'), E'\n') || E'\n' ||
            E'\n' ||
            COALESCE(('COMMENT ON TEXT SEARCH CONFIGURATION ' ||
                        COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_config.cfgname, '') ||
                        ' IS ' || quote_literal(pg_description.description) || E';\n'), '')
        FROM pg_catalog.pg_ts_config
        LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_ts_config.cfgnamespace
        LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_ts_config.cfgowner
        LEFT JOIN pg_catalog.pg_ts_parser ON pg_ts_parser.oid = pg_ts_config.cfgparser
        LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_ts_config.oid
        LEFT JOIN (SELECT * FROM pg_catalog.pg_ts_config_map ORDER BY mapcfg, mapseqno) pg_ts_config_map ON pg_ts_config_map.mapcfg = pg_ts_config.oid
        LEFT JOIN pg_ts_dict ON pg_ts_dict.oid = pg_ts_config_map.mapdict
            WHERE pg_ts_config.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_ts_config.cfgname) = '{{STRSQLSAFENAME}}'
        GROUP BY pg_namespace.nspname, pg_ts_config.cfgname, pg_ts_parser.prsname, pg_description.description;
    */});

associatedButtons.objectTextSearchDictionary = ['propertyButton', 'dependButton'];
scriptQuery.objectTextSearchDictionary = ml(function () {/*
     SELECT '-- Text Search Dictionary: ' || quote_ident(COALESCE(pg_ts_dict.dictname, '')) || E'\n\n' ||
           '-- DROP TEXT SEARCH DICTIONARY ' || quote_ident(COALESCE(pg_ts_dict.dictname, '')) || E';\n\n' ||
           'CREATE TEXT SEARCH DICTIONARY ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_dict.dictname, '') ||
            E' (\n\tTEMPLATE = ' || COALESCE(pg_ts_template.tmplname, '') ||
            COALESCE(E',\n\t' || pg_ts_dict.dictinitoption, '') ||
            E'\n);\n\n' ||
            COALESCE(('COMMENT ON TEXT SEARCH DICTIONARY ' ||
                    COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_dict.dictname, '') ||
                    ' IS ' || quote_literal(pg_description.description) || E';\n'), '')
        FROM pg_catalog.pg_ts_dict
        LEFT JOIN pg_catalog.pg_namespace ON pg_ts_dict.dictnamespace = pg_namespace.oid
        LEFT JOIN pg_catalog.pg_ts_template ON pg_ts_dict.dicttemplate = pg_ts_template.oid
        LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_ts_dict.oid
       WHERE pg_ts_dict.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_ts_dict.dictname) = '{{STRSQLSAFENAME}}'
    ORDER BY pg_ts_dict.dictname;
    */});

associatedButtons.objectTextSearchParser = ['propertyButton', 'dependButton'];
scriptQuery.objectTextSearchParser = ml(function () {/*
     SELECT '-- Text Search Parser: ' || quote_ident(COALESCE(pg_ts_parser.prsname, '')) || E'\n\n' ||
           '-- DROP TEXT SEARCH PARSER ' || quote_ident(COALESCE(pg_ts_parser.prsname, '')) || E';\n\n' ||
           'CREATE TEXT SEARCH PARSER ' ||
             COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_parser.prsname, '') || ' (' ||
             E'\n\tSTART = ' || COALESCE(pg_ts_parser.prsstart::text, '') ||
             E',\n\tGETTOKEN = ' || COALESCE(pg_ts_parser.prstoken::text, '') ||
             E',\n\tEND = ' || COALESCE(pg_ts_parser.prsend::text, '') ||
             E',\n\tLEXTYPES = ' || COALESCE(pg_ts_parser.prslextype::text, '') ||
             COALESCE(E',\n\tHEADLINE = ' || pg_ts_parser.prsheadline::text, '') ||
             E'\n);\n\n' ||
             COALESCE(('COMMENT ON TEXT SEARCH PARSER ' ||
                     COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_parser.prsname, '') ||
                     ' IS ' || quote_literal(pg_description.description) || E';\n'), '')
         FROM pg_catalog.pg_ts_parser
    LEFT JOIN pg_catalog.pg_namespace ON pg_ts_parser.prsnamespace = pg_namespace.oid
    LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_ts_parser.oid
        WHERE pg_ts_parser.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_ts_parser.prsname) = '{{STRSQLSAFENAME}}';
    */});

associatedButtons.objectTextSearchTemplate = ['propertyButton', 'dependButton'];
scriptQuery.objectTextSearchTemplate = ml(function () {/*
    SELECT '-- Text Search Template: ' || quote_ident(COALESCE(pg_ts_template.tmplname, '')) || E'\n\n' ||
           '-- DROP TEXT SEARCH TEMPLATE ' || quote_ident(COALESCE(pg_ts_template.tmplname, '')) || E';\n\n' ||
           'CREATE TEXT SEARCH TEMPLATE ' ||
           COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_template.tmplname, '') || ' (' ||
           COALESCE(E'\n\tINIT = ' || pg_ts_template.tmplinit::text || ',', '') ||
           E'\n\tLEXIZE = ' || COALESCE(pg_ts_template.tmpllexize::text, '') ||
           E'\n);\n\n' ||
           COALESCE(('COMMENT ON TEXT SEARCH TEMPLATE ' ||
                   COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_ts_template.tmplname, '') ||
                   ' IS ' || quote_literal(pg_description.description) || E';\n'), '')
      FROM pg_catalog.pg_ts_template
 LEFT JOIN pg_catalog.pg_namespace ON pg_ts_template.tmplnamespace = pg_namespace.oid
 LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_ts_template.oid
     WHERE pg_ts_template.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_ts_template.tmplname) = '{{STRSQLSAFENAME}}';
    */});

associatedButtons.objectOperatorFamily = ['propertyButton', 'dependButton'];
scriptQuery.objectOperatorFamily = ml(function () {/*
    SELECT '-- Operator Family: ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opfamily.opfname)) || E'\n\n' ||
           '-- DROP OPERATOR FAMILY ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opfamily.opfname)) || ' USING ' || COALESCE(pg_am.amname, '') || E';\n\n' ||
           'CREATE OPERATOR FAMILY ' ||
           (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opfamily.opfname)) ||
           ' USING ' || COALESCE(pg_am.amname, '') ||
           E';\n\n' ||
           COALESCE('COMMENT ON OPERATOR FAMILY ' ||
                   COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_opfamily.opfname, '') ||
                   ' IS ' || quote_literal(pg_description.description) || E';\n', '')
      FROM pg_catalog.pg_opfamily
 LEFT JOIN pg_catalog.pg_namespace ON pg_opfamily.opfnamespace = pg_namespace.oid
 LEFT JOIN pg_catalog.pg_am ON pg_opfamily.opfmethod = pg_am.oid
 LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_opfamily.oid
     WHERE pg_opfamily.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_opfamily.opfname) = '{{STRSQLSAFENAME}}';
*/});

associatedButtons.objectOperatorClass = ['propertyButton', 'dependButton'];
scriptQuery.objectOperatorClass = ml(function () {/*
    SELECT '-- Operator Class: ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opclass.opcname)) || E'\n\n' ||
           '-- DROP OPERATOR CLASS ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opclass.opcname)) || ' USING ' || COALESCE(pg_am.amname, '') || E';\n\n' ||
           'CREATE OPERATOR CLASS ' || (quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_opclass.opcname)) || 
        CASE WHEN pg_opclass.opcdefault THEN ' DEFAULT' ELSE '' END || E'\n\t' ||
        ' FOR TYPE ' || COALESCE(pg_type.typname, '') ||
        ' USING ' || COALESCE(pg_am.amname, '') ||
        ' AS' ||
        COALESCE(E'\n\t' ||
        string_agg(DISTINCT
            'OPERATOR '::text || pg_amop.amopstrategy::text || '  ' || pg_operator_namespace.nspname || '.' || pg_operator.oprname ||
                            '(' || format_type(pg_operator.oprleft, NULL) || ', ' || format_type(pg_operator.oprright, NULL) || ')'
        , E',\n\t' ORDER BY 'OPERATOR '::text || pg_amop.amopstrategy::text || '  ' || pg_operator_namespace.nspname || '.' || pg_operator.oprname ||
                            '(' || format_type(pg_operator.oprleft, NULL) || ', ' || format_type(pg_operator.oprright, NULL) || ')')
        , '') ||
        COALESCE(E'\n\t' ||
        string_agg(DISTINCT
            'FUNCTION '::text || pg_amproc.amprocnum::text || '  ' || pg_proc_namespace.nspname || '.' || pg_proc.proname ||
                                                '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')'
        , E',\n\t' ORDER BY 'FUNCTION '::text || pg_amproc.amprocnum::text || '  ' || pg_proc_namespace.nspname || '.' || pg_proc.proname ||
                                                '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')')
        , '') ||
        COALESCE(E'\n\tSTORAGE ' || pg_storage_type.typname, '') ||
        E';\n\n' ||
        COALESCE('COMMENT ON OPERATOR CLASS ' ||
                COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_opclass.opcname, '') ||
                ' IS ' || quote_literal(pg_description.description) || E';\n', '')
    FROM pg_catalog.pg_opclass
    LEFT JOIN pg_catalog.pg_namespace ON pg_opclass.opcnamespace = pg_namespace.oid
    LEFT JOIN pg_catalog.pg_type ON pg_opclass.opcintype = pg_type.oid
    LEFT JOIN pg_catalog.pg_type pg_storage_type ON pg_opclass.opckeytype = pg_storage_type.oid
    LEFT JOIN pg_catalog.pg_am ON pg_opclass.opcmethod = pg_am.oid
    LEFT JOIN pg_catalog.pg_opfamily ON pg_opclass.opcfamily = pg_opfamily.oid
    LEFT JOIN pg_catalog.pg_amop ON pg_opfamily.oid = pg_amop.amopfamily
    LEFT JOIN pg_catalog.pg_operator ON pg_operator.oid = pg_amop.amopopr
                                    AND pg_amop.amoplefttype = pg_operator.oprleft
                                    AND pg_amop.amoprighttype = pg_operator.oprright
    LEFT JOIN pg_catalog.pg_namespace pg_operator_namespace ON pg_operator_namespace.oid = pg_operator.oprnamespace
    LEFT JOIN pg_catalog.pg_amproc ON pg_opfamily.oid = pg_amproc.amprocfamily
                                  AND pg_amproc.amproclefttype = pg_opclass.opcintype
                                  AND pg_amproc.amprocrighttype = pg_opclass.opcintype
    LEFT JOIN pg_catalog.pg_proc ON pg_proc.oid = pg_amproc.amproc
    LEFT JOIN pg_catalog.pg_namespace pg_proc_namespace ON pg_proc_namespace.oid = pg_proc.pronamespace
    LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_opclass.oid
        WHERE pg_opclass.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_opclass.opcname) = '{{STRSQLSAFENAME}}'
     GROUP BY pg_opclass.oid, pg_namespace.nspname, pg_opclass.opcname, pg_opclass.opcdefault, pg_type.typname, pg_am.amname, pg_description.description, pg_storage_type.typname;
*/});

associatedButtons.objectType = ['propertyButton', 'dependButton'];
scriptQuery.objectType = ml(function () {/*
    --CREATE TYPE postage.mood AS ENUM ('sad', 'ok', 'happy');
    SELECT 
       -- ######### top comments #########
       (SELECT '-- Type: ' || (quote_ident(nspname) || '.' || quote_ident(typname)) || E'\n\n' ||
               '-- DROP TYPE ' || (quote_ident(nspname) || '.' || quote_ident(typname)) || E';\n\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||
        
        (SELECT 
            CASE 
            WHEN pg_type.typtype = 'b' OR pg_type.typtype = 'p' --BASE AND PSEUDO
            THEN 'CREATE TYPE ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_type.typname, '') ||
            ' (' ||
            E'\n\tINPUT = ' || pg_type.typinput::text ||
            E',\n\tOUTPUT = ' || pg_type.typoutput::text ||
            COALESCE(E',\n\tRECEIVE = ' || pg_type.typreceive::text, '') ||
            COALESCE(E',\n\tSEND = ' || pg_type.typsend::text, '') ||
            COALESCE(E',\n\tTYPMOD_IN = ' || pg_type.typmodin::text, '') ||
            COALESCE(E',\n\tTYPMOD_OUT = ' || pg_type.typmodout::text, '') ||
            COALESCE(E',\n\tANALYZE = ' || pg_type.typanalyze::text, '') ||
            COALESCE(E',\n\tINTERNALLENGTH = ' || pg_type.typlen::text, '') ||
            COALESCE(CASE WHEN pg_type.typbyval THEN E',\n\tPASSEDBYVALUE' ELSE '' END, '') ||
            COALESCE(E',\n\tALIGNMENT = ' || CASE pg_type.typalign
                                          WHEN 'c' THEN 'char'
                                          WHEN 's' THEN 'int2'
                                          WHEN 'i' THEN 'int4'
                                          WHEN 'd' THEN 'double'
                                          ELSE NULL END, '') ||
            COALESCE(E',\n\tSTORAGE = ' || CASE pg_type.typstorage
                                          WHEN 'p' THEN 'plain'
                                          WHEN 'e' THEN 'external'
                                          WHEN 'm' THEN 'main'
                                          WHEN 'x' THEN 'extended'
                                          ELSE NULL END, '') ||
            COALESCE(E',\n\tCATEGORY = ' || quote_literal(pg_type.typcategory::text), '') ||
            COALESCE(E',\n\tPREFERRED = ' || pg_type.typispreferred::text, '') ||
            COALESCE(E',\n\tDEFAULT = ' || quote_literal(pg_type.typdefault::text), '') ||--bytea not working
            COALESCE(E',\n\tELEMENT = ' || pg_array_type.typname::text, '') ||
            COALESCE(E',\n\tDELIMITER = ' || quote_literal(pg_type.typdelim::text), '') ||
            COALESCE(E',\n\tCOLLATABLE = ' || pg_collation.collname::text, '') ||
            ')' ||
            E';\n\n'
            ELSE ''
            END
        FROM pg_catalog.pg_type
        LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        LEFT JOIN pg_catalog.pg_type pg_array_type ON pg_array_type.oid = pg_type.typelem
        LEFT JOIN pg_catalog.pg_collation ON pg_collation.oid = pg_type.typcollation
        WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||
        
        (SELECT CASE pg_type.typtype
            WHEN 'r' --RANGE
            THEN 'CREATE TYPE ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_type.typname, '') ||
            E' AS RANGE (' ||
            E'\n\tSUBTYPE = ' || pg_type_namespace.nspname || '.' || pg_sub_type.typname::text ||
            COALESCE(E',\n\tSUBTYPE_OPCLASS = ' || pg_opclass_namespace.nspname || '.' || pg_opclass.opcname::text, '') ||
            COALESCE(E',\n\tCOLLATION = ' || pg_collation_namespace.nspname || '.' || pg_collation.collname::text, '') ||
            COALESCE(E',\n\tCANONICAL = ' || pg_range.rngcanonical::text, '') ||
            COALESCE(E',\n\tSUBTYPE_DIFF = ' || pg_range.rngsubdiff::text, '') ||
            '' ||
            E');\n\n'
            ELSE ''
            END
        FROM pg_catalog.pg_type
        LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        LEFT JOIN pg_catalog.pg_range ON pg_range.rngtypid = pg_type.oid
        LEFT JOIN pg_catalog.pg_type pg_sub_type ON pg_range.rngsubtype = pg_sub_type.oid
        LEFT JOIN pg_catalog.pg_namespace pg_type_namespace ON pg_type_namespace.oid = pg_sub_type.typnamespace
        LEFT JOIN pg_catalog.pg_opclass ON pg_opclass.oid = pg_range.rngsubopc
        LEFT JOIN pg_catalog.pg_namespace pg_opclass_namespace ON pg_opclass_namespace.oid = pg_opclass.opcnamespace
        LEFT JOIN pg_catalog.pg_collation ON pg_collation.oid = pg_range.rngcollation
        LEFT JOIN pg_catalog.pg_namespace pg_collation_namespace ON pg_collation_namespace.oid = pg_collation.collnamespace
        WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||
        
        (SELECT CASE pg_type.typtype
            WHEN 'e' --ENUM
            THEN 'CREATE TYPE ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_type.typname, '') ||
            E' AS ENUM (' ||
            string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder) ||
            '' ||
            E');\n\n'
            ELSE ''
            END
        FROM pg_catalog.pg_type
        LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        LEFT JOIN pg_catalog.pg_enum ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}'
        GROUP BY pg_namespace.nspname, pg_type.typname, pg_type.typtype) ||
        
        (SELECT CASE pg_type.typtype
            WHEN 'c' --COMPOSITE
            THEN 'CREATE TYPE ' ||
            COALESCE(pg_namespace.nspname, '') || '.' || COALESCE(pg_type.typname, '') ||
            ' AS (' ||
            string_agg(E'\n\t' || pg_attribute.attname || ' ' || format_type(pg_attribute.atttypid, pg_attribute.atttypmod), ',') ||
            E');\n\n'
            ELSE ''
            END
        FROM pg_catalog.pg_type
        LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        LEFT JOIN pg_catalog.pg_class ON pg_class.oid = pg_type.typrelid
        LEFT JOIN pg_catalog.pg_attribute ON pg_class.oid = pg_attribute.attrelid
        WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}'
        GROUP BY pg_namespace.nspname, pg_type.typname, pg_type.typtype) ||
        
         -- ############ ALTER ############
       (SELECT 'ALTER TYPE ' || (quote_ident(nspname) || '.' || quote_ident(typname)) ||
                                       ' OWNER TO ' || rolname || E';\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_type.typowner
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||
        
       -- ########### COMMENT ###########
       COALESCE(
           (SELECT E'\nCOMMENT ON TYPE ' || (quote_ident(nspname) || '.' || quote_ident(typname)) ||
                                       ' IS ' || quote_literal(description) || E';\n\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_type.oid
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}'), '');
*/});

associatedButtons.objectDomain = ['propertyButton', 'dependButton'];
scriptQuery.objectDomain = ml(function () {/*
    SELECT 
       -- ######### top comments #########
       (SELECT '-- Domain: ' || (quote_ident(nspname) || '.' || quote_ident(typname)) || E'\n\n' ||
               '-- DROP DOMAIN ' || (quote_ident(nspname) || '.' || quote_ident(typname)) || E';\n\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||

(SELECT 'CREATE DOMAIN ' ||
    COALESCE(quote_ident(pg_namespace.nspname), '') || '.' || COALESCE(quote_ident(pg_type.typname), '') ||
    ' AS ' ||
    format_type(pg_type.typbasetype, pg_type.typtypmod) ||
    COALESCE(E'\n\tCOLLATE ' || quote_ident(pg_collation_namespace.nspname) || '.' || quote_ident(pg_collation.collname), '') ||
    COALESCE(E'\n\tDEFAULT ' || pg_type.typdefault, '') ||
    CASE WHEN pg_type.typnotnull THEN E'\n\tNOT NULL' ELSE '' END ||
    COALESCE(string_agg(E',\n\tCONSTRAINT ' || pg_constraint.conname || ' ' || pg_get_constraintdef(pg_constraint.oid, true), ''), '') ||
    E';\n\n'
FROM pg_catalog.pg_type
LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
LEFT JOIN pg_catalog.pg_collation ON pg_collation.oid = pg_type.typcollation
LEFT JOIN pg_catalog.pg_namespace pg_collation_namespace ON pg_collation_namespace.oid = pg_collation.collnamespace
LEFT JOIN pg_catalog.pg_constraint ON pg_constraint.contypid = pg_type.oid
WHERE (pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') AND pg_type.typtype = 'd'
GROUP BY pg_namespace.nspname, pg_type.typname, pg_collation_namespace.nspname, pg_collation.collname, pg_type.typbasetype, pg_type.typtypmod, pg_collation.collname, pg_type.typdefault, pg_type.typnotnull) ||

 -- ############ ALTER ############
       (SELECT 'ALTER DOMAIN ' || (quote_ident(nspname) || '.' || quote_ident(typname)) ||
                                       ' OWNER TO ' || rolname || E';\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_type.typowner
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') ||

    -- grants:
    CASE WHEN (SELECT count(*)
    	FROM (SELECT unnest(typacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(typname) as name
    		FROM pg_type 
    		LEFT JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
    		WHERE pg_type.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') em
    	WHERE acl::text like '=%') > 0

        THEN (SELECT array_to_string(array_agg(E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
        	|| ' TO ' || substring(acl from 0 for strpos(acl, '=')) || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END),',')
        	FROM (SELECT acl, name FROM (SELECT unnest(typacl)::text as acl, quote_ident(nspname) || '.' || quote_ident(typname) as name
        		FROM pg_type 
        		LEFT JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
        		WHERE pg_type.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') em
        	WHERE acl::text not like '=%'
            ORDER BY acl) em) 
        
        ELSE '' END
    
    || CASE WHEN -- public exists?
    	(SELECT count(*)
    	FROM (SELECT unnest(typacl)::text as acl, quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_type.typname) as name
    		FROM pg_type
    		LEFT JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
    		WHERE pg_type.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') em
    	WHERE acl::text like '=%') >0 
    
       THEN
    	-- public grant:
    	(SELECT E'\nGRANT ' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%X%' THEN 'EXECUTE' ELSE '' END || ' ON FUNCTION ' || name 
    		|| ' TO public' || CASE WHEN substring(acl from strpos(acl, '=')+1) like '%*%' THEN ' WITH GRANT OPTION;' ELSE ';' END
    	FROM (SELECT unnest(typacl)::text as acl, quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_type.typname) as name
    		FROM pg_type 
    		LEFT JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
    		WHERE pg_type.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') em
    	WHERE acl::text like '=%')
    
       ELSE
    	-- public revoke
    	(SELECT E'\nREVOKE ALL ON FUNCTION ' || name || ' FROM public;'
    	FROM (SELECT quote_ident(pg_namespace.nspname) || '.' || quote_ident(pg_type.typname) as name
    		FROM pg_type 
    		LEFT JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
    		WHERE pg_type.oid = {{INTOID}} OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}') em)
       END ||
       -- ########### COMMENT ###########
       COALESCE(
           (SELECT E'\nCOMMENT ON DOMAIN ' || (quote_ident(nspname) || '.' || quote_ident(typname)) ||
                                       ' IS ' || quote_literal(description) || E';\n\n'
          FROM pg_catalog.pg_type
     LEFT JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
     LEFT JOIN pg_catalog.pg_description ON pg_description.objoid = pg_type.oid
         WHERE pg_type.oid = {{INTOID}}::oid OR (pg_namespace.nspname || '.' || pg_type.typname) = '{{STRSQLSAFENAME}}'), '');
*/});

associatedButtons.objectForeignServer = ['propertyButton', 'dependButton'];
scriptQuery.objectForeignServer = ml(function () {/*
    SELECT
        -- name line / drop line / create line
        (
               SELECT '-- Server: ' || quote_ident(pg_foreign_server.srvname) || E'\n\n' ||
                      '-- DROP SERVER ' || quote_ident(pg_foreign_server.srvname) || E';\n\n' ||
                      'CREATE SERVER ' || quote_ident(pg_foreign_server.srvname)
                 FROM pg_foreign_server
                WHERE pg_foreign_server.oid = '{{INTOID}}'
        ) ||
        
        -- type line / version line / foreign data wrapper line
        (
               SELECT CASE WHEN srvtype    IS NOT NULL THEN E'\n    TYPE '''    || pg_foreign_server.srvtype    || '''' ELSE '' END ||
                      CASE WHEN srvversion IS NOT NULL THEN E'\n    VERSION ''' || pg_foreign_server.srvversion || '''' ELSE '' END ||
                      E'\n    FOREIGN DATA WRAPPER ' || quote_ident(pg_foreign_data_wrapper.fdwname)
                 FROM pg_foreign_server
            LEFT JOIN pg_foreign_data_wrapper ON pg_foreign_data_wrapper.oid = pg_foreign_server.srvfdw
                WHERE pg_foreign_server.oid = '{{INTOID}}'
        ) ||
        
        -- options line
        (
               SELECT CASE WHEN srvoptions IS NOT NULL
                           THEN (E'\n    OPTIONS (' ||
                                   (SELECT string_agg(
                                                (quote_ident(option_name) || ' ' || quote_literal(option_value)
                                            ), ', ')
                                       FROM pg_options_to_table(srvoptions)) ||
                                    ')') ELSE '' END
                 FROM pg_foreign_server
                WHERE oid = '{{INTOID}}'
        ) ||
        
        -- end semicolon
        (';') ||
        
        -- owner
        (
               SELECT E'\n\nALTER SERVER ' || (quote_ident(pg_foreign_server.srvname))
                            || ' OWNER TO ' || quote_ident(pg_roles.rolname) || E';'
                 FROM pg_foreign_server
            LEFT JOIN pg_roles ON pg_roles.oid = pg_foreign_server.srvowner
                WHERE pg_foreign_server.oid = '{{INTOID}}'
        ) ||
        
        -- grants
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U($|[^*])' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON SERVER ' ||
                                        quote_ident(pg_foreign_server.srvname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ';'
                                ),
                                E'\n'
                            )
                       FROM unnest(srvacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)($|[^*])'
                    )
              FROM pg_foreign_server
             WHERE pg_foreign_server.oid = {{INTOID}}
        ), '') ||
        
        -- grants with grant options
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U\*' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON SERVER ' ||
                                        quote_ident(pg_foreign_server.srvname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ' WITH GRANT OPTION;'
                                ),
                                E'\n'
                            )
                       FROM unnest(srvacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)\*'
                    )
              FROM pg_foreign_server
             WHERE pg_foreign_server.oid = {{INTOID}}
        ), '') ||
        
        -- comment
        (
               SELECT CASE WHEN description IS NOT NULL
                           THEN E'\n\nCOMMENT ON SERVER ' ||
                                        (quote_ident(pg_foreign_server.srvname)) || ' IS ' ||
                                        quote_literal(pg_description.description) || ';' ELSE '' END
                 FROM pg_foreign_server
            LEFT JOIN pg_description ON pg_description.objoid = pg_foreign_server.oid
                WHERE pg_foreign_server.oid = '{{INTOID}}'
        );
*/});

associatedButtons.objectForeignDataWrapper = ['propertyButton', 'dependButton'];
scriptQuery.objectForeignDataWrapper = ml(function () {/*
    SELECT
        -- name line / drop line / create line
        (
               SELECT '-- Foreign Data Wrapper: ' || quote_ident(pg_foreign_data_wrapper.fdwname) || E'\n\n' ||
                      '-- DROP FOREIGN DATA WRAPPER ' || quote_ident(pg_foreign_data_wrapper.fdwname) || E';\n\n' ||
                      'CREATE FOREIGN DATA WRAPPER ' || quote_ident(pg_foreign_data_wrapper.fdwname)
                 FROM pg_foreign_data_wrapper
                WHERE pg_foreign_data_wrapper.oid = '{{INTOID}}'
        ) ||
        
        -- handler line / validator line
        (
               SELECT CASE WHEN hndlr_proc.proname IS NOT NULL
                           THEN E'\n    HANDLER ' || (quote_ident(hndlr_nsp.nspname) || '.' ||
                                                      quote_ident(hndlr_proc.proname)) ELSE '' END ||
                      CASE WHEN vlidtr_proc.proname IS NOT NULL
                           THEN E'\n    VALIDATOR ' || (quote_ident(vlidtr_nsp.nspname) || '.' ||
                                                      quote_ident(vlidtr_proc.proname)) ELSE '' END
                 FROM pg_foreign_data_wrapper
            LEFT JOIN pg_proc hndlr_proc ON hndlr_proc.oid = pg_foreign_data_wrapper.fdwhandler
            LEFT JOIN pg_namespace hndlr_nsp ON hndlr_nsp.oid = hndlr_proc.pronamespace
            LEFT JOIN pg_proc vlidtr_proc ON vlidtr_proc.oid = pg_foreign_data_wrapper.fdwvalidator
            LEFT JOIN pg_namespace vlidtr_nsp ON vlidtr_nsp.oid = vlidtr_proc.pronamespace
                WHERE pg_foreign_data_wrapper.oid = '{{INTOID}}'
        ) ||
        
        -- options line
        (
               SELECT CASE WHEN fdwoptions IS NOT NULL
                           THEN (E'\n    OPTIONS (' ||
                                   (SELECT string_agg(
                                                (quote_ident(option_name) || ' ' || quote_literal(option_value)
                                            ), ', ')
                                       FROM pg_options_to_table(fdwoptions)) ||
                                    ')') ELSE '' END
                 FROM pg_foreign_data_wrapper
                WHERE oid = '{{INTOID}}'
        ) ||
        
        -- end semicolon
        (';') ||
        
        -- owner
        (
               SELECT E'\n\nALTER FOREIGN DATA WRAPPER ' || (quote_ident(pg_foreign_data_wrapper.fdwname))
                            || ' OWNER TO ' || quote_ident(pg_roles.rolname) || E';'
                 FROM pg_foreign_data_wrapper
            LEFT JOIN pg_roles ON pg_roles.oid = pg_foreign_data_wrapper.fdwowner
                WHERE pg_foreign_data_wrapper.oid = '{{INTOID}}'
        ) ||
        
        -- grants
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U($|[^*])' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON FOREIGN DATA WRAPPER ' ||
                                        quote_ident(pg_foreign_data_wrapper.fdwname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ';'
                                ),
                                E'\n'
                            )
                       FROM unnest(fdwacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)($|[^*])'
                    )
              FROM pg_foreign_data_wrapper
             WHERE pg_foreign_data_wrapper.oid = {{INTOID}}
        ), '') ||
        
        -- grants with grant options
        COALESCE((
            SELECT E'\n' || (
                    SELECT array_to_string(
                                array_agg(
                                    'GRANT ' || 
                                        (
                                            SELECT array_to_string(
                                                (
                                                    SELECT array_agg(perms)
                                                      FROM (
                        SELECT CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ 'U\*' THEN 'USAGE' END as perms
                                                            ) em
                                                     WHERE perms is not null
                                                ),
                                                ','
                                            )
                                        ) ||
                                    ' ON FOREIGN DATA WRAPPER ' ||
                                        quote_ident(pg_foreign_data_wrapper.fdwname) ||
                                    ' TO ' ||
                                        CASE WHEN (regexp_split_to_array(unnest::text,'[=/]'))[1] = '' THEN 'PUBLIC'
                                             ELSE ((regexp_split_to_array(unnest::text,'[=/]'))[1]) END || 
                                    ' WITH GRANT OPTION;'
                                ),
                                E'\n'
                            )
                       FROM unnest(fdwacl) 
                      WHERE (regexp_split_to_array(unnest::text,'[=/]'))[2] ~ '(U)\*'
                    )
              FROM pg_foreign_data_wrapper
             WHERE pg_foreign_data_wrapper.oid = {{INTOID}}
        ), '') ||
        
        -- comment
        (
               SELECT CASE WHEN description IS NOT NULL
                           THEN E'\n\nCOMMENT ON FOREIGN DATA WRAPPER ' ||
                                        (quote_ident(pg_foreign_data_wrapper.fdwname)) || ' IS ' ||
                                        quote_literal(pg_description.description) || ';' ELSE '' END
                 FROM pg_foreign_data_wrapper
            LEFT JOIN pg_description ON pg_description.objoid = pg_foreign_data_wrapper.oid
                WHERE pg_foreign_data_wrapper.oid = '{{INTOID}}'
        );
*/});

associatedButtons.objectTablespace = ['propertyButton', 'dependButton'];
scriptQuery.objectTablespace = ml(function () {/*
    SELECT
        -- name line / drop line / create line
        (
               SELECT '-- Tablespace: ' || quote_ident(pg_tablespace.spcname) || E'\n\n' ||
                      '-- DROP TABLESPACE ' || quote_ident(pg_tablespace.spcname) || E';\n\n' ||
                      'CREATE TABLESPACE ' || quote_ident(pg_tablespace.spcname)
                 FROM pg_tablespace
                WHERE pg_tablespace.oid = '{{INTOID}}'
        ) ||
        
        -- owner
        (
               SELECT CASE WHEN pg_roles.rolname IS NOT NULL THEN ' OWNER ' || quote_ident(pg_roles.rolname) ELSE '' END
                 FROM pg_tablespace
            LEFT JOIN pg_catalog.pg_roles ON pg_roles.oid = pg_tablespace.spcowner
                WHERE pg_tablespace.oid = '{{INTOID}}'
        ) ||
        
        -- location
        (
               SELECT ' LOCATION ''' ||
                      (CASE WHEN pg_tablespace_location(pg_tablespace.oid) = ''
                                 AND spcname = 'pg_default' THEN (SELECT setting || '/base' FROM pg_settings WHERE name = 'data_directory')
                            WHEN pg_tablespace_location(pg_tablespace.oid) = ''
                                 AND spcname = 'pg_global'  THEN (SELECT setting || '/global' FROM pg_settings WHERE name = 'data_directory')
                            ELSE pg_tablespace_location(pg_tablespace.oid)
                       END) ||
                      ''''
                 FROM pg_tablespace
                WHERE oid = '{{INTOID}}'
        ) ||
        
        -- end semicolon
        (';') ||
        
        -- comment
        (
               SELECT CASE WHEN description IS NOT NULL
                           THEN E'\n\nCOMMENT ON TABLESPACE ' ||
                                        (quote_ident(pg_tablespace.spcname)) || ' IS ' ||
                                        quote_literal(pg_description.description) || ';' ELSE '' END
                 FROM pg_tablespace
            LEFT JOIN pg_description ON pg_description.objoid = pg_tablespace.oid
                WHERE pg_tablespace.oid = '{{INTOID}}'
        );
*/});




statQuery.all_databases = ml(function () {/*
    SELECT numbackends, xact_commit, xact_rollback, blks_read, blks_hit, tup_returned, tup_fetched,
           tup_inserted, tup_updated, tup_deleted, to_char(stats_reset, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)'),
           pg_stat_database_conflicts.confl_bufferpin, pg_stat_database_conflicts.confl_deadlock,
           pg_stat_database_conflicts.confl_lock, pg_stat_database_conflicts.confl_snapshot,
           pg_stat_database_conflicts.confl_tablespace, temp_files, temp_bytes, deadlocks, blk_read_time,
           blk_write_time, pg_size_pretty(pg_database_size(pg_stat_database.datid))
      FROM pg_stat_database
 LEFT JOIN pg_stat_database_conflicts ON pg_stat_database.datid = pg_stat_database_conflicts.datid;
*/});

statQuery.one_database = ml(function () {/*
    SELECT numbackends, xact_commit, xact_rollback, blks_read, blks_hit, tup_returned, tup_fetched,
           tup_inserted, tup_updated, tup_deleted, to_char(stats_reset, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)'),
           pg_stat_database_conflicts.confl_bufferpin, pg_stat_database_conflicts.confl_deadlock,
           pg_stat_database_conflicts.confl_lock, pg_stat_database_conflicts.confl_snapshot,
           pg_stat_database_conflicts.confl_tablespace, temp_files, temp_bytes, deadlocks, blk_read_time,
           blk_write_time, pg_size_pretty(pg_database_size(pg_stat_database.datid))
      FROM pg_stat_database
 LEFT JOIN pg_stat_database_conflicts ON pg_stat_database.datid = pg_stat_database_conflicts.datid
     WHERE pg_stat_database.datname = CURRENT_DATABASE();
*/});


//change in pg-9.2-tree-functions.js

statQuery.objectColumn = ml(function () {/*
SELECT 1 AS sort,
    'Null Fraction',
    'Average Width',
    'Distinct Values',
    'Most Common Values',
    'Most Common Frequencies',
    'Histogram Bounds',
    'Correlation'
UNION ALL
    SELECT 2 AS sort,
        null_frac::text,
        avg_width::text,
        n_distinct::text,
        most_common_vals::text,
        most_common_freqs::text,
        histogram_bounds::text,
        correlation::text
    FROM pg_stats
    LEFT JOIN pg_catalog.pg_stat_user_tables ON pg_stat_user_tables.schemaname = pg_stats.schemaname AND pg_stat_user_tables.relname = pg_stats.tablename
    WHERE pg_stat_user_tables.relid = {{INTOID}}
    AND attname = '{{STRSQLSAFENAME}}'
    ORDER BY sort ASC;
    */});
    

statQuery.objectTable = ml(function () {/*
 SELECT 1 AS sort,
        '# Of Sequential Scans',
        '# Of Live Rows Fetched By Sequential Scans',
        '# Of Index Scans',
        '# Of Live Rows Fetched By Index Scans',
        '# Of Rows Inserted',
        '# Of Rows Updated',
        '# Of Rows Deleted',
        '# Of Rows HOT Updated',
        'Est. # Of Live Rows',
        'Est. # Of Dead Rows',
        'Last Vacuum',
        'Last Auto-Vacuum',
        'Last Analyze',
        'Last Auto-Analyze',
        '# Of Times Vacuumed',
        '# Of Times Auto-Vacuumed',
        '# Of Times Analyzed',
        '# Of Times Auto-Analyzed',
        '# Of Disc Blocks Read From This Table',
        '# Of Buffer Hits In This Table',
        '# Of Disc Blocks Read From Indexes On This Table',
        '# Of Buffer Hits In Indexes On This Table',
        '# Of Disc Blocks Read From This Table''s TOAST Table',
        '# Of Buffer Hits In This Table''s TOAST Table',
        '# Of Disc Blocks Read From This Table''s TOAST Table Indexes',
        '# Of Buffer Hits In This Table''s TOAST Table Indexes'
UNION ALL
   SELECT 2 AS sort,
          seq_scan::text,
          seq_tup_read::text,
          idx_scan::text,
          idx_tup_fetch::text,
          n_tup_ins::text,
          n_tup_upd::text,
          n_tup_del::text,
          n_tup_hot_upd::text,
          n_live_tup::text,
          n_dead_tup::text,
          to_char(last_vacuum, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)')::text,
          to_char(last_autovacuum, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)')::text,
          to_char(last_analyze, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)')::text,
          to_char(last_autoanalyze, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)')::text,
          vacuum_count::text,
          autovacuum_count::text,
          analyze_count::text,
          autoanalyze_count::text,
          heap_blks_read::text,
          heap_blks_hit::text,
          idx_blks_read::text,
          idx_blks_hit::text,
          toast_blks_read::text,
          toast_blks_hit::text,
          tidx_blks_read::text,
          tidx_blks_hit::text
     FROM pg_catalog.pg_stat_all_tables
LEFT JOIN pg_catalog.pg_statio_all_tables ON pg_statio_all_tables.relid = pg_stat_all_tables.relid
    WHERE pg_stat_all_tables.relid = {{INTOID}}
       OR (pg_stat_all_tables.schemaname || '.' || pg_stat_all_tables.relname) = '{{STRSQLSAFENAME}}'
 ORDER BY sort ASC;
*/});

statQuery.one_index = ml(function () {/*
 SELECT 1 AS sort,
        '# Of Scans On This Index',
        '# Of Entries Returned By This Index',
        '# Of Rows Fetched By Simple Index Scans Using This Index',
        '# Of Disc Blocks Read From This Index',
        '# Of Buffer Hits In This Index'
UNION
   SELECT 2 AS sort,
          idx_scan::text,
          idx_tup_read::text,
          idx_tup_fetch::text,
          idx_blks_read::text,
          idx_blks_hit::text
     FROM pg_catalog.pg_stat_all_indexes
LEFT JOIN pg_catalog.pg_statio_all_indexes ON pg_statio_all_indexes.indexrelid = pg_stat_all_indexes.indexrelid
    WHERE pg_stat_all_indexes.indexrelid = {{INTOID}}
       OR (pg_stat_all_indexes.schemaname || '.' || pg_stat_all_indexes.indexrelname) = '{{STRSQLSAFENAME}}'
 ORDER BY sort ASC;
*/});

statQuery.objectSequence = ml(function () {/*
   SELECT 1 AS sort,
          '# Of Blocks Read From This Sequence',
          '# Of Buffer Hits In This Sequence'
UNION ALL
   SELECT 2 AS sort,
          blks_read::text,
          blks_hit::text
     FROM pg_catalog.pg_statio_all_sequences
    WHERE relid = {{INTOID}} OR (schemaname || '.' || relname) = '{{STRSQLSAFENAME}}'
 ORDER BY sort ASC
*/});

statQuery.objectFunction = ml(function () {/*
  SELECT 1 AS sort,
         '# Of Calls To This Function',
         'Time Spent In This Function',
         'Time Spent In This Function And It''s Caller Functions'
UNION ALL
  SELECT 2 AS sort,
         calls::text,
         self_time::text,
         total_time::text
    FROM pg_catalog.pg_stat_user_functions
   WHERE funcid = {{INTOID}} OR (schemaname || '.' || funcname) = '{{STRSQLSAFENAME}}'
ORDER BY sort ASC
*/});

propQuery.prop_server = propQuery.objectCurrentServer = ml(function () {/*
  SELECT "name"
       , COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
       , COALESCE(short_desc, '') || ' ' || COALESCE(extra_desc, '') as description
    FROM pg_settings
ORDER BY "name" ASC;

--SELECT 1 AS sort,
--       'Application Name',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'application_name'
--UNION ALL
--SELECT 2 AS sort,
--       'Authentication Timeout',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'authentication_timeout'
--UNION ALL
--SELECT 3 AS sort,
--       'Backslash Quote',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'backslash_quote'
--UNION ALL
--SELECT 4 AS sort,
--       'Validate When Running CREATE FUNCTION',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'check_function_bodies'
----UNION ALL
----SELECT 5 AS sort,
----       '',
----       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
----  FROM pg_settings WHERE "name" = 'db_user_namespace'
--UNION ALL
--SELECT 6 AS sort,
--       'Deadlock Timeout',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'deadlock_timeout'
--UNION ALL
--SELECT 7 AS sort,
--       'Default WITH OID=TRUE',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'default_with_oids'
--UNION ALL
--SELECT 8 AS sort,
--       'Log Rotation Age',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'log_rotation_age'
--UNION ALL
--SELECT 9 AS sort,
--       'Log Rotation Size',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'log_rotation_size'
--UNION ALL
--SELECT 10 AS sort,
--       'Maximum # of Connections',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'max_connections'
--UNION ALL
--SELECT 11 AS sort,
--       'Password Encryption',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'password_encryption'
--UNION ALL
--SELECT 12 AS sort,
--       'Port',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'port'
--UNION ALL
--SELECT 13 AS sort,
--       'Delay After Authentication',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'post_auth_delay'
--UNION ALL
--SELECT 14 AS sort,
--       'Delay Before Authentication',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'pre_auth_delay'
--UNION ALL
--SELECT 15 AS sort,
--       'Server Version',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'server_version'
--UNION ALL
--SELECT 16 AS sort,
--       'SSL',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl'
--UNION ALL
--SELECT 17 AS sort,
--       'SSL Certificate Authority File',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_ca_file'
--UNION ALL
--SELECT 18 AS sort,
--       'SSL Certificate File',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_cert_file'
--UNION ALL
--SELECT 19 AS sort,
--       'SSL Ciphers',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_ciphers'
--UNION ALL
--SELECT 20 AS sort,
--       'SSL Certificate Revocation List File',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_crl_file'
--UNION ALL
--SELECT 21 AS sort,
--       'SSL Key File',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_key_file'
--UNION ALL
--SELECT 22 AS sort,
--       'SSL Renegotiation Limit',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'ssl_renegotiation_limit'
--UNION ALL
--SELECT 23 AS sort,
--       'Time Zone',
--       COALESCE((setting || CASE WHEN unit IS NOT NULL THEN unit ELSE '' END), '')
--  FROM pg_settings WHERE "name" = 'TimeZone';    
*/});


propQuery.prop_database = propQuery.objectDatabase = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'Owner',
          'ACL',
          'Encoding',
          'Collate',
          'Ctype',
          'This Database Is A Template?',
          'Connections Allowed?',
          'Connection Limit',
          'Last System OID'
UNION ALL
   SELECT 2 AS sort,
          datname::text,
          pg_authid.rolname::text,
          datacl::text,
          pg_encoding_to_char(encoding)::text,
          datcollate::text,
          datctype::text,
          (CASE WHEN datistemplate THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN datallowconn THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN datconnlimit = -1 THEN 'No Limit' ELSE datconnlimit::text END)::text,
          datlastsysoid::text
     FROM pg_database
LEFT JOIN pg_authid ON pg_authid.oid = pg_database.datdba
    WHERE datname = CURRENT_DATABASE()
 ORDER BY sort ASC;  
*/});

propQuery.prop_aggregate = propQuery.objectAggregate = ml(function () {/*
     SELECT 1 AS sort,
            'Name',
            'OID',
            'ACL',
            'Owner',
            'Parameter Types',
            'State Transition Function',
            'State Value Data Type',
            'Final Function',
            'Initial Condition',
            'Sort Operator',
            'Comment'
UNION ALL
     SELECT 2 AS sort,
            quote_ident(fnnsp.nspname) || '.' || quote_ident(fnpr.proname)::text,
            fnpr.oid::text,
            fnpr.proacl::text,
            pg_roles.rolname::text,
            oidvectortypes(fnpr.proargtypes)::text,
            (CASE WHEN aggtransfn IS NOT NULL THEN quote_ident(sfnsp.nspname) || '.' || quote_ident(sfpr.proname) || '(' || COALESCE(oidvectortypes(sfpr.proargtypes)::text, '') || ')' ELSE '' END)::text,
            (CASE WHEN format_type(aggtranstype::oid, null) IS NOT NULL THEN format_type(aggtranstype::oid, null) ELSE '' END)::text,
            (CASE WHEN aggfinalfn != '-'::regproc THEN quote_ident(flnsp.nspname) || '.' || quote_ident(flpr.proname) || '(' || COALESCE(oidvectortypes(flpr.proargtypes)::text, '') || ')' ELSE '' END)::text,
            (CASE WHEN agginitval IS NOT NULL THEN quote_literal(agginitval) ELSE '' END)::text,
            (CASE WHEN aggsortop != 0 THEN quote_ident(opnsp.nspname) || '.' || quote_ident(pg_operator.oprname) ||
            ' (' || format_type(oprleft, NULL) || ', ' || format_type(oprright, NULL) || ')' ELSE '' END)::text,
            description::text
       FROM pg_aggregate
  LEFT JOIN pg_proc       fnpr      ON fnpr.oid   = pg_aggregate.aggfnoid
  LEFT JOIN pg_namespace  fnnsp     ON fnnsp.oid  = fnpr.pronamespace
  LEFT JOIN pg_proc       sfpr      ON sfpr.oid   = pg_aggregate.aggtransfn
  LEFT JOIN pg_namespace  sfnsp     ON sfnsp.oid  = sfpr.pronamespace
  LEFT JOIN pg_proc       flpr      ON flpr.oid   = pg_aggregate.aggfinalfn
  LEFT JOIN pg_namespace  flnsp     ON flnsp.oid  = flpr.pronamespace
  LEFT JOIN pg_operator             ON pg_operator.oid = pg_aggregate.aggsortop
  LEFT JOIN pg_namespace opnsp      ON opnsp.oid = pg_operator.oprnamespace
  LEFT JOIN pg_description          ON fnpr.oid  = pg_description.objoid
  LEFT JOIN pg_roles                ON fnpr.proowner = pg_roles.oid
      WHERE fnpr.oid = {{INTOID}} AND fnpr.proisagg
   ORDER BY sort ASC;
*/});

propQuery.prop_function = propQuery.objectFunction = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'Owner',
          'OID',
          'Parameters',
          'Return Type',
          'Language',
          'Volatility',
          'Security Definer?',
          'Strict?',
          'Leakproof?',
          'Window Function?',
          'Cost',
          'Rows',
          'ACL',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          proname::text,
          pg_roles.rolname::text,
          pg_proc.oid::text,
          pg_get_function_arguments(pg_proc.oid)::text,
          pg_get_function_result(pg_proc.oid)::text,
          lanname::text,
          (CASE WHEN provolatile = 'v' THEN 'Volatile'
          WHEN provolatile = 'i' THEN 'Immutable'
          WHEN provolatile = 's' THEN 'Stable' END)::text,
          (CASE WHEN prosecdef THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN proisstrict THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN proleakproof THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN proiswindow THEN 'Yes' ELSE 'No' END)::text,
          procost::text,
          prorows::text,
          proacl::text,
          description::text
     FROM pg_proc
LEFT JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
LEFT JOIN pg_language ON pg_language.oid = pg_proc.prolang
LEFT JOIN pg_roles ON pg_proc.proowner = pg_roles.oid
LEFT JOIN pg_description ON pg_proc.oid=pg_description.objoid
    WHERE pg_proc.oid = {{INTOID}} AND proisagg = FALSE;
*/});

propQuery.prop_index = propQuery.objectIndex = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Tablespace',
          'Related Table',
          'Columns Indexed',
          'Operator Classes',
          'Collations',
          'Unique?',
          'Unique Immidiately Forced?',
          'Primary?',
          'Supports Exclusion Constraint?',
          'Table Last Clustered On This Index?',
          'Valid?',
          'Unused Until Minimum?',
          'Ready For Inserts/Updates?',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_class.relname::text,
          pg_class.oid::text,
          pg_roles.rolname::text,
          (CASE WHEN pg_class.reltablespace = 0 THEN 'pg_default' ELSE pg_tablespace.spcname END)::text,
          (SELECT sub_rel.relname FROM pg_class sub_rel WHERE sub_rel.oid = pg_index.indrelid)::text,
          (
            SELECT string_agg(index_cols.attname, E'\n')
              FROM (
                        (SELECT ''::text, unnest(pg_index.indkey::int[]) AS colnum) indexcols
                        JOIN
                        (SELECT attname::text, attnum::int
                           FROM pg_attribute
                          WHERE attrelid = pg_index.indrelid) allcols ON allcols.attnum = indexcols.colnum
                   ) index_cols
          )::text,
          (
            SELECT string_agg(opc_cols.opcname, E'\n')
              FROM (
                        (SELECT ''::text, unnest(pg_index.indclass::oid[]) AS opcoid) indexopc
                        JOIN
                        (SELECT opcname::text, oid
                           FROM pg_opclass) allopc ON allopc.oid = indexopc.opcoid
                    ) opc_cols
          )::text,
          (
            SELECT string_agg(coll_cols.collname, E'\n')
              FROM (
                        (SELECT ''::text, unnest(pg_index.indcollation::oid[]) AS opcoid) indexopc
                        JOIN
                        (SELECT collname::text, oid
                           FROM pg_collation) allcoll ON allcoll.oid = indexopc.opcoid
                    ) coll_cols
          )::text,
          (CASE WHEN pg_index.indisunique THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indimmediate THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indisprimary THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indisexclusion THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indisclustered THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indisvalid THEN 'Yes' ELSE 'No, Could Be Unstable' END),
          (CASE WHEN pg_index.indcheckxmin THEN 'Yes' ELSE 'No' END),
          (CASE WHEN pg_index.indisready THEN 'Yes' ELSE 'No' END),
          pg_description.description
     FROM pg_class
LEFT JOIN pg_roles ON pg_roles.oid = pg_class.relowner
LEFT JOIN pg_index ON pg_index.indexrelid = pg_class.oid
LEFT JOIN pg_tablespace ON pg_class.reltablespace = pg_tablespace.oid
LEFT JOIN pg_description ON pg_description.objoid = pg_class.oid AND pg_description.objsubid = 0 
    WHERE pg_class.oid = '{{INTOID}}';
*/});

// this is now set in the handleQueryVersionDifferences function due to version differences in available properties
// propQuery.prop_role = propQuery.objectRole = ml(function () {/*
//   SELECT 1 AS sort,
//          'Name',
//          'OID',
//          'Expires',
//          'Can Login?',
//          'Superuser?',
//          'Can Create Databases?',
//          'Can Create Roles?',
//          --'Bypasses row level security?',
//          'Inherits?',
//          'Replication?',
//          'Connection Limit',
//          'Comment'
// UNION ALL
//   SELECT 2 AS sort,
//           pg_roles.rolname::text,
//           pg_roles.oid::text,
//           (CASE WHEN pg_roles.rolvaliduntil IS NULL
//                   OR length(pg_roles.rolvaliduntil::date::text) = 0 
//                   OR pg_roles.rolvaliduntil = 'infinity'
//                     THEN 'Never' ELSE to_char(pg_roles.rolvaliduntil::date, 'YYYY-MM-dd FMHH:MI:SSPM (TZ)') END)::text,
//           (CASE WHEN pg_roles.rolcanlogin    THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolsuper       THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolcreatedb    THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolcreaterole  THEN 'Yes' ELSE 'No' END)::text,
//           --(CASE WHEN pg_roles.rolbypassrls     THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolinherit     THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolreplication THEN 'Yes' ELSE 'No' END)::text,
//           (CASE WHEN pg_roles.rolconnlimit > -1 THEN pg_roles.rolconnlimit::text ELSE 'No Limit' END)::text,
//           (description::text)::text
//      FROM pg_roles
// LEFT JOIN pg_auth_members ON pg_roles.oid = pg_auth_members.member 
// LEFT JOIN pg_roles owner_role ON owner_role.oid = pg_auth_members.roleid 
// LEFT JOIN pg_description ON pg_roles.oid = pg_description.objoid
//     WHERE pg_roles.oid = '{{INTOID}}'
//  ORDER BY sort;
// */});

propQuery.prop_language = propQuery.objectLanguage = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Trusted?',
          'Handler Function',
          'Inline Function',
          'Validator Function',
          'Internal?',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_language.lanname::text,
          pg_language.oid::text,
          pg_roles.rolname::text,
          pg_language.lanacl::text,
          (CASE WHEN pg_language.lanpltrusted THEN 'Yes' ELSE 'No' END)::text,
          (SELECT proname FROM pg_proc WHERE pg_proc.oid = pg_language.lanplcallfoid)::text,
          (SELECT proname FROM pg_proc WHERE pg_proc.oid = pg_language.laninline)::text,
          (SELECT proname FROM pg_proc WHERE pg_proc.oid = pg_language.lanvalidator)::text,
          (CASE WHEN pg_language.lanispl THEN 'No' ELSE 'Yes' END)::text,
          description::text
     FROM pg_language
LEFT JOIN pg_roles ON pg_roles.oid = pg_language.lanowner
LEFT JOIN pg_description ON pg_description.objoid = pg_language.oid AND pg_description.objsubid = 0 
    WHERE pg_language.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_schema = propQuery.objectSchema = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Default Function ACL',
          'Default Sequence ACL',
          'Default Table/View ACL',
          'Default Type ACL',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_namespace.nspname::text,
          pg_namespace.oid::text,
          pg_roles.rolname::text,
          pg_namespace.nspacl::text,
          (SELECT defaclacl FROM pg_default_acl WHERE defaclnamespace = pg_namespace.oid AND defaclobjtype = 'f')::text,
          (SELECT defaclacl FROM pg_default_acl WHERE defaclnamespace = pg_namespace.oid AND defaclobjtype = 'S')::text,
          (SELECT defaclacl FROM pg_default_acl WHERE defaclnamespace = pg_namespace.oid AND defaclobjtype = 'r')::text,
          (SELECT defaclacl FROM pg_default_acl WHERE defaclnamespace = pg_namespace.oid AND defaclobjtype = 'T')::text,
          description::text::text
     FROM pg_namespace
LEFT JOIN pg_roles ON pg_roles.oid = pg_namespace.nspowner
LEFT JOIN pg_description ON pg_description.objoid = pg_namespace.oid AND pg_description.objsubid = 0 
    WHERE pg_namespace.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_collation = propQuery.objectCollation = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'LC_COLLATE',
          'LC_CTYPE',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_collation.collname::text,
          pg_collation.oid::text,
          pg_roles.rolname::text,
          pg_collation.collcollate::text,
          pg_collation.collctype::text,
          description::text::text
     FROM pg_collation
LEFT JOIN pg_roles ON pg_roles.oid = pg_collation.collowner
LEFT JOIN pg_description ON pg_description.objoid = pg_collation.oid AND pg_description.objsubid = 0 
    WHERE pg_collation.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_operator = propQuery.objectOperator = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Kind',
          'Left Data Type',
          'Right Data Type',
          'Result Data Type',
          'Operator Function',
          'Commutator Function',
          'Negator Function',
          'Join Function',
          'Restrict Function',
          'Can Hash?',
          'Can Merge?',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_operator.oprname::text,
          pg_operator.oid::text,
          pg_roles.rolname::text,
          (CASE WHEN pg_operator.oprkind = 'b' THEN 'infix'
                WHEN pg_operator.oprkind = 'l' THEN 'prefix'
                WHEN pg_operator.oprkind = 'r' THEN 'postfix' END)::text,
          format_type(pg_operator.oprleft, NULL)::text,
          format_type(pg_operator.oprright, NULL)::text,
          format_type(pg_operator.oprresult, NULL)::text,
          pg_proc.proname::text,
          opr_commutator.oprname::text,
          opr_negator.oprname::text,
          join_function.proname::text,
          restrict_function.proname::text,
          (CASE WHEN pg_operator.oprcanhash THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN pg_operator.oprcanmerge THEN 'Yes' ELSE 'No' END)::text,
          description::text
     FROM pg_operator
LEFT JOIN pg_roles ON pg_roles.oid = pg_operator.oprowner
LEFT JOIN pg_proc ON pg_proc.oid = pg_operator.oprcode
LEFT JOIN pg_proc join_function ON join_function.oid = pg_operator.oprjoin
LEFT JOIN pg_proc restrict_function ON restrict_function.oid = pg_operator.oprrest
LEFT JOIN pg_operator opr_commutator ON opr_commutator.oid = pg_operator.oprcom
LEFT JOIN pg_operator opr_negator ON opr_negator.oid = pg_operator.oprnegate
LEFT JOIN pg_description ON pg_description.objoid = pg_operator.oid AND pg_description.objsubid = 0 
    WHERE pg_operator.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_sequence = propQuery.objectSequence = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Current Value',
          'Minimum Value',
          'Maximum Value',
          'Increment Value',
          'Cache',
          'Cycled?',
          'Called?',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_class.relname::text,
          pg_class.oid::text,
          pg_roles.rolname::text,
          pg_class.relacl::text,
          sequences.start_value::text,
          sequences.minimum_value::text,
          sequences.maximum_value::text,
          sequences.increment::text,
          (SELECT cache_value FROM {{STRSQLSAFENAME}})::text,
          (SELECT (CASE WHEN is_cycled THEN 'Yes' ELSE 'No' END) FROM {{STRSQLSAFENAME}})::text,
          (SELECT (CASE WHEN is_called THEN 'Yes' ELSE 'No' END) FROM {{STRSQLSAFENAME}})::text,
          description::text
     FROM pg_class
LEFT JOIN pg_roles ON pg_roles.oid = pg_class.relowner
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
LEFT JOIN information_schema.sequences ON sequences.sequence_schema = pg_namespace.nspname
				       AND sequences.sequence_name = pg_class.relname
LEFT JOIN pg_description ON pg_description.objoid = pg_class.oid AND pg_description.objsubid = 0 
    WHERE pg_class.relkind = 'S' AND pg_class.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_table = propQuery.objectTable = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Tablespace',
          'Of Type',
          'Constraints',
          'Estimated # Of Records',
          'Options',
          'Persistence',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_class.relname::text,
          pg_class.oid::text,
          pg_roles.rolname::text,
          pg_class.relacl::text,
          CASE WHEN pg_class.reltablespace = 0 THEN 'pg_default' ELSE pg_tablespace.spcname END,
          CASE WHEN pg_class.reloftype = 0 THEN NULL ELSE format_type(pg_class.reloftype, null) END,
          (SELECT string_agg(' ' || conname || ': ' || pg_get_constraintdef(pg_constraint.oid, true), E'\n')
                     FROM pg_constraint
                     JOIN pg_class pg_class_inner ON pg_class_inner.oid = conrelid
                    WHERE pg_class_inner.oid = pg_class.oid)::text,
          reltuples::text,
          (
            CASE WHEN pg_class.relhasoids THEN 'OIDS=TRUE' ELSE 'OIDS=FALSE' END ||
            CASE WHEN array_upper(reloptions, 1) > 0 THEN '\n' || array_to_string(reloptions, '\n') ELSE '' END
          )::text,
          (CASE WHEN relpersistence = 'p' THEN 'Permanent Table'
                WHEN relpersistence = 'u' THEN 'Unlogged Table'
                WHEN relpersistence = 't' THEN 'Temporary Table' END)::text,
          description::text
     FROM pg_class
LEFT JOIN pg_roles ON pg_roles.oid = pg_class.relowner
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
LEFT JOIN pg_catalog.pg_tablespace ON pg_class.reltablespace = pg_tablespace.oid
LEFT JOIN pg_description ON pg_description.objoid = pg_class.oid AND pg_description.objsubid = 0 
    WHERE pg_class.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_rule = ml(function () {/*
SELECT  'Name',
        'OID',
        'Relation',
        'Event',
        'Mode',
        'Instead?',
        'Expression Tree',
        'Query Tree'
UNION ALL
SELECT  rulename::text,
        pg_rewrite.oid::text,
        relname::text,
        CASE    WHEN ev_type = '1' THEN 'SELECT'
                WHEN ev_type = '2' THEN 'UPDATE'
                WHEN ev_type = '3' THEN 'INSERT'
                WHEN ev_type = '4' THEN 'DELETE'
                                   ELSE 'unknown'
        END,
        CASE    WHEN ev_enabled = 'O' THEN '"origin" and "local" modes'
                WHEN ev_enabled = 'D' THEN 'diabled'
                WHEN ev_enabled = 'R' THEN '"replica" mode'
                WHEN ev_enabled = 'A' THEN 'enabled'
                                      ELSE 'unknown'
        END,
        CASE WHEN is_instead THEN 'Yes' ELSE 'No' END,
        pg_get_expr(ev_qual, '{{INTOID}}'::oid),
        pg_get_expr(ev_action, '{{INTOID}}'::oid)
    FROM pg_rewrite
    LEFT JOIN pg_class ON pg_class.oid = pg_rewrite.ev_class
    WHERE pg_rewrite.oid = '{{INTOID}}'::oid;
*/});

propQuery.prop_constraint = ml(function () {/*
SELECT  1 AS sort,
        'Name'::text,
        'OID'::text,
        'Type'::text,
        'Deferrable?'::text,
        'Deferred by Default?'::text,
        'Validated?'::text,
        'Relation'::text,
        'Domain'::text,
        'Index'::text,
        'Foreign Relation'::text,
        'Foreign Update Action'::text,
        'Foreign Delete Action'::text,
        'Foreign Match Type'::text,
        'Local?'::text,
        'Inheritance Ancestors'::text,
        'No Inherit?'::text,
        'Columns'::text,
        'Foreign Columns'::text,
        'PK = FK Comparisons'::text,
        'PK = PK Comparisons'::text,
        'FK = FK Comparisons'::text,
        'Column Exclusions'::text,
        'Binary Definition'::text,
        'Text Definition'::text
UNION ALL 
SELECT  2 AS sort,
        pg_namespace_constraint.nspname || '.' || conname::text,
        pg_constraint.oid::text,
        CASE contype::text
            WHEN 'c' THEN 'CHECK'
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 't' THEN 'TRIGGER'
            WHEN 'x' THEN 'EXCLUSION'
            ELSE 'unknown'
        END::text,
        CASE WHEN condeferrable THEN 'Yes' ELSE 'No' END,
        CASE WHEN condeferred THEN 'Yes' ELSE 'No' END,
        CASE WHEN convalidated THEN 'Yes' ELSE 'No' END,
        pg_namespace_rel_class.nspname || '.' || pg_rel_class.relname,
        COALESCE(pg_domain_type.typname, 'None'),
        COALESCE(pg_namespace_index_class.nspname || '.' || pg_index_class.relname, 'None'),
        COALESCE(pg_namespace_foreign_class.nspname || '.' || pg_foreign_class.relname, 'None'),
        CASE confupdtype::text
            WHEN 'a' THEN 'None'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE 'None'
        END::text,
        CASE confdeltype::text
            WHEN 'a' THEN 'None'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE 'None'
        END::text,
        CASE confmatchtype::text
            WHEN 'f' THEN 'FULL'
            WHEN 'p' THEN 'PARTIAL'
            WHEN 'u' THEN 'SIMPLE'
            ELSE 'None'
        END::text,
        CASE WHEN conislocal THEN 'Yes' ELSE 'No' END,
        coninhcount::text,
        CASE WHEN connoinherit THEN 'Yes' ELSE 'No' END,
        string_agg(pg_rel_attribute.attname, ', '),
        string_agg(pg_foreign_attribute.attname, ', '),
        string_agg(pg_pf_operator.oprname, ', '),
        string_agg(pg_pp_operator.oprname, ', ')::text,
        string_agg(pg_ff_operator.oprname, ', ')::text,
        string_agg(pg_excl_operator.oprname, ', ')::text,
        conbin::text,
        consrc::text
    FROM pg_constraint
    LEFT JOIN pg_class      pg_rel_class                ON pg_constraint.conrelid           =   pg_rel_class.oid
    LEFT JOIN pg_type       pg_domain_type              ON pg_constraint.contypid           =   pg_domain_type.oid
    LEFT JOIN pg_class      pg_index_class              ON pg_constraint.conindid           =   pg_index_class.oid
    LEFT JOIN pg_class      pg_foreign_class            ON pg_constraint.confrelid          =   pg_foreign_class.oid
    LEFT JOIN pg_attribute  pg_rel_attribute            ON pg_constraint.conrelid           =   pg_rel_attribute.attrelid       AND pg_rel_attribute.attnum = ANY(pg_constraint.conkey)
    LEFT JOIN pg_attribute  pg_foreign_attribute        ON pg_constraint.conrelid           =   pg_foreign_attribute.attrelid   AND pg_foreign_attribute.attnum = ANY(pg_constraint.confkey)
    LEFT JOIN pg_operator   pg_pf_operator              ON pg_pf_operator.oid               =   ANY(pg_constraint.conpfeqop)
    LEFT JOIN pg_operator   pg_pp_operator              ON pg_pp_operator.oid               =   ANY(pg_constraint.conppeqop)
    LEFT JOIN pg_operator   pg_ff_operator              ON pg_ff_operator.oid               =   ANY(pg_constraint.conffeqop)
    LEFT JOIN pg_operator   pg_excl_operator            ON pg_excl_operator.oid             =   ANY(pg_constraint.conexclop)
    LEFT JOIN pg_namespace  pg_namespace_constraint     ON pg_namespace_constraint.oid      =   pg_constraint.connamespace
    LEFT JOIN pg_namespace  pg_namespace_rel_class      ON pg_namespace_rel_class.oid       =   pg_rel_class.relnamespace
    LEFT JOIN pg_namespace  pg_namespace_index_class    ON pg_namespace_index_class.oid     =   pg_index_class.relnamespace
    LEFT JOIN pg_namespace  pg_namespace_foreign_class  ON pg_namespace_foreign_class.oid   =   pg_foreign_class.relnamespace
    WHERE pg_constraint.oid = '{{INTOID}}'::oid
    GROUP BY pg_namespace_constraint.nspname, conname, pg_constraint.oid, contype, condeferrable, condeferred, convalidated, pg_namespace_rel_class.nspname, pg_rel_class.relname, pg_domain_type.typname, pg_namespace_index_class.nspname, pg_index_class.relname, pg_namespace_foreign_class.nspname, pg_foreign_class.relname, confupdtype, confdeltype, confmatchtype, conislocal, coninhcount, connoinherit, conexclop, conbin, consrc
    ORDER BY sort ASC;
*/});

propQuery.prop_trigger = ml(function () {/*
SELECT 1 AS sort,
      'Name'::text,
      'OID'::text,
      'ON'::text,
      'Function'::text,
      'Type'::text,
      'Each row?'::text,
      'INSERT?'::text,
      'DELETE?'::text,
      'UDPATE?'::text,
      'TRUNCATE?'::text,
      'Enabled'::text,
      'Internal'::text,
      'Deferrable?'::text,
      'Initially Deferred?'::text,
      'Num Args'::text,
      'Args'::text
UNION ALL
SELECT 2 AS sort,
        pg_trigger.tgname::text,
        pg_trigger.oid::text,
        pg_class_namespace.nspname || '.' || pg_class.relname::text,
        pg_proc_namespace.nspname || '.' || pg_proc.proname,
        (
            CASE    WHEN (pg_trigger.tgtype & (1 << 1)) = (1 << 1)  THEN 'BEFORE'
                    WHEN (pg_trigger.tgtype & (1 << 6)) = (1 << 6)  THEN 'INSTEAD OF'
                                                                    ELSE 'AFTER'
            END
        ),
        (CASE WHEN (pg_trigger.tgtype & (1 << 0)) = (1 << 0) THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN (pg_trigger.tgtype & (1 << 2)) = (1 << 2) THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN (pg_trigger.tgtype & (1 << 3)) = (1 << 3) THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN (pg_trigger.tgtype & (1 << 4)) = (1 << 4) THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN (pg_trigger.tgtype & (1 << 5)) = (1 << 5) THEN 'Yes' ELSE 'No' END)::text,
        (
            CASE    WHEN pg_trigger.tgenabled = 'O' THEN '"origin" and "local" modes'
                    WHEN pg_trigger.tgenabled = 'D' THEN 'diabled'
                    WHEN pg_trigger.tgenabled = 'R' THEN '"replica" mode'
                    WHEN pg_trigger.tgenabled = 'A' THEN 'enabled'
                                                    ELSE 'unknown'
            END
        ),
        (CASE WHEN pg_trigger.tgisinternal THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN pg_trigger.tgdeferrable THEN 'Yes' ELSE 'No' END)::text,
        (CASE WHEN pg_trigger.tginitdeferred THEN 'Yes' ELSE 'No' END)::text,
        pg_trigger.tgnargs::text,
        pg_trigger.tgargs::text
    FROM pg_trigger
    LEFT JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    LEFT JOIN pg_namespace pg_class_namespace ON pg_class.relnamespace = pg_class_namespace.oid
    LEFT JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
    LEFT JOIN pg_namespace pg_proc_namespace ON pg_proc.pronamespace = pg_proc_namespace.oid
    WHERE pg_trigger.oid = '{{INTOID}}'::oid
 ORDER BY sort
*/});

propQuery.prop_view = propQuery.objectView = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_class.relname::text,
          pg_class.oid::text,
          pg_roles.rolname::text,
          pg_class.relacl::text,
          description::text
     FROM pg_class
LEFT JOIN pg_roles ON pg_roles.oid = pg_class.relowner
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
LEFT JOIN pg_catalog.pg_tablespace ON pg_class.reltablespace = pg_tablespace.oid
LEFT JOIN pg_description ON pg_description.objoid = pg_class.oid AND pg_description.objsubid = 0 
    WHERE pg_class.relkind = 'v' AND pg_class.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_cast = propQuery.objectCast = ml(function () {/*
   SELECT 1 AS sort,
          'OID',
          'From',
          'To',
          'Cast Function',
          'Cast Handling',
          'Contexts Allowed',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_cast.oid::text,
          format_type(pg_cast.castsource, NULL)::text,
          format_type(pg_cast.casttarget, NULL)::text,
          pg_proc.proname::text,
          (CASE WHEN castmethod = 'f' THEN 'Cast Function'
                WHEN castmethod = 'i' THEN 'I/O Functions'
                WHEN castmethod = 'b' THEN 'Binary-coercible, No conversion' END)::text,
          (CASE WHEN castcontext = 'e' THEN 'Explicit'
                WHEN castcontext = 'a' THEN 'Implicit, Explicit'
                WHEN castcontext = 'i' THEN 'Implicit In Expressions and Other' END)::text,
          description::text
     FROM pg_cast
LEFT JOIN pg_proc ON pg_proc.oid = pg_cast.castfunc
LEFT JOIN pg_description ON pg_description.objoid = pg_cast.oid AND pg_description.objsubid = 0 
    WHERE pg_cast.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_extension = propQuery.objectExtension = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Schema',
          'Relocatable?',
          'Version',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_extension.extname::text,
          pg_extension.oid::text,
          pg_namespace.nspname,
          (CASE WHEN pg_extension.extrelocatable THEN 'Yes' ELSE 'No' END)::text,
          pg_extension.extversion::text,
          pg_description.description::text
     FROM pg_extension
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_extension.extnamespace
LEFT JOIN pg_description ON pg_description.objoid = pg_extension.oid AND pg_description.objsubid = 0 
    WHERE pg_extension.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_tsConfig = propQuery.objectTextSearchConfiguration = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Parser',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_ts_config.cfgname::text,
          pg_ts_config.oid::text,
          pg_roles.rolname::text,
          pg_ts_parser.prsname::text,
          description::text
     FROM pg_ts_config
LEFT JOIN pg_roles ON pg_roles.oid = pg_ts_config.cfgowner
LEFT JOIN pg_catalog.pg_ts_parser ON pg_ts_parser.oid = pg_ts_config.cfgparser
LEFT JOIN pg_description ON pg_description.objoid = pg_ts_config.oid AND pg_description.objsubid = 0 
    WHERE pg_ts_config.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_tsDictionary = propQuery.objectTextSearchDictionary = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Template',
          'Options',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_ts_dict.dictname::text,
          pg_ts_dict.oid::text,
          pg_roles.rolname::text,
          pg_ts_template.tmplname::text,
          pg_ts_dict.dictinitoption::text,
          description::text
     FROM pg_ts_dict
LEFT JOIN pg_roles ON pg_roles.oid = pg_ts_dict.dictowner
LEFT JOIN pg_catalog.pg_ts_template ON pg_ts_template.oid = pg_ts_dict.dicttemplate
LEFT JOIN pg_description ON pg_description.objoid = pg_ts_dict.oid AND pg_description.objsubid = 0 
    WHERE pg_ts_dict.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_tsParser = propQuery.objectTextSearchParser = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Start Function',
          'Get Token Function',
          'End Function',
          'Headline Function',
          'Lextypes Function',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_ts_parser.prsname::text,
          pg_ts_parser.oid::text,
          func_prsstart.proname::text,
          func_prstoken.proname::text,
          func_prsend.proname::text,
          func_prsheadline.proname::text,
          func_prslextype.proname::text,
          description::text
     FROM pg_ts_parser
LEFT JOIN pg_description ON pg_description.objoid = pg_ts_parser.oid AND pg_description.objsubid = 0 
LEFT JOIN pg_proc func_prsstart ON func_prsstart.oid = pg_ts_parser.prsstart
LEFT JOIN pg_proc func_prstoken ON func_prstoken.oid = pg_ts_parser.prstoken
LEFT JOIN pg_proc func_prsend ON func_prsend.oid = pg_ts_parser.prsend
LEFT JOIN pg_proc func_prsheadline ON func_prsheadline.oid = pg_ts_parser.prsheadline
LEFT JOIN pg_proc func_prslextype ON func_prslextype.oid = pg_ts_parser.prslextype
    WHERE pg_ts_parser.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_tsTemplate = propQuery.objectTextSearchTemplate = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Init Function',
          'Lexize Function',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_ts_template.tmplname::text,
          pg_ts_template.oid::text,
          func_tmplinit.proname::text,
          func_tmpllexize.proname::text,
          description::text
     FROM pg_ts_template
LEFT JOIN pg_description ON pg_description.objoid = pg_ts_template.oid AND pg_description.objsubid = 0 
LEFT JOIN pg_proc func_tmplinit ON func_tmplinit.oid = pg_ts_template.tmplinit
LEFT JOIN pg_proc func_tmpllexize ON func_tmpllexize.oid = pg_ts_template.tmpllexize
    WHERE pg_ts_template.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_operatorFamily = propQuery.objectOperatorFamily = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Access Method',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_opfamily.opfname::text,
          pg_opfamily.oid::text,
          pg_roles.rolname::text,
          pg_am.amname::text,
          description::text
     FROM pg_opfamily
LEFT JOIN pg_roles ON pg_roles.oid = pg_opfamily.opfowner
LEFT JOIN pg_am ON pg_am.oid = pg_opfamily.opfmethod
LEFT JOIN pg_description ON pg_description.objoid = pg_opfamily.oid AND pg_description.objsubid = 0 
    WHERE pg_opfamily.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_operatorClass = propQuery.objectOperatorClass = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'Default?',
          'Type',
          'Access Method',
          'Family',
          'Stored Type',
          'Operators',
          'Functions',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_opclass.opcname::text,
          pg_opclass.oid::text,
          pg_roles.rolname::text,
          (CASE WHEN pg_opclass.opcdefault THEN 'Yes' ELSE 'No' END)::text,
          format_type(pg_opclass.opcintype, NULL)::text,
          pg_am.amname::text,
          pg_opfamily.opfname::text,
          (CASE WHEN pg_opclass.opckeytype = 0
                    THEN format_type(pg_opclass.opcintype, NULL)::text
                    ELSE format_type(pg_opclass.opckeytype, NULL)::text END)::text,
          (SELECT string_agg('OPERATOR '::text || pg_amop.amopstrategy::text || ': ' ||
                             pg_operator_namespace.nspname || '.' || pg_operator.oprname ||
                             '(' ||
                                format_type(pg_operator.oprleft, NULL) || ', ' ||
                                format_type(pg_operator.oprright, NULL) ||
                             ')', E'\n')
                    FROM pg_opclass
               LEFT JOIN pg_catalog.pg_opfamily ON pg_opclass.opcfamily = pg_opfamily.oid
               LEFT JOIN pg_catalog.pg_amop ON pg_opfamily.oid = pg_amop.amopfamily
               LEFT JOIN pg_catalog.pg_operator ON pg_operator.oid = pg_amop.amopopr
                     AND pg_amop.amoplefttype = pg_operator.oprleft
                     AND pg_amop.amoprighttype = pg_operator.oprright
               LEFT JOIN pg_catalog.pg_namespace pg_operator_namespace ON pg_operator_namespace.oid = pg_operator.oprnamespace
                   WHERE pg_opclass.oid = '{{INTOID}}'),
          (SELECT string_agg('FUNCTION '::text || pg_amproc.amprocnum::text || ': ' || pg_proc_namespace.nspname || '.' || pg_proc.proname ||
                                                '(' || COALESCE(pg_get_function_arguments(pg_proc.oid), '') || ')', E'\n')
				 FROM pg_opclass
               LEFT JOIN pg_catalog.pg_opfamily ON pg_opclass.opcfamily = pg_opfamily.oid
               LEFT JOIN pg_catalog.pg_amproc ON pg_opfamily.oid = pg_amproc.amprocfamily
                     AND pg_amproc.amproclefttype = pg_opclass.opcintype
                     AND pg_amproc.amprocrighttype = pg_opclass.opcintype
               LEFT JOIN pg_catalog.pg_proc ON pg_proc.oid = pg_amproc.amproc
               LEFT JOIN pg_catalog.pg_namespace pg_proc_namespace ON pg_proc_namespace.oid = pg_proc.pronamespace
                   WHERE pg_opclass.oid = '{{INTOID}}'),
          description::text
     FROM pg_opclass
LEFT JOIN pg_roles ON pg_roles.oid = pg_opclass.opcowner
LEFT JOIN pg_am ON pg_am.oid = pg_opclass.opcmethod
LEFT JOIN pg_catalog.pg_opfamily ON pg_opclass.opcfamily = pg_opfamily.oid
LEFT JOIN pg_description ON pg_description.objoid = pg_opclass.oid AND pg_description.objsubid = 0 
    WHERE pg_opclass.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_conversion = propQuery.objectConversion = ml(function () {/*
SELECT  'Name',
        'OID',
        'Owner',
        'Source Encoding',
        'Destination Encoding',
        'Conversion Procedure',
        'Default Conversion?'
UNION ALL
SELECT  conname::text,
        pg_conversion.oid::text,
        pg_roles.rolname::text,
        pg_encoding_to_char(conforencoding),
        pg_encoding_to_char(contoencoding),
        conproc::text,
        CASE WHEN condefault THEN 'Yes' ELSE 'No' END
    FROM pg_conversion
    LEFT JOIN pg_roles ON pg_roles.oid = pg_conversion.conowner
*/});

propQuery.prop_type = propQuery.objectType = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          --'Alias',
          'Alignment',
          'Length',
          'Default',
          'Passed By Value?',
          'Input Function',
          'Output Function',
          'Modifier Input Function',
          'Modifier Output Function',
          'Receive Function',
          'Send Function',
          'Analyze Function',
          'Category',
          'Not NULL?',
          'Prefered Cast Target?',
          'Defined?',
          'Storage',
          'Collation',
          'Delimiter',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_type.typname::text,
          pg_type.oid::text,
          pg_roles.rolname::text,
          pg_type.typacl::text,
          --alias_type.typname::text,
          (CASE WHEN pg_type.typalign = 'c' THEN 'Char Alignment (No Alignment Needed)'
                WHEN pg_type.typalign = 's' THEN 'Short Alignment (2 bytes on most machines)'
                WHEN pg_type.typalign = 'i' THEN 'Int Alignment (4 bytes on most machines)'
                WHEN pg_type.typalign = 'd' THEN 'Double Alignment (8 bytes on some machines)' END)::text,
          pg_type.typlen::text,
          pg_type.typdefault::text,
          (CASE WHEN pg_type.typbyval THEN 'Yes' ELSE 'No' END)::text,
          func_input.proname::text,
          func_output.proname::text,
          func_modin.proname::text,
          func_modout.proname::text,
          func_receive.proname::text,
          func_send.proname::text,
          func_analyze.proname::text,
          (CASE WHEN pg_type.typcategory = 'A' THEN 'Array Types'
                WHEN pg_type.typcategory = 'B' THEN 'Boolean Types'
                WHEN pg_type.typcategory = 'C' THEN 'Composite Types'
                WHEN pg_type.typcategory = 'D' THEN 'Date/time Types'
                WHEN pg_type.typcategory = 'E' THEN 'Enum Types'
                WHEN pg_type.typcategory = 'G' THEN 'Geometric Types'
                WHEN pg_type.typcategory = 'I' THEN 'Network address Types'
                WHEN pg_type.typcategory = 'N' THEN 'Numeric Types'
                WHEN pg_type.typcategory = 'P' THEN 'Pseudo-Types'
                WHEN pg_type.typcategory = 'R' THEN 'Range Types'
                WHEN pg_type.typcategory = 'S' THEN 'String Types'
                WHEN pg_type.typcategory = 'T' THEN 'Timespan Types'
                WHEN pg_type.typcategory = 'U' THEN 'User-Defined Types'
                WHEN pg_type.typcategory = 'V' THEN 'Bit-String Types'
                WHEN pg_type.typcategory = 'X' THEN 'Unknown Type' END)::text,
          (CASE WHEN pg_type.typnotnull THEN 'True' ELSE 'False' END)::text,
          (CASE WHEN pg_type.typispreferred THEN 'Yes' ELSE 'No' END)::text,
          (CASE WHEN pg_type.typisdefined THEN 'Yes' ELSE 'No (You can only rely on the Name and OID in this list)' END)::text,
          (CASE WHEN pg_type.typstorage = 'p' THEN 'Plain'
                WHEN pg_type.typstorage = 'e' THEN 'Secondary'
                WHEN pg_type.typstorage = 'm' THEN 'Compressed Inline'
                WHEN pg_type.typstorage = 'x' THEN 'Compressed Inline Or Secondary' END)::text,
          coll_type.collname,
          pg_type.typdelim::text,
          pg_description.description::text
     FROM pg_type
LEFT JOIN pg_roles ON pg_roles.oid = pg_type.typowner
LEFT JOIN pg_proc func_input ON func_input.oid = pg_type.typinput
LEFT JOIN pg_proc func_output ON func_output.oid = pg_type.typoutput
LEFT JOIN pg_proc func_modin ON func_modin.oid = pg_type.typmodin
LEFT JOIN pg_proc func_modout ON func_modout.oid = pg_type.typmodout
LEFT JOIN pg_proc func_receive ON func_receive.oid = pg_type.typreceive
LEFT JOIN pg_proc func_send ON func_send.oid = pg_type.typsend
LEFT JOIN pg_proc func_analyze ON func_analyze.oid = pg_type.typanalyze
LEFT JOIN pg_collation coll_type ON coll_type.oid = pg_type.typcollation
--LEFT JOIN pg_type alias_type ON alias_type.oid = pg_type.typarray <-- not correct
LEFT JOIN pg_description ON pg_description.objoid = pg_type.oid AND pg_description.objsubid = 0 
    WHERE pg_type.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_domain = propQuery.objectDomain = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Base Type',
          'Default',
          'Not NULL?',
          'Collation',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_type.typname::text,
          pg_type.oid::text,
          pg_roles.rolname::text,
          pg_type.typacl::text,
          (SELECT base_type.typname FROM pg_type base_type WHERE base_type.oid = pg_type.typbasetype),
          pg_type.typdefault::text,
          (CASE WHEN pg_type.typnotnull THEN 'True' ELSE 'False' END)::text,
          coll_type.collname,
          pg_description.description::text
     FROM pg_type
LEFT JOIN pg_roles ON pg_roles.oid = pg_type.typowner
LEFT JOIN pg_collation coll_type ON coll_type.oid = pg_type.typcollation
LEFT JOIN pg_description ON pg_description.objoid = pg_type.oid AND pg_description.objsubid = 0 
    WHERE pg_type.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_fdw_server = propQuery.objectForeignServer = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Foreign Data Wrapper',
          'Server Type',
          'Server Version',
          'Server Options',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_foreign_server.srvname::text,
          pg_foreign_server.oid::text,
          pg_roles.rolname::text,
          pg_foreign_server.srvacl::text,
          pg_foreign_data_wrapper.fdwname,
          pg_foreign_server.srvtype::text,
          pg_foreign_server.srvversion::text,
          (
               SELECT CASE WHEN srvoptions IS NOT NULL
                           THEN (SELECT string_agg((quote_ident(option_name) || ' ' || quote_literal(option_value)), ', ')
                                   FROM pg_options_to_table(srvoptions)) ELSE '' END
          )::text,
          description::text::text
     FROM pg_foreign_server
LEFT JOIN pg_roles ON pg_roles.oid = pg_foreign_server.srvowner
LEFT JOIN pg_foreign_data_wrapper ON pg_foreign_data_wrapper.oid = pg_foreign_server.srvfdw
LEFT JOIN pg_description ON pg_description.objoid = pg_foreign_server.oid AND pg_description.objsubid = 0
    WHERE pg_foreign_server.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

propQuery.prop_tablespace = propQuery.objectTablespace = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Location',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_tablespace.spcname::text,
          pg_tablespace.oid::text,
          pg_roles.rolname::text,
          pg_tablespace.spcacl::text,
          (CASE WHEN pg_tablespace_location(pg_tablespace.oid) = ''
                     AND spcname = 'pg_default' THEN (SELECT setting || '/base' FROM pg_settings WHERE name = 'data_directory')
                WHEN pg_tablespace_location(pg_tablespace.oid) = ''
                     AND spcname = 'pg_global'  THEN (SELECT setting || '/global' FROM pg_settings WHERE name = 'data_directory')
                ELSE pg_tablespace_location(pg_tablespace.oid) END)::text,
          description::text
     FROM pg_tablespace
LEFT JOIN pg_roles ON pg_roles.oid = pg_tablespace.spcowner
LEFT JOIN pg_description ON pg_description.objoid = pg_tablespace.oid AND pg_description.objsubid = 0 
    WHERE pg_tablespace.oid = '{{INTOID}}'
 ORDER BY sort;
*/});


propQuery.prop_fdw = propQuery.objectForeignDataWrapper = ml(function () {/*
   SELECT 1 AS sort,
          'Name',
          'OID',
          'Owner',
          'ACL',
          'Handler Function',
          'Validator Function',
          'Options',
          'Comment'
UNION ALL
   SELECT 2 AS sort,
          pg_foreign_data_wrapper.fdwname::text,
          pg_foreign_data_wrapper.oid::text,
          pg_roles.rolname::text,
          pg_foreign_data_wrapper.fdwacl::text,
          (CASE WHEN hndlr_proc.proname IS NOT NULL
                THEN (quote_ident(hndlr_nsp.nspname) || '.' || quote_ident(hndlr_proc.proname))
		     || '(' || COALESCE(pg_get_function_arguments(hndlr_proc.oid), '') || ')' ELSE '' END)::text,
          (CASE WHEN vlidtr_proc.proname IS NOT NULL
                THEN (quote_ident(vlidtr_nsp.nspname) || '.' || quote_ident(vlidtr_proc.proname))
		     || '(' || COALESCE(pg_get_function_arguments(vlidtr_proc.oid), '') || ')' ELSE '' END)::text,
          (
               SELECT CASE WHEN fdwoptions IS NOT NULL
                           THEN (SELECT string_agg((quote_ident(option_name) || ' ' || quote_literal(option_value)), ', ')
                                   FROM pg_options_to_table(fdwoptions)) ELSE '' END
          )::text,
          description::text::text
     FROM pg_foreign_data_wrapper
LEFT JOIN pg_roles ON pg_roles.oid = pg_foreign_data_wrapper.fdwowner
LEFT JOIN pg_proc hndlr_proc ON hndlr_proc.oid = pg_foreign_data_wrapper.fdwhandler
LEFT JOIN pg_namespace hndlr_nsp ON hndlr_nsp.oid = hndlr_proc.pronamespace
LEFT JOIN pg_proc vlidtr_proc ON vlidtr_proc.oid = pg_foreign_data_wrapper.fdwvalidator
LEFT JOIN pg_namespace vlidtr_nsp ON vlidtr_nsp.oid = vlidtr_proc.pronamespace
LEFT JOIN pg_description ON pg_description.objoid = pg_foreign_data_wrapper.oid AND pg_description.objsubid = 0 
    WHERE pg_foreign_data_wrapper.oid = '{{INTOID}}'
 ORDER BY sort;
*/});

infoQuery.preparedTransactions = ml(function () {/*
    SELECT gid, transaction, to_char(prepared, 'FMHH:MI:SSpm On FMMM/FMDD/FMYYYY'), owner, database
      FROM pg_prepared_xacts
  ORDER BY gid ASC;
*/});

infoQuery.locks = ml(function () {/*
    SELECT pg_locks.pid
         , pg_locks.transactionid
         , pg_locks.virtualxid
         , pg_locks.virtualtransaction
         , pg_locks.database
         , pg_locks.locktype
         , pg_locks.mode
         , pg_locks.classid
         , pg_locks.objid
         , pg_locks.objsubid
         , pg_locks.granted
         , pg_locks.fastpath
         , pg_stat_activity.usename AS username
         , to_char(pg_stat_activity.query_start, 'FMMM-FMDD-FMYYYY') AS start_date
         , to_char(pg_stat_activity.query_start, 'FMHH:MI:SSpm') AS start_time
         , pg_stat_activity.client_addr AS client_address
         , pg_stat_activity.client_port AS client_port
         , pg_stat_activity.query
      FROM pg_locks
 LEFT JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
  ORDER BY pid ASC;
*/});


infoQuery.dependencies = ml(function () {/*
SELECT DISTINCT *
  FROM (
           SELECT CASE WHEN pg_depend.objid = dpndnt_pg_type.oid          THEN 'TYPE'
                       WHEN pg_depend.objid = dpndnt_pg_roles.oid         THEN 'ROLE'
                       WHEN pg_depend.objid = dpndnt_pg_proc.oid          THEN 'FUNCTION'
                       WHEN pg_depend.objid = dpndnt_pg_class.oid         THEN 
        										(SELECT CASE WHEN relationtype.relkind = 'r' THEN 'TABLE'
        											    WHEN relationtype.relkind = 'i' THEN 'INDEX'
        											    WHEN relationtype.relkind = 'S' THEN 'SEQUENCE'
        											    WHEN relationtype.relkind = 'v' THEN 'VIEW'
        											    WHEN relationtype.relkind = 'c' THEN 'COMPOSITE TYPE'
        											    WHEN relationtype.relkind = 't' THEN 'TOAST TABLE'
        											    WHEN relationtype.relkind = 'f' THEN 'FOREIGN TABLE' END 
        										       FROM pg_class relationtype
        										      WHERE relationtype.oid = pg_depend.objid)
                       WHEN pg_depend.objid = dpndnt_pg_constraint.oid     THEN 'CONSTRAINT'
                       WHEN pg_depend.objid = dpndnt_pg_conversion.oid     THEN 'CONVERSION'
                       WHEN pg_depend.objid = dpndnt_pg_operator.oid       THEN 'OPERATOR'
                       WHEN pg_depend.objid = dpndnt_pg_opfamily.oid       THEN 'OPERATOR FAMILY'
                       WHEN pg_depend.objid = dpndnt_pg_opclass.oid        THEN 'OPERATOR CLASS'
                       WHEN pg_depend.objid = dpndnt_pg_am.oid             THEN 'ACCESS METHOD'
                       WHEN pg_depend.objid = dpndnt_pg_language.oid       THEN 'LANGUAGE'
                       WHEN pg_depend.objid = dpndnt_pg_rewrite.oid        THEN 'RULE'
                       WHEN pg_depend.objid = dpndnt_pg_trigger.oid        THEN 'TRIGGER'
                       WHEN pg_depend.objid = dpndnt_pg_namespace.oid      THEN 'SCHEMA'
                       WHEN pg_depend.objid = dpndnt_pg_ts_config.oid      THEN 'TEXT SEARCH CONFIG'
                       WHEN pg_depend.objid = dpndnt_pg_ts_dict.oid        THEN 'TEXT SEARCH DICTIONARY'
                       WHEN pg_depend.objid = dpndnt_pg_ts_parser.oid      THEN 'TEXT SEARCH PARSER'
                       WHEN pg_depend.objid = dpndnt_pg_ts_template.oid    THEN 'TEXT SEARCH TEMPLATE'
                       WHEN pg_depend.objid = dpndnt_pg_extension.oid      THEN 'EXTENSION'
                       WHEN pg_depend.objid = dpndnt_pg_fdw.oid            THEN 'FOREIGN DATA WRAPPER'
                       WHEN pg_depend.objid = dpndnt_pg_foreign_server.oid THEN 'FOREIGN SERVER'
                       WHEN pg_depend.objid = dpndnt_pg_collation.oid      THEN 'COLLATION'
                       WHEN pg_depend.objid = dpndnt_pg_cast.oid           THEN 'CAST'
                       ELSE 'unknown' END AS dependent_type,
                  CASE WHEN pg_depend.objid = dpndnt_pg_type.oid           THEN dpndnt_pg_type.typname
                       WHEN pg_depend.objid = dpndnt_pg_roles.oid          THEN dpndnt_pg_roles.rolname
                       WHEN pg_depend.objid = dpndnt_pg_proc.oid           THEN dpndnt_pg_proc.proname
                       WHEN pg_depend.objid = dpndnt_pg_class.oid          THEN dpndnt_pg_class.relname
                       WHEN pg_depend.objid = dpndnt_pg_constraint.oid     THEN dpndnt_pg_constraint.conname
                       WHEN pg_depend.objid = dpndnt_pg_conversion.oid     THEN dpndnt_pg_conversion.conname
                       WHEN pg_depend.objid = dpndnt_pg_operator.oid       THEN dpndnt_pg_operator.oprname
                       WHEN pg_depend.objid = dpndnt_pg_opfamily.oid       THEN dpndnt_pg_opfamily.opfname
                       WHEN pg_depend.objid = dpndnt_pg_opclass.oid        THEN dpndnt_pg_opclass.opcname
                       WHEN pg_depend.objid = dpndnt_pg_am.oid             THEN dpndnt_pg_am.amname
                       WHEN pg_depend.objid = dpndnt_pg_language.oid       THEN dpndnt_pg_language.lanname
                       WHEN pg_depend.objid = dpndnt_pg_rewrite.oid        THEN dpndnt_pg_rewrite.rulename || ' ON ' ||
                                                            (SELECT ruleonschema.nspname || '.' || ruleon.relname
                                                               FROM pg_class ruleon
                                                          LEFT JOIN pg_namespace ruleonschema ON ruleonschema.oid = ruleon.relnamespace
                                                              WHERE dpndnt_pg_rewrite.ev_class = ruleon.oid)::text
                       WHEN pg_depend.objid = dpndnt_pg_trigger.oid        THEN dpndnt_pg_trigger.tgname
                       WHEN pg_depend.objid = dpndnt_pg_namespace.oid      THEN dpndnt_pg_namespace.nspname
                       WHEN pg_depend.objid = dpndnt_pg_ts_config.oid      THEN dpndnt_pg_ts_config.cfgname
                       WHEN pg_depend.objid = dpndnt_pg_ts_dict.oid        THEN dpndnt_pg_ts_dict.dictname
                       WHEN pg_depend.objid = dpndnt_pg_ts_parser.oid      THEN dpndnt_pg_ts_parser.prsname
                       WHEN pg_depend.objid = dpndnt_pg_ts_template.oid    THEN dpndnt_pg_ts_template.tmplname
                       WHEN pg_depend.objid = dpndnt_pg_extension.oid      THEN dpndnt_pg_extension.extname
                       WHEN pg_depend.objid = dpndnt_pg_fdw.oid            THEN dpndnt_pg_fdw.fdwname
                       WHEN pg_depend.objid = dpndnt_pg_foreign_server.oid THEN dpndnt_pg_foreign_server.srvname
                       WHEN pg_depend.objid = dpndnt_pg_collation.oid      THEN dpndnt_pg_collation.collname
                       WHEN pg_depend.objid = dpndnt_pg_cast.oid           THEN dpndnt_pg_cast.oid::text
                       ELSE 'unknown' END AS dependent_name,
                  pg_depend.objid,
                  --'depends on',
                  CASE WHEN pg_depend.refobjid = dpnr_pg_type.oid                 THEN 'TYPE'
                       WHEN pg_depend.refobjid = dpnr_pg_roles.oid                THEN 'ROLE'
                       WHEN pg_depend.refobjid = dpnr_pg_proc.oid                 THEN 'FUNCTION'
                       WHEN pg_depend.refobjid = dpnr_pg_class.oid                THEN 
        										(SELECT CASE WHEN relationtype.relkind = 'r' THEN 'TABLE'
                                                             WHEN relationtype.relkind = 'i' THEN 'INDEX'
                                                             WHEN relationtype.relkind = 'S' THEN 'SEQUENCE'
                                                             WHEN relationtype.relkind = 'v' THEN 'VIEW'
                                                             WHEN relationtype.relkind = 'c' THEN 'COMPOSITE TYPE'
                                                             WHEN relationtype.relkind = 't' THEN 'TOAST TABLE'
                                                             WHEN relationtype.relkind = 'f' THEN 'FOREIGN TABLE' END 
                                                   FROM pg_class relationtype
                                                  WHERE relationtype.oid = pg_depend.refobjid)
                       WHEN pg_depend.refobjid = dpnr_pg_constraint.oid     THEN 'CONSTRAINT'
                       WHEN pg_depend.refobjid = dpnr_pg_conversion.oid     THEN 'CONVERSION'
                       WHEN pg_depend.refobjid = dpnr_pg_operator.oid       THEN 'OPERATOR'
                       WHEN pg_depend.refobjid = dpnr_pg_opfamily.oid       THEN 'OPERATOR FAMILY'
                       WHEN pg_depend.refobjid = dpnr_pg_opclass.oid        THEN 'OPERATOR CLASS'
                       WHEN pg_depend.refobjid = dpnr_pg_am.oid             THEN 'ACCESS METHOD'
                       WHEN pg_depend.refobjid = dpnr_pg_language.oid       THEN 'LANGUAGE'
                       WHEN pg_depend.refobjid = dpnr_pg_rewrite.oid        THEN 'RULE'
                       WHEN pg_depend.refobjid = dpnr_pg_trigger.oid        THEN 'TRIGGER'
                       WHEN pg_depend.refobjid = dpnr_pg_namespace.oid      THEN 'SCHEMA'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_config.oid      THEN 'TEXT SEARCH CONFIG'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_dict.oid        THEN 'TEXT SEARCH DICTIONARY'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_parser.oid      THEN 'TEXT SEARCH PARSER'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_template.oid    THEN 'TEXT SEARCH TEMPLATE'
                       WHEN pg_depend.refobjid = dpnr_pg_extension.oid      THEN 'EXTENSION'
                       WHEN pg_depend.refobjid = dpnr_pg_fdw.oid            THEN 'FOREIGN DATA WRAPPER'
                       WHEN pg_depend.refobjid = dpnr_pg_foreign_server.oid THEN 'FOREIGN SERVER'
                       WHEN pg_depend.refobjid = dpnr_pg_collation.oid      THEN 'COLLATION'
                       WHEN pg_depend.refobjid = dpnr_pg_cast.oid           THEN 'CAST'
                       ELSE 'unknown' END AS depender_type,
                  CASE WHEN pg_depend.refobjid = dpnr_pg_type.oid           THEN dpnr_pg_type.typname
                       WHEN pg_depend.refobjid = dpnr_pg_roles.oid          THEN dpnr_pg_roles.rolname
                       WHEN pg_depend.refobjid = dpnr_pg_proc.oid           THEN dpnr_pg_proc.proname
                       WHEN pg_depend.refobjid = dpnr_pg_class.oid          THEN dpnr_pg_class.relname
                       WHEN pg_depend.refobjid = dpnr_pg_constraint.oid     THEN dpnr_pg_constraint.conname
                       WHEN pg_depend.refobjid = dpnr_pg_conversion.oid     THEN dpnr_pg_conversion.conname
                       WHEN pg_depend.refobjid = dpnr_pg_operator.oid       THEN dpnr_pg_operator.oprname
                       WHEN pg_depend.refobjid = dpnr_pg_opfamily.oid       THEN dpnr_pg_opfamily.opfname
                       WHEN pg_depend.refobjid = dpnr_pg_opclass.oid        THEN dpnr_pg_opclass.opcname
                       WHEN pg_depend.refobjid = dpnr_pg_am.oid             THEN dpnr_pg_am.amname
                       WHEN pg_depend.refobjid = dpnr_pg_language.oid       THEN dpnr_pg_language.lanname
                       WHEN pg_depend.refobjid = dpnr_pg_rewrite.oid        THEN dpnr_pg_rewrite.rulename
                       WHEN pg_depend.refobjid = dpnr_pg_trigger.oid        THEN dpnr_pg_trigger.tgname
                       WHEN pg_depend.refobjid = dpnr_pg_namespace.oid      THEN dpnr_pg_namespace.nspname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_config.oid      THEN dpnr_pg_ts_config.cfgname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_dict.oid        THEN dpnr_pg_ts_dict.dictname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_parser.oid      THEN dpnr_pg_ts_parser.prsname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_template.oid    THEN dpnr_pg_ts_template.tmplname
                       WHEN pg_depend.refobjid = dpnr_pg_extension.oid      THEN dpnr_pg_extension.extname
                       WHEN pg_depend.refobjid = dpnr_pg_fdw.oid            THEN dpnr_pg_fdw.fdwname
                       WHEN pg_depend.refobjid = dpnr_pg_foreign_server.oid THEN dpnr_pg_foreign_server.srvname
                       WHEN pg_depend.refobjid = dpnr_pg_collation.oid      THEN dpnr_pg_collation.collname
                       WHEN pg_depend.refobjid = dpnr_pg_cast.oid           THEN dpnr_pg_cast.oid::text
                       ELSE 'unknown' END AS depender_name,
                  pg_depend.refobjid,
                  CASE WHEN deptype = 'p' THEN 'Pinned'
                       WHEN deptype = 'i' THEN 'Internal'
                       WHEN deptype = 'a' THEN 'Automatic'
                       WHEN deptype = 'n' THEN 'Normal'
                       WHEN deptype = 'o_sh' THEN 'Owner'
                       WHEN deptype = 'a_sh' THEN 'ACL'
                       WHEN deptype = 'p_sh' THEN 'Pinned' END AS dependency_type,
                  (pg_depend.objid || ' ' || pg_depend.objsubid || ' ' || pg_depend.refobjid || ' ' || pg_depend.refobjsubid)
             FROM (
                    SELECT objid, objsubid, refobjid, refobjsubid, deptype
                      FROM pg_depend
                  UNION ALL
                    SELECT objid, objsubid, refobjid, 0, deptype || '_sh'
                      FROM pg_shdepend
                     WHERE dbid = (SELECT oid FROM pg_database
                                    WHERE datname = CURRENT_DATABASE())
                  ) pg_depend
        -- dependent
        LEFT JOIN pg_roles dpndnt_pg_roles ON dpndnt_pg_roles.oid = pg_depend.objid::oid
        LEFT JOIN pg_type dpndnt_pg_type ON dpndnt_pg_type.oid = pg_depend.objid::oid
        LEFT JOIN pg_proc dpndnt_pg_proc ON dpndnt_pg_proc.oid = pg_depend.objid::oid
        LEFT JOIN pg_class dpndnt_pg_class ON dpndnt_pg_class.oid = pg_depend.objid::oid
        LEFT JOIN pg_attribute dpndnt_pg_attribute ON dpndnt_pg_attribute.attrelid = pg_depend.objid::oid
                                                  AND dpndnt_pg_attribute.attnum = pg_depend.objsubid
        LEFT JOIN pg_attrdef dpndnt_pg_attrdef ON dpndnt_pg_attrdef.oid = pg_depend.objid
        LEFT JOIN pg_constraint dpndnt_pg_constraint ON dpndnt_pg_constraint.oid = pg_depend.objid::oid
        LEFT JOIN pg_conversion dpndnt_pg_conversion ON dpndnt_pg_conversion.oid = pg_depend.objid::oid
        LEFT JOIN pg_operator dpndnt_pg_operator ON dpndnt_pg_operator.oid = pg_depend.objid::oid
        LEFT JOIN pg_opfamily dpndnt_pg_opfamily ON dpndnt_pg_opfamily.oid = pg_depend.objid::oid
        LEFT JOIN pg_opclass dpndnt_pg_opclass ON dpndnt_pg_opclass.oid = pg_depend.objid::oid
        LEFT JOIN pg_am dpndnt_pg_am ON dpndnt_pg_am.oid = pg_depend.objid::oid
        LEFT JOIN pg_language dpndnt_pg_language ON dpndnt_pg_language.oid = pg_depend.objid::oid
        LEFT JOIN pg_rewrite dpndnt_pg_rewrite ON dpndnt_pg_rewrite.oid = pg_depend.objid::oid
        LEFT JOIN pg_trigger dpndnt_pg_trigger ON dpndnt_pg_trigger.oid = pg_depend.objid::oid
        LEFT JOIN pg_namespace dpndnt_pg_namespace ON dpndnt_pg_namespace.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_config dpndnt_pg_ts_config ON dpndnt_pg_ts_config.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_dict dpndnt_pg_ts_dict ON dpndnt_pg_ts_dict.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_parser dpndnt_pg_ts_parser ON dpndnt_pg_ts_parser.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_template dpndnt_pg_ts_template ON dpndnt_pg_ts_template.oid = pg_depend.objid::oid
        LEFT JOIN pg_extension dpndnt_pg_extension ON dpndnt_pg_extension.oid = pg_depend.objid::oid
        LEFT JOIN pg_foreign_data_wrapper dpndnt_pg_fdw ON dpndnt_pg_fdw.oid = pg_depend.objid::oid
        LEFT JOIN pg_foreign_server dpndnt_pg_foreign_server ON dpndnt_pg_foreign_server.oid = pg_depend.objid::oid
        LEFT JOIN pg_collation dpndnt_pg_collation ON dpndnt_pg_collation.oid = pg_depend.objid::oid
        LEFT JOIN pg_cast dpndnt_pg_cast ON dpndnt_pg_cast.oid = pg_depend.objid::oid
        -- depender
        LEFT JOIN pg_roles dpnr_pg_roles ON dpnr_pg_roles.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_type dpnr_pg_type ON dpnr_pg_type.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_proc dpnr_pg_proc ON dpnr_pg_proc.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_class dpnr_pg_class ON dpnr_pg_class.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_attribute dpnr_pg_attribute ON dpnr_pg_attribute.attrelid = pg_depend.refobjid::oid
                                                AND dpnr_pg_attribute.attnum = pg_depend.refobjsubid
        LEFT JOIN pg_attrdef dpnr_pg_attrdef ON dpnr_pg_attrdef.oid = pg_depend.refobjid
        LEFT JOIN pg_constraint dpnr_pg_constraint ON dpnr_pg_constraint.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_conversion dpnr_pg_conversion ON dpnr_pg_conversion.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_operator dpnr_pg_operator ON dpnr_pg_operator.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_opfamily dpnr_pg_opfamily ON dpnr_pg_opfamily.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_opclass dpnr_pg_opclass ON dpnr_pg_opclass.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_am dpnr_pg_am ON dpnr_pg_am.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_language dpnr_pg_language ON dpnr_pg_language.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_rewrite dpnr_pg_rewrite ON dpnr_pg_rewrite.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_trigger dpnr_pg_trigger ON dpnr_pg_trigger.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_namespace dpnr_pg_namespace ON dpnr_pg_namespace.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_config dpnr_pg_ts_config ON dpnr_pg_ts_config.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_dict dpnr_pg_ts_dict ON dpnr_pg_ts_dict.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_parser dpnr_pg_ts_parser ON dpnr_pg_ts_parser.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_template dpnr_pg_ts_template ON dpnr_pg_ts_template.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_extension dpnr_pg_extension ON dpnr_pg_extension.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_foreign_data_wrapper dpnr_pg_fdw ON dpnr_pg_fdw.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_foreign_server dpnr_pg_foreign_server ON dpnr_pg_foreign_server.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_collation dpnr_pg_collation ON dpnr_pg_collation.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_cast dpnr_pg_cast ON dpnr_pg_cast.oid = pg_depend.refobjid::oid
            WHERE pg_depend.objid != 0
              AND pg_depend.refobjid != 0
              AND pg_depend.deptype != 'i'
              AND pg_depend.objsubid = (SELECT min(objsubid) -- minimum objsubid for this relationship
                                          FROM (
                                                    SELECT objid, objsubid, refobjid FROM pg_depend
                                                UNION ALL
                                                    SELECT objid, objsubid, refobjid FROM pg_shdepend
                                                     WHERE dbid = (SELECT oid FROM pg_database WHERE datname = CURRENT_DATABASE())
                                                ) test
                                          WHERE test.refobjid = pg_depend.refobjid AND test.objid = pg_depend.objid
                                       GROUP BY objid, refobjid)
              AND pg_depend.refobjsubid = (SELECT min(refobjsubid) -- minimum refobjsubid for this relationship
                                             FROM (
                                                        SELECT objid, refobjsubid, refobjid FROM pg_depend
                                                    UNION ALL
                                                        SELECT objid, 0, refobjid FROM pg_shdepend
                                                         WHERE dbid = (SELECT oid FROM pg_database WHERE datname = CURRENT_DATABASE())
                                                    ) test
                                            WHERE test.refobjid = pg_depend.refobjid AND test.objid = pg_depend.objid
                                         GROUP BY objid, refobjid)
              AND pg_depend.objid = '{{INTOID}}'
              AND pg_depend.refobjid != '{{INTOID}}'
    ) dep
 ORDER BY dep.dependent_type ASC, dep.dependent_name ASC, dep.depender_type ASC, dep.depender_name ASC;
*/});


infoQuery.dependents = ml(function () {/*
SELECT *
  FROM (
         -- ################################################################
         -- ############### DEPENDENCY DATA -> HUMAN READABLE ##############
         -- ################################################################
           SELECT CASE WHEN pg_depend.objid = dpndnt_pg_type.oid                 THEN 'TYPE'
                       WHEN pg_depend.objid = dpndnt_pg_roles.oid                THEN 'ROLE'
                       WHEN pg_depend.objid = dpndnt_pg_proc.oid OR dpndnt_pg_attrdef.adsrc IS NOT NULL THEN 'FUNCTION'
                       WHEN pg_depend.objid = dpndnt_pg_class.oid                THEN 
        										(SELECT CASE WHEN relationtype.relkind = 'r' THEN 'TABLE'
        											    WHEN relationtype.relkind = 'i' THEN 'INDEX'
        											    WHEN relationtype.relkind = 'S' THEN 'SEQUENCE'
        											    WHEN relationtype.relkind = 'v' THEN 'VIEW'
        											    WHEN relationtype.relkind = 'c' THEN 'COMPOSITE TYPE'
        											    WHEN relationtype.relkind = 't' THEN 'TOAST TABLE'
        											    WHEN relationtype.relkind = 'f' THEN 'FOREIGN TABLE' END 
        										       FROM pg_class relationtype
        										      WHERE relationtype.oid = pg_depend.objid)
                       WHEN pg_depend.objid = dpndnt_pg_constraint.oid     THEN 'CONSTRAINT'
                       WHEN pg_depend.objid = dpndnt_pg_conversion.oid     THEN 'CONVERSION'
                       WHEN pg_depend.objid = dpndnt_pg_operator.oid       THEN 'OPERATOR'
                       WHEN pg_depend.objid = dpndnt_pg_opfamily.oid       THEN 'OPERATOR FAMILY'
                       WHEN pg_depend.objid = dpndnt_pg_opclass.oid        THEN 'OPERATOR CLASS'
                       WHEN pg_depend.objid = dpndnt_pg_am.oid             THEN 'ACCESS METHOD'
                       WHEN pg_depend.objid = dpndnt_pg_language.oid       THEN 'LANGUAGE'
                       WHEN pg_depend.objid = dpndnt_pg_rewrite.oid        THEN 'RULE'
                       WHEN pg_depend.objid = dpndnt_pg_trigger.oid        THEN 'TRIGGER'
                       WHEN pg_depend.objid = dpndnt_pg_namespace.oid      THEN 'SCHEMA'
                       WHEN pg_depend.objid = dpndnt_pg_ts_config.oid      THEN 'TEXT SEARCH CONFIG'
                       WHEN pg_depend.objid = dpndnt_pg_ts_dict.oid        THEN 'TEXT SEARCH DICTIONARY'
                       WHEN pg_depend.objid = dpndnt_pg_ts_parser.oid      THEN 'TEXT SEARCH PARSER'
                       WHEN pg_depend.objid = dpndnt_pg_ts_template.oid    THEN 'TEXT SEARCH TEMPLATE'
                       WHEN pg_depend.objid = dpndnt_pg_extension.oid      THEN 'EXTENSION'
                       WHEN pg_depend.objid = dpndnt_pg_fdw.oid            THEN 'FOREIGN DATA WRAPPER'
                       WHEN pg_depend.objid = dpndnt_pg_foreign_server.oid THEN 'FOREIGN SERVER'
                       WHEN pg_depend.objid = dpndnt_pg_collation.oid      THEN 'COLLATION'
                       WHEN pg_depend.objid = dpndnt_pg_cast.oid           THEN 'CAST'
                       ELSE 'unknown' END AS dependent_type,
                  CASE WHEN pg_depend.objid = dpndnt_pg_type.oid           THEN dpndnt_pg_type.typname
                       WHEN pg_depend.objid = dpndnt_pg_roles.oid          THEN dpndnt_pg_roles.rolname
                       WHEN pg_depend.objid = dpndnt_pg_proc.oid           THEN dpndnt_pg_proc.proname
                       WHEN dpndnt_pg_attrdef.adsrc IS NOT NULL            THEN dpndnt_pg_attrdef.adsrc
                       WHEN pg_depend.objid = dpndnt_pg_class.oid          THEN dpndnt_pg_class.relname
                       WHEN pg_depend.objid = dpndnt_pg_constraint.oid     THEN dpndnt_pg_constraint.conname
                       WHEN pg_depend.objid = dpndnt_pg_conversion.oid     THEN dpndnt_pg_conversion.conname
                       WHEN pg_depend.objid = dpndnt_pg_operator.oid       THEN dpndnt_pg_operator.oprname
                       WHEN pg_depend.objid = dpndnt_pg_opfamily.oid       THEN dpndnt_pg_opfamily.opfname
                       WHEN pg_depend.objid = dpndnt_pg_opclass.oid        THEN dpndnt_pg_opclass.opcname
                       WHEN pg_depend.objid = dpndnt_pg_am.oid             THEN dpndnt_pg_am.amname
                       WHEN pg_depend.objid = dpndnt_pg_language.oid       THEN dpndnt_pg_language.lanname
                       WHEN pg_depend.objid = dpndnt_pg_rewrite.oid        THEN dpndnt_pg_rewrite.rulename || ' ON ' ||
                                                            (SELECT ruleonschema.nspname || '.' || ruleon.relname
                                                               FROM pg_class ruleon
                                                          LEFT JOIN pg_namespace ruleonschema ON ruleonschema.oid = ruleon.relnamespace
                                                              WHERE dpndnt_pg_rewrite.ev_class = ruleon.oid)::text
                       WHEN pg_depend.objid = dpndnt_pg_trigger.oid        THEN dpndnt_pg_trigger.tgname
                       WHEN pg_depend.objid = dpndnt_pg_namespace.oid      THEN dpndnt_pg_namespace.nspname
                       WHEN pg_depend.objid = dpndnt_pg_ts_config.oid      THEN dpndnt_pg_ts_config.cfgname
                       WHEN pg_depend.objid = dpndnt_pg_ts_dict.oid        THEN dpndnt_pg_ts_dict.dictname
                       WHEN pg_depend.objid = dpndnt_pg_ts_parser.oid      THEN dpndnt_pg_ts_parser.prsname
                       WHEN pg_depend.objid = dpndnt_pg_ts_template.oid    THEN dpndnt_pg_ts_template.tmplname
                       WHEN pg_depend.objid = dpndnt_pg_extension.oid      THEN dpndnt_pg_extension.extname
                       WHEN pg_depend.objid = dpndnt_pg_fdw.oid            THEN dpndnt_pg_fdw.fdwname
                       WHEN pg_depend.objid = dpndnt_pg_foreign_server.oid THEN dpndnt_pg_foreign_server.srvname
                       WHEN pg_depend.objid = dpndnt_pg_collation.oid      THEN dpndnt_pg_collation.collname
                       WHEN pg_depend.objid = dpndnt_pg_cast.oid           THEN dpndnt_pg_cast.oid::text
                       ELSE 'unknown' END AS dependent_name,
                  pg_depend.objid,
                  --'depends on',
                  CASE WHEN pg_depend.refobjid = dpnr_pg_type.oid                 THEN 'TYPE'
                       WHEN pg_depend.refobjid = dpnr_pg_roles.oid                THEN 'ROLE'
                       WHEN pg_depend.refobjid = dpnr_pg_proc.oid OR dpnr_pg_attrdef.adsrc IS NOT NULL THEN 'FUNCTION'
                       WHEN pg_depend.refobjid = dpnr_pg_class.oid                THEN 
        										(SELECT CASE WHEN relationtype.relkind = 'r' THEN 'TABLE'
        											    WHEN relationtype.relkind = 'i' THEN 'INDEX'
        											    WHEN relationtype.relkind = 'S' THEN 'SEQUENCE'
        											    WHEN relationtype.relkind = 'v' THEN 'VIEW'
        											    WHEN relationtype.relkind = 'c' THEN 'COMPOSITE TYPE'
        											    WHEN relationtype.relkind = 't' THEN 'TOAST TABLE'
        											    WHEN relationtype.relkind = 'f' THEN 'FOREIGN TABLE' END 
        										       FROM pg_class relationtype
        										      WHERE relationtype.oid = pg_depend.refobjid)
                       WHEN pg_depend.refobjid = dpnr_pg_constraint.oid     THEN 'CONSTRAINT'
                       WHEN pg_depend.refobjid = dpnr_pg_conversion.oid     THEN 'CONVERSION'
                       WHEN pg_depend.refobjid = dpnr_pg_operator.oid       THEN 'OPERATOR'
                       WHEN pg_depend.refobjid = dpnr_pg_opfamily.oid       THEN 'OPERATOR FAMILY'
                       WHEN pg_depend.refobjid = dpnr_pg_opclass.oid        THEN 'OPERATOR CLASS'
                       WHEN pg_depend.refobjid = dpnr_pg_am.oid             THEN 'ACCESS METHOD'
                       WHEN pg_depend.refobjid = dpnr_pg_language.oid       THEN 'LANGUAGE'
                       WHEN pg_depend.refobjid = dpnr_pg_rewrite.oid        THEN 'RULE'
                       WHEN pg_depend.refobjid = dpnr_pg_trigger.oid        THEN 'TRIGGER'
                       WHEN pg_depend.refobjid = dpnr_pg_namespace.oid      THEN 'SCHEMA'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_config.oid      THEN 'TEXT SEARCH CONFIG'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_dict.oid        THEN 'TEXT SEARCH DICTIONARY'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_parser.oid      THEN 'TEXT SEARCH PARSER'
                       WHEN pg_depend.refobjid = dpnr_pg_ts_template.oid    THEN 'TEXT SEARCH TEMPLATE'
                       WHEN pg_depend.refobjid = dpnr_pg_extension.oid      THEN 'EXTENSION'
                       WHEN pg_depend.refobjid = dpnr_pg_fdw.oid            THEN 'FOREIGN DATA WRAPPER'
                       WHEN pg_depend.refobjid = dpnr_pg_foreign_server.oid THEN 'FOREIGN SERVER'
                       WHEN pg_depend.refobjid = dpnr_pg_collation.oid      THEN 'COLLATION'
                       WHEN pg_depend.refobjid = dpnr_pg_cast.oid           THEN 'CAST'
                       ELSE 'unknown' END AS depender_type,
                  CASE WHEN pg_depend.refobjid = dpnr_pg_type.oid           THEN dpnr_pg_type.typname
                       WHEN pg_depend.refobjid = dpnr_pg_roles.oid          THEN dpnr_pg_roles.rolname
                       WHEN pg_depend.refobjid = dpnr_pg_proc.oid           THEN dpnr_pg_proc.proname
                       WHEN dpnr_pg_attrdef.adsrc IS NOT NULL               THEN dpnr_pg_attrdef.adsrc
                       WHEN pg_depend.refobjid = dpnr_pg_class.oid          THEN dpnr_pg_class.relname
                       WHEN pg_depend.refobjid = dpnr_pg_constraint.oid     THEN dpnr_pg_constraint.conname
                       WHEN pg_depend.refobjid = dpnr_pg_conversion.oid     THEN dpnr_pg_conversion.conname
                       WHEN pg_depend.refobjid = dpnr_pg_operator.oid       THEN dpnr_pg_operator.oprname
                       WHEN pg_depend.refobjid = dpnr_pg_opfamily.oid       THEN dpnr_pg_opfamily.opfname
                       WHEN pg_depend.refobjid = dpnr_pg_opclass.oid        THEN dpnr_pg_opclass.opcname
                       WHEN pg_depend.refobjid = dpnr_pg_am.oid             THEN dpnr_pg_am.amname
                       WHEN pg_depend.refobjid = dpnr_pg_language.oid       THEN dpnr_pg_language.lanname
                       WHEN pg_depend.refobjid = dpnr_pg_rewrite.oid        THEN dpnr_pg_rewrite.rulename
                       WHEN pg_depend.refobjid = dpnr_pg_trigger.oid        THEN dpnr_pg_trigger.tgname
                       WHEN pg_depend.refobjid = dpnr_pg_namespace.oid      THEN dpnr_pg_namespace.nspname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_config.oid      THEN dpnr_pg_ts_config.cfgname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_dict.oid        THEN dpnr_pg_ts_dict.dictname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_parser.oid      THEN dpnr_pg_ts_parser.prsname
                       WHEN pg_depend.refobjid = dpnr_pg_ts_template.oid    THEN dpnr_pg_ts_template.tmplname
                       WHEN pg_depend.refobjid = dpnr_pg_extension.oid      THEN dpnr_pg_extension.extname
                       WHEN pg_depend.refobjid = dpnr_pg_fdw.oid            THEN dpnr_pg_fdw.fdwname
                       WHEN pg_depend.refobjid = dpnr_pg_foreign_server.oid THEN dpnr_pg_foreign_server.srvname
                       WHEN pg_depend.refobjid = dpnr_pg_collation.oid      THEN dpnr_pg_collation.collname
                       WHEN pg_depend.refobjid = dpnr_pg_cast.oid           THEN dpnr_pg_cast.oid::text
                       ELSE 'unknown' END AS depender_name,
                  pg_depend.refobjid,
                  CASE WHEN deptype = 'p' THEN 'Pinned'
                       WHEN deptype = 'i' THEN 'Internal'
                       WHEN deptype = 'a' THEN 'Automatic'
                       WHEN deptype = 'n' THEN 'Normal'
                       WHEN deptype = 'o_sh' THEN 'Owner'
                       WHEN deptype = 'a_sh' THEN 'ACL'
                       WHEN deptype = 'p_sh' THEN 'Pinned' END AS dependency_type,
                  (pg_depend.objid || ' ' || pg_depend.objsubid || ' ' || pg_depend.refobjid || ' ' || pg_depend.refobjsubid)
             -- ################################################################
             -- ############### DEPENDENCY DATA ABSTRACTION QUERY ##############
             -- ################################################################
             FROM (
                    -- #################################################################################
                    -- ####### relationships between database objects and other database objects #######
                    -- #################################################################################
                    SELECT objid, classid, objsubid, refobjid, refobjsubid, deptype
                      FROM pg_depend
                     WHERE pg_depend.objid != '{{INTOID}}'
                       AND pg_depend.refobjid = '{{INTOID}}'
                       AND pg_depend.objid != 0
                       AND pg_depend.refobjid != 0
                       AND pg_depend.deptype != 'i'
                           -- minimum objsubid for this relationship
                       AND pg_depend.objsubid = (SELECT min(objsubid)
                                                   FROM (SELECT objid, objsubid, refobjid FROM pg_depend) test
                                                  WHERE test.refobjid = pg_depend.refobjid AND test.objid = pg_depend.objid
                                               GROUP BY objid, refobjid)
                           -- minimum refobjsubid for this relationship
                       AND pg_depend.refobjsubid = (SELECT min(refobjsubid)
                                                      FROM (SELECT objid, refobjsubid, refobjid FROM pg_depend) test
                                                     WHERE test.refobjid = pg_depend.refobjid AND test.objid = pg_depend.objid
                                                  GROUP BY objid, refobjid)
        UNION ALL
                    -- #################################################################################
                    -- ########### relationships between database objects and shared objects ###########
                    -- #################################################################################
                    SELECT objid, classid, objsubid, refobjid, 0, deptype || '_sh'
                      FROM pg_shdepend
                     WHERE dbid = (SELECT oid FROM pg_database
                                    WHERE datname = CURRENT_DATABASE())
                       AND pg_shdepend.objid != '{{INTOID}}'
                       AND pg_shdepend.refobjid = '{{INTOID}}'
                       AND pg_shdepend.objid != 0
                       AND pg_shdepend.refobjid != 0
                       AND pg_shdepend.deptype != 'i'
                           -- minimum objsubid for this relationship
                       AND pg_shdepend.objsubid = (SELECT min(objsubid)
                                                     FROM (
                                                              SELECT objid, objsubid, refobjid FROM pg_shdepend
                                                               WHERE dbid = (SELECT oid FROM pg_database WHERE datname = CURRENT_DATABASE())
                                                          ) test
                                                    WHERE test.refobjid = pg_shdepend.refobjid AND test.objid = pg_shdepend.objid
                                                 GROUP BY objid, refobjid)
        UNION ALL
                    -- ##################################################################################
                    -- ############### relationships between tablespaces pg_class objects ###############
                    -- ##################################################################################
                    SELECT objid, 'pg_class'::regclass::oid, objsubid, refobjid, refobjsubid, deptype
                      FROM (SELECT oid AS objid, 0 AS objsubid,
                                   -- if tablespace is 0: replace with default tablespace
                                   -- else: use the provided tablespace
                                   (
                                        CASE WHEN reltablespace = 0 THEN 
                                            COALESCE(
                                                (SELECT NULLIF(setting, '') FROM pg_settings WHERE name = 'default_tablespace')::text,
                                                (SELECT dattablespace FROM pg_database WHERE datname = CURRENT_DATABASE())::text
                                            )
                                        ELSE
                                            reltablespace::text
                                        END
                                   )::oid AS refobjid,
                                   0 AS refobjsubid, 'n' AS deptype
                              FROM pg_class) pg_tablespace_depend
                     WHERE pg_tablespace_depend.objid != '{{INTOID}}'
                       AND pg_tablespace_depend.refobjid = '{{INTOID}}'
                  ) pg_depend
        
        -- ##########################################################################
        -- ################ DEPENDENT OBJECT JOINS (FOR READABILITY) ################
        -- ##########################################################################
        LEFT JOIN pg_roles dpndnt_pg_roles                    ON classid = 'pg_roles'::regclass::oid                AND dpndnt_pg_roles.oid = pg_depend.objid::oid
        LEFT JOIN pg_type dpndnt_pg_type                      ON classid = 'pg_type'::regclass::oid                 AND dpndnt_pg_type.oid = pg_depend.objid::oid
        LEFT JOIN pg_proc dpndnt_pg_proc                      ON classid = 'pg_proc'::regclass::oid                 AND dpndnt_pg_proc.oid = pg_depend.objid::oid
        LEFT JOIN pg_class dpndnt_pg_class                    ON classid = 'pg_class'::regclass::oid                AND dpndnt_pg_class.oid = pg_depend.objid::oid
        LEFT JOIN pg_attribute dpndnt_pg_attribute            ON classid = 'pg_attribute'::regclass::oid
                                                             AND dpndnt_pg_attribute.attrelid = pg_depend.objid::oid
                                                             AND dpndnt_pg_attribute.attnum = pg_depend.objsubid
        LEFT JOIN pg_attrdef dpndnt_pg_attrdef                ON classid = 'pg_attrdef'::regclass::oid              AND dpndnt_pg_attrdef.oid = pg_depend.objid
        LEFT JOIN pg_constraint dpndnt_pg_constraint          ON classid = 'pg_constraint'::regclass::oid           AND dpndnt_pg_constraint.oid = pg_depend.objid::oid
        LEFT JOIN pg_conversion dpndnt_pg_conversion          ON classid = 'pg_conversion'::regclass::oid           AND dpndnt_pg_conversion.oid = pg_depend.objid::oid
        LEFT JOIN pg_operator dpndnt_pg_operator              ON classid = 'pg_operator'::regclass::oid             AND dpndnt_pg_operator.oid = pg_depend.objid::oid
        LEFT JOIN pg_opfamily dpndnt_pg_opfamily              ON classid = 'pg_opfamily'::regclass::oid             AND dpndnt_pg_opfamily.oid = pg_depend.objid::oid
        LEFT JOIN pg_opclass dpndnt_pg_opclass                ON classid = 'pg_opclass'::regclass::oid              AND dpndnt_pg_opclass.oid = pg_depend.objid::oid
        LEFT JOIN pg_am dpndnt_pg_am                          ON classid = 'pg_am'::regclass::oid                   AND dpndnt_pg_am.oid = pg_depend.objid::oid
        LEFT JOIN pg_language dpndnt_pg_language              ON classid = 'pg_language'::regclass::oid             AND dpndnt_pg_language.oid = pg_depend.objid::oid
        LEFT JOIN pg_rewrite dpndnt_pg_rewrite                ON classid = 'pg_rewrite'::regclass::oid              AND dpndnt_pg_rewrite.oid = pg_depend.objid::oid
        LEFT JOIN pg_trigger dpndnt_pg_trigger                ON classid = 'pg_trigger'::regclass::oid              AND dpndnt_pg_trigger.oid = pg_depend.objid::oid
        LEFT JOIN pg_namespace dpndnt_pg_namespace            ON classid = 'pg_namespace'::regclass::oid            AND dpndnt_pg_namespace.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_config dpndnt_pg_ts_config            ON classid = 'pg_ts_config'::regclass::oid            AND dpndnt_pg_ts_config.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_dict dpndnt_pg_ts_dict                ON classid = 'pg_ts_dict'::regclass::oid              AND dpndnt_pg_ts_dict.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_parser dpndnt_pg_ts_parser            ON classid = 'pg_ts_parser'::regclass::oid            AND dpndnt_pg_ts_parser.oid = pg_depend.objid::oid
        LEFT JOIN pg_ts_template dpndnt_pg_ts_template        ON classid = 'pg_ts_template'::regclass::oid          AND dpndnt_pg_ts_template.oid = pg_depend.objid::oid
        LEFT JOIN pg_extension dpndnt_pg_extension            ON classid = 'pg_extension'::regclass::oid            AND dpndnt_pg_extension.oid = pg_depend.objid::oid
        LEFT JOIN pg_foreign_data_wrapper dpndnt_pg_fdw       ON classid = 'pg_foreign_data_wrapper'::regclass::oid AND dpndnt_pg_fdw.oid = pg_depend.objid::oid
        LEFT JOIN pg_foreign_server dpndnt_pg_foreign_server  ON classid = 'pg_foreign_server'::regclass::oid       AND dpndnt_pg_foreign_server.oid = pg_depend.objid::oid
        LEFT JOIN pg_collation dpndnt_pg_collation            ON classid = 'pg_collation'::regclass::oid            AND dpndnt_pg_collation.oid = pg_depend.objid::oid
        LEFT JOIN pg_cast dpndnt_pg_cast                      ON classid = 'pg_cast'::regclass::oid                 AND dpndnt_pg_cast.oid = pg_depend.objid::oid
        
        -- ###########################################################################
        -- ################# DEPENDER OBJECT JOINS (FOR READABILITY) #################
        -- ###########################################################################
        LEFT JOIN pg_roles dpnr_pg_roles                      ON classid = 'pg_roles'::regclass::oid                AND dpnr_pg_roles.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_type dpnr_pg_type                        ON classid = 'pg_type'::regclass::oid                 AND dpnr_pg_type.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_proc dpnr_pg_proc                        ON classid = 'pg_proc'::regclass::oid                 AND dpnr_pg_proc.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_class dpnr_pg_class                      ON classid = 'pg_class'::regclass::oid                AND dpnr_pg_class.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_attribute dpnr_pg_attribute              ON classid = 'pg_attribute'::regclass::oid
                                                             AND dpnr_pg_attribute.attrelid = pg_depend.refobjid::oid
                                                             AND dpnr_pg_attribute.attnum = pg_depend.refobjsubid
        LEFT JOIN pg_attrdef dpnr_pg_attrdef                  ON classid = 'pg_attrdef'::regclass::oid              AND dpnr_pg_attrdef.oid = pg_depend.refobjid
        LEFT JOIN pg_constraint dpnr_pg_constraint            ON classid = 'pg_constraint'::regclass::oid           AND dpnr_pg_constraint.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_conversion dpnr_pg_conversion            ON classid = 'pg_conversion'::regclass::oid           AND dpnr_pg_conversion.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_operator dpnr_pg_operator                ON classid = 'pg_operator'::regclass::oid             AND dpnr_pg_operator.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_opfamily dpnr_pg_opfamily                ON classid = 'pg_opfamily'::regclass::oid             AND dpnr_pg_opfamily.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_opclass dpnr_pg_opclass                  ON classid = 'pg_opclass'::regclass::oid              AND dpnr_pg_opclass.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_am dpnr_pg_am                            ON classid = 'pg_am'::regclass::oid                   AND dpnr_pg_am.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_language dpnr_pg_language                ON classid = 'pg_language'::regclass::oid             AND dpnr_pg_language.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_rewrite dpnr_pg_rewrite                  ON classid = 'pg_rewrite'::regclass::oid              AND dpnr_pg_rewrite.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_trigger dpnr_pg_trigger                  ON classid = 'pg_trigger'::regclass::oid              AND dpnr_pg_trigger.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_namespace dpnr_pg_namespace              ON classid = 'pg_namespace'::regclass::oid            AND dpnr_pg_namespace.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_config dpnr_pg_ts_config              ON classid = 'pg_ts_config'::regclass::oid            AND dpnr_pg_ts_config.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_dict dpnr_pg_ts_dict                  ON classid = 'pg_ts_dict'::regclass::oid              AND dpnr_pg_ts_dict.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_parser dpnr_pg_ts_parser              ON classid = 'pg_ts_parser'::regclass::oid            AND dpnr_pg_ts_parser.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_ts_template dpnr_pg_ts_template          ON classid = 'pg_ts_template'::regclass::oid          AND dpnr_pg_ts_template.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_extension dpnr_pg_extension              ON classid = 'pg_extension'::regclass::oid            AND dpnr_pg_extension.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_foreign_data_wrapper dpnr_pg_fdw         ON classid = 'pg_foreign_data_wrapper'::regclass::oid AND dpnr_pg_fdw.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_foreign_server dpnr_pg_foreign_server    ON classid = 'pg_foreign_server'::regclass::oid       AND dpnr_pg_foreign_server.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_collation dpnr_pg_collation              ON classid = 'pg_collation'::regclass::oid            AND dpnr_pg_collation.oid = pg_depend.refobjid::oid
        LEFT JOIN pg_cast dpnr_pg_cast                        ON classid = 'pg_cast'::regclass::oid                 AND dpnr_pg_cast.oid = pg_depend.refobjid::oid
    ) dep
 ORDER BY dep.dependent_type ASC, dep.dependent_name ASC, dep.depender_type ASC, dep.depender_name ASC;
*/});

