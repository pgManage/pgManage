/*jslint browser:true, white:true, multivar:true, for:true*/
/*global window, document, GS, console, evt*/var autocompleteLoaded = true;
var autocompleteGlobals = {
        'popupOpen':       false
      , 'popupAsleep':     false
      , 'popupElement':    null
      , 'intSearchStart':  null
      , 'intSearchEnd':    null
      , 'intSearchOffset': null
      , 'arrSearch':       []
      , 'arrValues':       []
      , 'arrSearchMaster': []
      , 'arrValuesMaster': []
      , 'arrVariables':    []
      , 'bolInserting':    false
      , 'strQueryID':      null
      , 'jsnKeywords':     {} // <-- filled in by the "autocompleteLoadKeywords" function
      , 'arrTypes':        [] // <-- filled in by the "autocompleteLoadTypes" function
      , 'arrSearchPath':   []
      , 'loadId':          0
      , 'arrCancelledIds': []
      , 'bolSnippets':     false
      , 'bolAlpha':        false
      , 'bolBound':        false
      , 'searchLength':    0
      , 'bolQueryRunning': false
      , 'bolQueryCancelled': false
      , 'strSpecialFilter':  ""
      , 'bolTestSlowDown':   false
      , 'quoteLevel':      0
      , 'intContextPosition': 0
      , 'arrStrContext': []
      , 'startRow': 0
      , 'startColumnSearch': 0
    };

function doubleIdentifier(strInput) {
    //console.log('doubleIdentifier(' + strInput + ')');
    var arrStrIdentifier = strInput.match(/^[\n\r\ \t]+([a-zA-Z_][a-zA-z_0-9\$]+|\".*(\"\".*)*\")\.([a-zA-Z_][a-zA-z_0-9\$]+|\".*(\"\".*)*\")([\n\r\ \t]+AS)?([\n\r\ \t]+([a-zA-Z_][a-zA-z_0-9\$]+))?[\n\r\ \t]*/);
    if (arrStrIdentifier) {
        //keywords are not allowed as a table short name
        if (arrStrIdentifier[7] && arrStrIdentifier[7].match(/^(CHECK|A|ABORT|ABS|ABSENT|ABSOLUTE|ACCESS|ACCORDING|ACTION|ADA|ADD|ADMIN|AFTER|AGGREGATE|ALL|ALLOCATE|ALSO|ALTER|ALWAYS|ANALYSE|ANALYZE|AND|ANY|ARE|ARRAY|ARRAY_AGG|ARRAY_MAX_CARDINALITY|AS|ASC|ASENSITIVE|ASSERTION|ASSIGNMENT|ASYMMETRIC|AT|ATOMIC|ATTRIBUTE|ATTRIBUTES|AUTHORIZATION|AVG|BACKWARD|BASE64|BEFORE|BEGIN|BEGIN_FRAME|BEGIN_PARTITION|BERNOULLI|BETWEEN|BIGINT|BINARY|BIT|BIT_LENGTH|BLOB|BLOCKED|BOM|BOOLEAN|BOTH|BREADTH|BY|C|CACHE|CALL|CALLED|CARDINALITY|CASCADE|CASCADED|CASE|CAST|CATALOG|CATALOG_NAME|CEIL|CEILING|CHAIN|CHAR|CHARACTER|CHARACTERISTICS|CHARACTERS|CHARACTER_LENGTH|CHARACTER_SET_CATALOG|CHARACTER_SET_NAME|CHARACTER_SET_SCHEMA|CHAR_LENGTH|CHECK|CHECKPOINT|CLASS|CLASS_ORIGIN|CLOB|CLOSE|CLUSTER|COALESCE|COBOL|COLLATE|COLLATION|COLLATION_CATALOG|COLLATION_NAME|COLLATION_SCHEMA|COLLECT|COLUMN|COLUMNS|COLUMN_NAME|COMMAND_FUNCTION|COMMAND_FUNCTION_CODE|COMMENT|COMMENTS|COMMIT|COMMITTED|CONCURRENTLY|CONDITION|CONDITION_NUMBER|CONFIGURATION|CONFLICT|CONNECT|CONNECTION|CONNECTION_NAME|CONSTRAINT|CONSTRAINTS|CONSTRAINT_CATALOG|CONSTRAINT_NAME|CONSTRAINT_SCHEMA|CONSTRUCTOR|CONTAINS|CONTENT|CONTINUE|CONTROL|CONVERSION|CONVERT|COPY|CORR|CORRESPONDING|COST|COUNT|COVAR_POP|COVAR_SAMP|CREATE|CROSS|CSV|CUBE|CUME_DIST|CURRENT|CURRENT_CATALOG|CURRENT_DATE|CURRENT_DEFAULT_TRANSFORM_GROUP|CURRENT_PATH|CURRENT_ROLE|CURRENT_ROW|CURRENT_SCHEMA|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_TRANSFORM_GROUP_FOR_TYPE|CURRENT_USER|CURSOR|CURSOR_NAME|CYCLE|DATA|DATABASE|DATALINK|DATE|DATETIME_INTERVAL_CODE|DATETIME_INTERVAL_PRECISION|DAY|DB|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFAULTS|DEFERRABLE|DEFERRED|DEFINED|DEFINER|DEGREE|DELETE|DELIMITER|DELIMITERS|DENSE_RANK|DEPENDS|DEPTH|DEREF|DERIVED|DESC|DESCRIBE|DESCRIPTOR|DETERMINISTIC|DIAGNOSTICS|DICTIONARY|DISABLE|DISCARD|DISCONNECT|DISPATCH|DISTINCT|DLNEWCOPY|DLPREVIOUSCOPY|DLURLCOMPLETE|DLURLCOMPLETEONLY|DLURLCOMPLETEWRITE|DLURLPATH|DLURLPATHONLY|DLURLPATHWRITE|DLURLSCHEME|DLURLSERVER|DLVALUE|DO|DOCUMENT|DOMAIN|DOUBLE|DROP|DYNAMIC|DYNAMIC_FUNCTION|DYNAMIC_FUNCTION_CODE|EACH|ELEMENT|ELSE|EMPTY|ENABLE|ENCODING|ENCRYPTED|END|END-EXEC|END_FRAME|END_PARTITION|ENFORCED|ENUM|EQUALS|ESCAPE|EVENT|EVERY|EXCEPT|EXCEPTION|EXCLUDE|EXCLUDING|EXCLUSIVE|EXEC|EXECUTE|EXISTS|EXP|EXPLAIN|EXPRESSION|EXTENSION|EXTERNAL|EXTRACT|FALSE|FAMILY|FETCH|FILE|FILTER|FINAL|FIRST|FIRST_VALUE|FLAG|FLOAT|FLOOR|FOLLOWING|FOR|FORCE|FOREIGN|FORTRAN|FORWARD|FOUND|FRAME_ROW|FREE|FREEZE|FROM|FS|FULL|FUNCTION|FUNCTIONS|FUSION|G|GENERAL|GENERATED|GET|GLOBAL|GO|GOTO|GRANT|GRANTED|GREATEST|GROUP|GROUPING|GROUPS|HANDLER|HAVING|HEADER|HEX|HIERARCHY|HOLD|HOUR|ID|IDENTITY|IF|IGNORE|ILIKE|IMMEDIATE|IMMEDIATELY|IMMUTABLE|IMPLEMENTATION|IMPLICIT|IMPORT|IN|INCLUDING|INCREMENT|INDENT|INDEX|INDEXES|INDICATOR|INHERIT|INHERITS|INITIALLY|INLINE|INNER|INOUT|INPUT|INSENSITIVE|INSERT|INSTANCE|INSTANTIABLE|INSTEAD|INT|INTEGER|INTEGRITY|INTERSECT|INTERSECTION|INTERVAL|INTO|INVOKER|IS|ISNULL|ISOLATION|JOIN|K|KEY|KEY_MEMBER|KEY_TYPE|LABEL|LAG|LANGUAGE|LARGE|LAST|LAST_VALUE|LATERAL|LEAD|LEADING|LEAKPROOF|LEAST|LEFT|LENGTH|LEVEL|LIBRARY|LIKE|LIKE_REGEX|LIMIT|LINK|LISTEN|LN|LOAD|LOCAL|LOCALTIME|LOCALTIMESTAMP|LOCATION|LOCATOR|LOCK|LOCKED|LOGGED|LOWER|M|MAP|MAPPING|MATCH|MATCHED|MATERIALIZED|MAX|MAXVALUE|MAX_CARDINALITY|MEMBER|MERGE|MESSAGE_LENGTH|MESSAGE_OCTET_LENGTH|MESSAGE_TEXT|METHOD|MIN|MINUTE|MINVALUE|MOD|MODE|MODIFIES|MODULE|MONTH|MORE|MOVE|MULTISET|MUMPS|NAME|NAMES|NAMESPACE|NATIONAL|NATURAL|NCHAR|NCLOB|NESTING|NEW|NEXT|NFC|NFD|NFKC|NFKD|NIL|NO|NONE|NORMALIZE|NORMALIZED|NOT|NOTHING|NOTIFY|NOTNULL|NOWAIT|NTH_VALUE|NTILE|NULL|NULLABLE|NULLIF|NULLS|NUMBER|NUMERIC|OBJECT|OCCURRENCES_REGEX|OCTETS|OCTET_LENGTH|OF|OFF|OFFSET|OIDS|OLD|ON|ONLY|OPEN|OPERATOR|OPTION|OPTIONS|OR|ORDER|ORDERING|ORDINALITY|OTHERS|OUT|OUTER|OUTPUT|OVER|OVERLAPS|OVERLAY|OVERRIDING|OWNED|OWNER|P|PAD|PARALLEL|PARAMETER|PARAMETER_MODE|PARAMETER_NAME|PARAMETER_ORDINAL_POSITION|PARAMETER_SPECIFIC_CATALOG|PARAMETER_SPECIFIC_NAME|PARAMETER_SPECIFIC_SCHEMA|PARSER|PARTIAL|PARTITION|PASCAL|PASSING|PASSTHROUGH|PASSWORD|PATH|PERCENT|PERCENTILE_CONT|PERCENTILE_DISC|PERCENT_RANK|PERIOD|PERMISSION|PLACING|PLANS|PLI|POLICY|PORTION|POSITION|POSITION_REGEX|POWER|PRECEDES|PRECEDING|PRECISION|PREPARE|PREPARED|PRESERVE|PRIMARY|PRIOR|PRIVILEGES|PROCEDURAL|PROCEDURE|PROGRAM|PUBLIC|QUOTE|RANGE|RANK|READ|READS|REAL|REASSIGN|RECHECK|RECOVERY|RECURSIVE|REF|REFERENCES|REFERENCING|REFRESH|REGR_AVGX|REGR_AVGY|REGR_COUNT|REGR_INTERCEPT|REGR_R2|REGR_SLOPE|REGR_SXX|REGR_SXY|REGR_SYY|REINDEX|RELATIVE|RELEASE|RENAME|REPEATABLE|REPLACE|REPLICA|REQUIRING|RESET|RESPECT|RESTART|RESTORE|RESTRICT|RESULT|RETURN|RETURNED_CARDINALITY|RETURNED_LENGTH|RETURNED_OCTET_LENGTH|RETURNED_SQLSTATE|RETURNING|RETURNS|REVOKE|RIGHT|ROLE|ROLLBACK|ROLLUP|ROUTINE|ROUTINE_CATALOG|ROUTINE_NAME|ROUTINE_SCHEMA|ROW|ROWS|ROW_COUNT|ROW_NUMBER|RULE|SAVEPOINT|SCALE|SCHEMA|SCHEMA_NAME|SCOPE|SCOPE_CATALOG|SCOPE_NAME|SCOPE_SCHEMA|SCROLL|SEARCH|SECOND|SECTION|SECURITY|SELECT|SELECTIVE|SELF|SENSITIVE|SEQUENCE|SEQUENCES|SERIALIZABLE|SERVER|SERVER_NAME|SESSION|SESSION_USER|SET|SETOF|SETS|SHARE|SHOW|SIMILAR|SIMPLE|SIZE|SKIP|SMALLINT|SNAPSHOT|SOME|SOURCE|SPACE|SPECIFIC|SPECIFICTYPE|SPECIFIC_NAME|SQL|SQLCODE|SQLERROR|SQLEXCEPTION|SQLSTATE|SQLWARNING|SQRT|STABLE|STANDALONE|START|STATE|STATEMENT|STATIC|STATISTICS|STDDEV_POP|STDDEV_SAMP|STDIN|STDOUT|STORAGE|STRICT|STRIP|STRUCTURE|STYLE|SUBCLASS_ORIGIN|SUBMULTISET|SUBSTRING|SUBSTRING_REGEX|SUCCEEDS|SUM|SYMMETRIC|SYSID|SYSTEM|SYSTEM_TIME|SYSTEM_USER|T|TABLE|TABLES|TABLESAMPLE|TABLESPACE|TABLE_NAME|TEMP|TEMPLATE|TEMPORARY|TEXT|THEN|TIES|TIME|TIMESTAMP|TIMEZONE_HOUR|TIMEZONE_MINUTE|TO|TOKEN|TOP_LEVEL_COUNT|TRAILING|TRANSACTION|TRANSACTIONS_COMMITTED|TRANSACTIONS_ROLLED_BACK|TRANSACTION_ACTIVE|TRANSFORM|TRANSFORMS|TRANSLATE|TRANSLATE_REGEX|TRANSLATION|TREAT|TRIGGER|TRIGGER_CATALOG|TRIGGER_NAME|TRIGGER_SCHEMA|TRIM|TRIM_ARRAY|TRUE|TRUNCATE|TRUSTED|TYPE|TYPES|UESCAPE|UNBOUNDED|UNCOMMITTED|UNDER|UNENCRYPTED|UNION|UNIQUE|UNKNOWN|UNLINK|UNLISTEN|UNLOGGED|UNNAMED|UNNEST|UNTIL|UNTYPED|UPDATE|UPPER|URI|USAGE|USER|USER_DEFINED_TYPE_CATALOG|USER_DEFINED_TYPE_CODE|USER_DEFINED_TYPE_NAME|USER_DEFINED_TYPE_SCHEMA|USING|VACUUM|VALID|VALIDATE|VALIDATOR|VALUE|VALUES|VALUE_OF|VARBINARY|VARCHAR|VARIADIC|VARYING|VAR_POP|VAR_SAMP|VERBOSE|VERSION|VERSIONING|VIEW|VIEWS|VOLATILE|WHEN|WHENEVER|WHERE|WHITESPACE|WIDTH_BUCKET|WINDOW|WITH|WITHIN|WITHOUT|WORK|WRAPPER|WRITE|XML|XMLAGG|XMLATTRIBUTES|XMLBINARY|XMLCAST|XMLCOMMENT|XMLCONCAT|XMLDECLARATION|XMLDOCUMENT|XMLELEMENT|XMLEXISTS|XMLFOREST|XMLITERATE|XMLNAMESPACES|XMLPARSE|XMLPI|XMLQUERY|XMLROOT|XMLSCHEMA|XMLSERIALIZE|XMLTABLE|XMLTEXT|XMLVALIDATE|YEAR|YES|ZONE)$/i)) {
            autocompleteGlobals.arrStrContext.push([arrStrIdentifier[1] ? arrStrIdentifier[1] : ''
                , arrStrIdentifier[3] ? arrStrIdentifier[3] : ''
                , '']);
        } else {
            autocompleteGlobals.arrStrContext.push([arrStrIdentifier[1] ? arrStrIdentifier[1] : ''
                , arrStrIdentifier[3] ? arrStrIdentifier[3] : ''
                , arrStrIdentifier[7] ? arrStrIdentifier[7] : '']);
        }
    }
}

function getContext(strInput, intPosition) {
    'use strict';

    // don't change the order of the main waterfall in this function.



    //Make sure we remove the snippets before we return the function
    autocompleteGlobals.bolSnippets = false;
    autocompleteGlobals.bolAlpha = false;

    intPosition++; //add character for zero based

    // make sure that we have only whitespace after the cursor, otherwise we just end it here, however last line last character is allowed
    //console.log('intPosition', intPosition);
    //console.log('strInput.length', strInput.length);
    //console.log('Check Whitespace', (! strInput[intPosition].match('^[\n\r\ \t]+')) && (intPosition !== strInput.length));
    //console.log('Check Whitespace>' + strInput[intPosition] + '<');
    //console.log('Check Whitespace - 1>' + strInput[intPosition - 1] + '<');
    //console.log('Check Whitespace 1>' + strInput[1] + '<');
    //console.log('Check Whitespace 0>' + strInput[0] + '<');
    if (strInput[intPosition] && (!strInput[intPosition].match('^[\n\r\ \t]+')) && (intPosition !== strInput.length)) {
        return;
    }
    
    if (strInput.match(/[\n\r\ \t]+/g).length < 2) {
        autocompleteGlobals.bolSnippets = true;
    }

    var intContextPosition = 0;
    var strContext;
    var arrShortQueries = ['snippets'];
    var strFirst = '';

    autocompleteGlobals.arrStrContext = [];

    var bolFinal = false;
    var intFinalI;
    var intFinalContextPosition;
    var strFinalContext;
    var arrFinalShortQueries;
    var strFinalFirst;

    var arrQueries = [];

    var intTabLevel = 0;

    var intDoubleColon = 0;

    var bolDeclare = false;
    var bolFunction = false;

    var bolDrop = false;
    var bolAlter = false;
    var bolComment = false;
    var bolSecurityLabel = false;
    var bolCreate = false;

    var bolType = false;
    var bolOperator = false;

    var bolPolicy = false;
    var bolSequence = false;
    var bolTable = false;

    var bolTextSearchConfiguration = false;
    var bolTextSearchDictionary = false;
    var bolTextSearchParser = false;
    var bolTextSearchTemplate = false;

    var bolGrant = false;
    var bolRevoke = false;
    var bolInsert = false;
    var bolUpdate = false;
    var bolDelete = false;
    var bolSelect = false;
    var bolJoin = false;
    var bolInsertValues = false;
    var bolRule = false;
    var bolLastComment = false;
    var bolBody = false;
    var bolWhere = false;
    var bolIf = false;

    var strNextTwoChar;
    var strNextOneChar;
    var strPrevOneChar;
    var bolWordBreak;

    var bolStdin = false;


    var intCase = 0;
    var i;
    var len;

    var int_qs = 0; // quote status
    var int_E_quote = 0; // for single quotes and backslash skipping (not being used? only set?)
    var int_ps = 0; // parenthesis level
    var int_tag = 0;
    var str_tag = '';

    //console.log('start');

    i = 0;
    len = strInput.length;
    while (i < len) {
        strNextTwoChar = strInput.substr(i, 2);
        strNextOneChar = strInput.substr(i, 1);
        strPrevOneChar = strInput.substr(i - 1, 1);
        bolWordBreak = (
            strPrevOneChar.match('^[\n\r\ \t]+') ||
            strPrevOneChar === '(' ||
            i === 0
        );

        // FOUND MULTILINE COMMENT:
        if (int_qs === 0 && strNextTwoChar === "/*") {
            int_qs = 5;
            //console.log("found multiline comment");

        // ENDING MULTILINE COMMENT
        } else if (int_qs === 5 && strNextTwoChar === "*/") {
            int_qs = 0;
            //console.log("found end of multiline comment");

        // FOUND DASH COMMENT:
        } else if (int_qs === 0 && strNextTwoChar === "--") {
            int_qs = 6;
            //console.log("found dash comment");

        // ENDING DASH COMMENT
        } else if (int_qs === 6 && (strNextOneChar === "\n" || strNextOneChar === "\r")) {
            int_qs = 0;
            //console.log("found end of dash comment");

        // CONSUME COMMENT
        } else if (int_qs === 6 || int_qs === 5) {

        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double or single quotes and comments.
        } else if (
            strNextOneChar === "\\" &&
            int_qs !== 4 &&
            int_qs !== 2 &&
            int_qs !== 5 &&
            int_qs !== 6
        ) {
            // skip next character
            i += 1;

            //console.log("found slash int_loop: %s", int_loop);

        // FOUND SINGLE QUOTE:
        } else if (int_qs === 0 && strNextOneChar === "'") {
            int_qs = 3;
            int_E_quote = (i - 1) === 'E';
            //console.log("found single quote");

        // FOUND TWO SINGLE QUOTES INSIDE STRING:
        } else if (int_qs === 3 && strNextTwoChar === "''") {
            //add next character
            i += 1;
            //console.log("found two single quote");

        // ENDING SINGLE QUOTE
        } else if (int_qs === 3 && strNextOneChar === "'") {
            int_qs = 0;
            int_E_quote = 0;
            //console.log("found end of single quote");

        // FOUND DOUBLE QUOTE:
        } else if (int_qs === 0 && strNextOneChar === "\"") {
            int_qs = 4;
            //console.log("found double quote");

        // ENDING DOUBLE QUOTE
        } else if (int_qs === 4 && strNextOneChar === "\"") {
            int_qs = 0;
            //console.log("found end of double quote");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE
        } else if (
            int_qs === 0 &&
            strInput.substr(i).match(/^(DROP|ALTER|COMMENT|SECURITY[\ \t]+LABEL|CREATE)[\ \t\n]+/i) &&
            bolWordBreak
        ) {
            bolDrop = strInput.substr(i).match(/^DROP/i) ? true : false;
            bolAlter = strInput.substr(i).match(/^ALTER/i) ? true : false;
            bolComment = strInput.substr(i).match(/^COMMENT/i) ? true : false;
            bolSecurityLabel = strInput.substr(i).match(/^SECURITY[\ \t]+LABEL/i) ? true : false;
            bolCreate = strInput.substr(i).match(/^CREATE/i) ? true : false;
            i += (strInput.substr(i).match(/^(DROP|ALTER|COMMENT|SECURITY[\ \t]+LABEL|CREATE)/i)[0].length - 1);
            //intTabLevel += 1;
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE|" + intTabLevel + "<");

            if (bolAlter) {
                strFirst = ' ';
                intContextPosition = i + 1;
                arrShortQueries = ['schemasAll'];
            }

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... AGGREGATE
        } else if (
            int_qs === 0 &&
            strInput.substr(i).match(/^AGGREGATE[\n\r\ \t]+/i) &&
            bolWordBreak &&
            (
                bolDrop ||
                bolAlter ||
                bolComment ||
                bolSecurityLabel ||
                bolCreate
            )
        ) {
            i += (strInput.substr(i).match(/^AGGREGATE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasAggregates'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... AGGREGATE|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... CONVERSION
        } else if (
            int_qs === 0 &&
            strInput.substr(i).match(/^CONVERSION[\n\r\ \t]+/i) &&
            bolWordBreak &&
            (
                bolDrop ||
                bolAlter ||
                bolComment ||
                bolSecurityLabel ||
                bolCreate
            )
        ) {
            i += (strInput.substr(i).match(/^CONVERSION/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasConversions'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... CONVERSION|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... CONSTRAINT
        } else if (int_qs === 0 && strInput.substr(i).match(/^CONSTRAINT[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^CONSTRAINT/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasConstraints'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... CONSTRAINT|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... COLLATION
        } else if (int_qs === 0 && strInput.substr(i).match(/^COLLATION[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^COLLATION/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasCollations'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... COLLATION|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TABLE/INHERIT
        } else if (int_qs === 0 && strInput.substr(i).match(/^(TABLE|INHERIT)[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolSecurityLabel || bolCreate)) {
            bolTable = strInput.substr(i).match(/^TABLE/i) ? true : false;

            i += (strInput.substr(i).match(/^(TABLE|INHERIT)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];

            doubleIdentifier(strInput.substr(i + 1));
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TABLE/INHERIT|" + intTabLevel + "<");

        // FOUND ALTER TABLE ... TABLE/EXISTS/ONLY
        } else if (int_qs === 0 && strInput.substr(i).match(/^(TABLE|EXISTS|ONLY)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTable) {
            i += (strInput.substr(i).match(/^(TABLE|EXISTS|ONLY)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">ALTER TABLE ... TABLE/EXISTS/ONLY|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... RULE
        } else if (int_qs === 0 && strInput.substr(i).match(/^RULE[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^RULE/i)[0].length - 1);

            bolRule = true;

            doubleIdentifier(strInput.substr(i + 1));
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... RULE|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... VIEW
        } else if (int_qs === 0 && strInput.substr(i).match(/^VIEW[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^VIEW/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasViewsOnly'];

            doubleIdentifier(strInput.substr(i + 1));
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... VIEW|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... COLUMN
        } else if (int_qs === 0 && strInput.substr(i).match(/^COLUMN[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^COLUMN/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['contextTablesColumns'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... COLLATION|" + intTabLevel + "<");

        // FOUND COMMENT ON COLUMN
        } else if (int_qs === 0 && strInput.substr(i).match(/^COLUMN[\n\r\ \t]+/i) && bolWordBreak && bolComment) {
            i += (strInput.substr(i).match(/^COLUMN/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTablesColumns'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... DOMAIN|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... DOMAIN
        } else if (int_qs === 0 && strInput.substr(i).match(/^DOMAIN[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^DOMAIN/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasDomains'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... DOMAIN|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... FOREIGN TABLE
        } else if (int_qs === 0 && strInput.substr(i).match(/^FOREIGN[\n\r\ \t]+TABLE[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^FOREIGN[\n\r\ \t]+TABLE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasForeignTables'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... FOREIGN TABLE|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... FUNCTION/HANDLER/VALIDATOR
        } else if (int_qs === 0 && strInput.substr(i).match(/^(FUNCTION|HANDLER|VALIDATOR)[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^(FUNCTION|HANDLER|VALIDATOR)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... FUNCTION/HANDLER/VALIDATOR|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... INDEX/CLUSTERON
        } else if (int_qs === 0 && strInput.substr(i).match(/^(INDEX|CLUSTERON)[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^(INDEX|CLUSTERON)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasIndexes'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... INDEX/CLUSTERON|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... MATERIALIZED VIEW
        } else if (int_qs === 0 && strInput.substr(i).match(/^MATERIALIZED[\n\r\ \t]+VIEW[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^MATERIALIZED[\n\r\ \t]+VIEW/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasMaterializedViews'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... MATERIALIZED VIEW|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR CLASS
        } else if (int_qs === 0 && strInput.substr(i).match(/^OPERATOR[\n\r\ \t]+CLASS[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^OPERATOR[\n\r\ \t]+CLASS/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasOperatorClasses'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR CLASS|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR FAMILY
        } else if (int_qs === 0 && strInput.substr(i).match(/^OPERATOR[\n\r\ \t]+FAMILY[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^OPERATOR[\n\r\ \t]+FAMILY/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasOperatorFamilies'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR FAMILY|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR
        } else if (int_qs === 0 && strInput.substr(i).match(/^OPERATOR[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^OPERATOR/i)[0].length - 1);

            bolOperator = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasOperators'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... OPERATOR|" + intTabLevel + "<");

        // FOUND CREATE OPERATOR ... PROCEDURE/JOIN/RESTRICT/COMMUTATOR/NEGATOR
        } else if (int_qs === 0 && strInput.substr(i).match(/^(PROCEDURE|JOIN|RESTRICT|COMMUTATOR|NEGATOR)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolOperator) {
            i += (strInput.substr(i).match(/^(PROCEDURE|JOIN|RESTRICT|COMMUTATOR|NEGATOR)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">CREATE OPERATOR ... PROCEDURE/JOIN/RESTRICT/COMMUTATOR/NEGATOR|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... SEQUENCE
        } else if (int_qs === 0 && strInput.substr(i).match(/^SEQUENCE[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^SEQUENCE/i)[0].length - 1);

            bolSequence = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasSequences'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... SEQUENCE|" + intTabLevel + "<");

        // FOUND ALTER SEQUENCE ... BY
        } else if (int_qs === 0 && strInput.substr(i).match(/^BY[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolSequence) {
            i += (strInput.substr(i).match(/^BY/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">ALTER SEQUENCE ... ON|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... POLICY
        } else if (int_qs === 0 && strInput.substr(i).match(/^POLICY[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^POLICY/i)[0].length - 1);

            bolPolicy = true;
            //console.log(">ALTER/COMMENT/SECURITY LABEL/CREATE ... POLICY|" + intTabLevel + "<");

        // FOUND ALTER POLICY/RULE ... ON
        } else if (int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && (bolPolicy || bolRule)) {
            i += (strInput.substr(i).match(/^ON/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">ALTER POLICY/RULE ... ON|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TYPE
        } else if (int_qs === 0 && strInput.substr(i).match(/^TYPE[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^TYPE/i)[0].length - 1);

            bolType = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTypes'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TYPE|" + intTabLevel + "<");

        // FOUND CREATE TYPE ... SUBTYPE_OPCLASS
        } else if (int_qs === 0 && strInput.substr(i).match(/^SUBTYPE_OPCLASS[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolType) {
            i += (strInput.substr(i).match(/^SUBTYPE_OPCLASS/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasOperatorClasses'];
            //console.log(">CREATE TYPE ... SUBTYPE_OPCLASS|" + intTabLevel + "<");

        // FOUND CREATE TYPE ... CANONICAL/SUBTYPE_DIFF/INPUT/OUTPUT/RECEIVE/SEND/TYPMOD_IN/TYPMOD_OUT/ANALYZE
        } else if (int_qs === 0 && strInput.substr(i).match(/^(CANONICAL|SUBTYPE_DIFF|INPUT|OUTPUT|RECEIVE|SEND|TYPMOD_IN|TYPMOD_OUT|ANALYZE)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolType) {
            i += (strInput.substr(i).match(/^(CANONICAL|SUBTYPE_DIFF|INPUT|OUTPUT|RECEIVE|SEND|TYPMOD_IN|TYPMOD_OUT|ANALYZE)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">CREATE TYPE ... CANONICAL/SUBTYPE_DIFF/INPUT/OUTPUT/RECEIVE/SEND/TYPMOD_IN/TYPMOD_OUT/ANALYZE|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH CONFIGURATION
        } else if (int_qs === 0 && strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+CONFIGURATION[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+CONFIGURATION/i)[0].length - 1);

            bolTextSearchConfiguration = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchConfigurations'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH CONFIGURATION|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH DICTIONARY
        } else if (int_qs === 0 && strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+DICTIONARY[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+DICTIONARY/i)[0].length - 1);

            bolTextSearchDictionary = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchDictionaries'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH DICTIONARY|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH PARSER
        } else if (int_qs === 0 && strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+PARSER[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+PARSER/i)[0].length - 1);

            bolTextSearchParser = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchParsers'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH PARSER|" + intTabLevel + "<");

        // FOUND DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH TEMPLATE
        } else if (int_qs === 0 && strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+TEMPLATE[\n\r\ \t]+/i) && bolWordBreak && (bolDrop || bolAlter || bolComment || bolSecurityLabel || bolCreate)) {
            i += (strInput.substr(i).match(/^TEXT[\n\r\ \t]+SEARCH[\n\r\ \t]+TEMPLATE/i)[0].length - 1);

            bolTextSearchTemplate = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchTemplates'];
            //console.log(">DROP/ALTER/COMMENT/SECURITY LABEL/CREATE ... TEXT SEARCH TEMPLATE|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH CONFIGURATION ... PARSER
        } else if (int_qs === 0 && strInput.substr(i).match(/^PARSER[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchConfiguration) {
            i += (strInput.substr(i).match(/^PARSER/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchParsers'];
            //console.log(">CREATE TEXT SEARCH CONFIGURATION ... PARSER|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH CONFIGURATION ... COPY/SEARCH CONFIGURATION
        } else if (int_qs === 0 && strInput.substr(i).match(/^(COPY|SEARCH[\n\r\ \t]+CONFIGURATION)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchConfiguration) {
            i += (strInput.substr(i).match(/^(COPY|SEARCH[\n\r\ \t]+CONFIGURATION)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchConfigurations'];
            //console.log(">CREATE TEXT SEARCH CONFIGURATION ... COPY/SEARCH CONFIGURATION|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH CONFIGURATION ... REPLACE/WITH
        } else if (int_qs === 0 && strInput.substr(i).match(/^(REPLACE|WITH)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchConfiguration) {
            i += (strInput.substr(i).match(/^(REPLACE|WITH)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchDictionaries'];
            //console.log(">CREATE TEXT SEARCH CONFIGURATION ... REPLACE/WITH|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH DICTIONARY ... TEMPLATE
        } else if (int_qs === 0 && strInput.substr(i).match(/^TEMPLATE[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchDictionary) {
            i += (strInput.substr(i).match(/^TEMPLATE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTextSearchTemplates'];
            //console.log(">CREATE TEXT SEARCH DICTIONARY ... TEMPLATE|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH PARSER ... START/GETTOKEN/END/LEXTYPES/HEADLINE
        } else if (int_qs === 0 && strInput.substr(i).match(/^(START|GETTOKEN|END|LEXTYPES|HEADLINE)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchParser) {
            i += (strInput.substr(i).match(/^(START|GETTOKEN|END|LEXTYPES|HEADLINE)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">CREATE TEXT SEARCH DICTIONARY ... START/GETTOKEN/END/LEXTYPES/HEADLINE|" + intTabLevel + "<");

        // FOUND CREATE TEXT SEARCH TEMPLATE ... INIT/LEXIZE
        } else if (int_qs === 0 && strInput.substr(i).match(/^(INIT|LEXIZE)[\n\r\ \t]+/i) && bolWordBreak && (bolCreate || bolAlter) && bolTextSearchTemplate) {
            i += (strInput.substr(i).match(/^(INIT|LEXIZE)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">CREATE TEXT SEARCH TEMPLATE ... INIT/LEXIZE|" + intTabLevel + "<");

        // FOUND CREATE ... VIEW
        } else if (int_qs === 0 && strInput.substr(i).match(/^VIEW[\n\r\ \t]+/i) && bolWordBreak && bolCreate) {
            i += (strInput.substr(i).match(/^VIEW/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasViewsOnly'];
            //console.log(">CREATE ... VIEW|" + intTabLevel + "<");

        // FOUND CREATE ... FUNC
        } else if (int_qs === 0 && strInput.substr(i).match(/^FUNC[\n\r\ \t]+/i) && bolWordBreak && bolCreate) {
            i += (strInput.substr(i).match(/^FUNC/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">CREATE ... FUNC|" + intTabLevel + "<");

        // FOUND CREATE ... TO
        } else if (int_qs === 0 && strInput.substr(i).match(/^TO[\n\r\ \t]+/i) && bolWordBreak && bolCreate) {
            i += (strInput.substr(i).match(/^TO/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">CREATE ... TO|" + intTabLevel + "<");

        // FOUND CREATE ... LIKE/INHERITS/REFERENCES
        } else if (int_qs === 0 && strInput.substr(i).match(/^(LIKE|INHERITS|REFERENCES)[\n\r\ \t]+/i) && bolWordBreak && bolCreate) {
            i += (strInput.substr(i).match(/^(LIKE|INHERITS|REFERENCES)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTablesOnly'];
            //console.log(">CREATE ... LIKE/INHERITS/REFERENCES|" + intTabLevel + "<");

        // FOUND ALTER ... OWNER TO
        } else if (int_qs === 0 && strInput.substr(i).match(/^OWNER[\n\r\ \t]+TO[\n\r\ \t]+/i) && bolWordBreak && bolAlter) {
            i += (strInput.substr(i).match(/^OWNER[\n\r\ \t]+TO/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['groups', 'logins'];
            //console.log(">CREATE ... OWNER TO|" + intTabLevel + "<");

        // FOUND UPDATE
        } else if (int_qs === 0 && strInput.substr(i).match(/^UPDATE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^UPDATE/i)[0].length - 1);
            bolUpdate = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];

            doubleIdentifier(strInput.substr(i + 1));
            console.log(">UPDATE|" + intTabLevel + "<");

        // FOUND UPDATE ... SET
        } else if (int_qs === 0 && strInput.substr(i).match(/^SET[\n\r\ \t]+/i) && bolWordBreak && bolUpdate) {
            i += (strInput.substr(i).match(/^SET/i)[0].length - 1);
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['contextColumns'];
            console.log(">UPDATE ... SET|" + intTabLevel + "<");

        // FOUND UPDATE ... SET ... ,
        } else if (int_qs === 0 && strNextOneChar === "," && bolUpdate) {
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['contextColumns'];
            console.log(">UPDATE ... SET ... ,|" + intTabLevel + "<");

        // FOUND UPDATE ... SET ... =
        } else if (int_qs === 0 && strNextOneChar === "=" && bolWordBreak && bolUpdate) {
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            bolFinal = true;
            intFinalI = i;
            intFinalContextPosition = intContextPosition;
            arrFinalShortQueries = arrShortQueries;
            strFinalFirst = strFirst;
            console.log(">UPDATE ... SET ... = lookahead|" + intTabLevel + "<");

        // FOUND DELETE
        } else if (int_qs === 0 && strInput.substr(i).match(/^DELETE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^DELETE/i)[0].length - 1);
            bolDelete = true;

            //console.log(">DELETE|" + intTabLevel + "<");

        // FOUND SELECT
        } else if (int_qs === 0 && strInput.substr(i).match(/^SELECT[\n\r\ \t]+/i) && bolWordBreak && !bolGrant && !bolRevoke) {
            i += (strInput.substr(i).match(/^SELECT/i)[0].length - 1);
            bolSelect = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //set final if we are NOT already on a final and we are NOT past the cursor
            //console.log('bolFinal = ' + bolFinal);
            //console.log('intPosition = ' + intPosition);
            //console.log('i = ' + i);
            if (!bolFinal && intPosition > i) {
                //console.log('bolFinal := true');
                bolFinal = true;
                intFinalI = i;
                intFinalContextPosition = intContextPosition;
                arrFinalShortQueries = arrShortQueries;
                strFinalFirst = strFirst;
            }
            //console.log(">intContextPosition|" + intContextPosition + "<");
            //console.log(">SELECT lookahead|" + intTabLevel + "<");

        // FOUND SELECT ... GROUP/PARTITION/ORDER BY
        } else if (int_qs === 0 && strInput.substr(i).match(/^(GROUP|PARTITION|ORDER)[\n\r\ \t]+BY[\n\r\ \t]+/i) && bolWordBreak && bolSelect) {
            i += (strInput.substr(i).match(/^(GROUP|PARTITION|ORDER)[\n\r\ \t]+BY/i)[0].length - 1);
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];
            //console.log(">INSERT ... INTO|" + intTabLevel + "<");

        // FOUND WHERE
        } else if (int_qs === 0 && strInput.substr(i).match(/^WHERE[\n\r\ \t]+/i) && bolWordBreak) {
            //console.log('case>' + strInput.substr(i).match(/^WHERE/i)[0] + '<');
            i += (strInput.substr(i).match(/^WHERE/i)[0].length - 1);
            bolWhere = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">WHERE|" + intTabLevel + "<");

        // FOUND SELECT/INSERT/UPDATE/DELETE ... AND/OR/operators
        } else if (int_qs === 0 && strInput.substr(i).match(/^(AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~)[\n\r\ \t]+/i) && bolWordBreak && (bolSelect || bolInsert || bolUpdate || bolDelete || intCase > 0)) {
            //console.log('case>' + strInput.substr(i).match(/^(,|AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~)[\n\r\ \t]+/i)[0] + '<');
            i += (strInput.substr(i).match(/^(AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~)/i)[0].length);

            strFirst = ' ';
            intContextPosition = i;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //set final if we are NOT already on a final and we are NOT past the cursor
            //console.log('bolFinal = ' + bolFinal);
            //console.log('intPosition = ' + intPosition);
            //console.log('i = ' + i);
            if (/*!bolFinal && */ intPosition > i) {
                //console.log('bolFinal := true');
                bolFinal = true;
                intFinalI = i;
                intFinalContextPosition = intContextPosition;
                arrFinalShortQueries = arrShortQueries;
                strFinalFirst = strFirst;
            }
            //console.log(">intContextPosition|" + intContextPosition + "<");

            //console.log(">AND/OR/operators lookahead|" + intTabLevel + "<");

        // FOUND SELECT/UPDATE/DELETE ... PARENTHESIS
        } else if (int_qs === 0 && strNextOneChar === "(" && (bolSelect || bolUpdate || bolDelete || intCase > 0)) {
            strFirst = '';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            int_ps = int_ps + 1;
            intTabLevel += 1;

            //set final if we are NOT already on a final and we are NOT past the cursor
            //console.log('bolFinal = ' + bolFinal);
            //console.log('intPosition = ' + intPosition);
            //console.log('i = ' + i);
            if (/*!bolFinal && */ intPosition > i) {
                //console.log('bolFinal := true');
                bolFinal = true;
                intFinalI = i;
                intFinalContextPosition = intContextPosition;
                arrFinalShortQueries = arrShortQueries;
                strFinalFirst = strFirst;
            }
            //console.log(">intContextPosition|" + intContextPosition + "<");

            //console.log(">SELECT/UPDATE/DELETE ... PARENTHESIS lookahead|" + intTabLevel + "<");

        // FOUND IF
        } else if (int_qs === 0 && strInput.substr(i).match(/^IF[\n\r\ \t]+/i) && bolWordBreak) {
            //console.log('case>' + strInput.substr(i).match(/^IF/i)[0] + '<');
            i += (strInput.substr(i).match(/^IF/i)[0].length - 1);
            bolIf = true;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">IF|" + intTabLevel + "<");

        // FOUND $BODY$ ... AND/OR/operators/:=
        } else if (int_qs === 0 && strInput.substr(i).match(/^(AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~|\:\=)[\n\r\ \t]+/i) && bolWordBreak && bolBody) {
            //console.log('case>' + strInput.substr(i).match(/^(AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~|\:\=)/i)[0] + '<');
            i += (strInput.substr(i).match(/^(AND|OR|\=|\!\=|\<\>|\<\=?|\>\=?|I?LIKE|\!?\~|\:\=)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">AND/OR/operators/:=|" + intTabLevel + "<");

        // FOUND PERFORM
        } else if (int_qs === 0 && strInput.substr(i).match(/^PERFORM[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^PERFORM/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];

            doubleIdentifier(strInput.substr(i + 1));
            //console.log(">PERFORM|" + intTabLevel + "<");

        // FOUND USING/FROM/JOIN/ONLY PARENTHESIS
        } else if (int_qs === 0 && strInput.substr(i).match(/^(USING|FROM|JOIN|ONLY|RETURNING)[\n\r\ \t]+\(/i) && bolWordBreak) {
            bolJoin = strInput.substr(i).match(/^JOIN/i) ? true : false;
            i += (strInput.substr(i).match(/^(USING|FROM|JOIN|ONLY|RETURNING)[\n\r\ \t]+\(/i)[0].length);

            strFirst = '';
            intContextPosition = i;
            arrShortQueries = ['snippets'];

            doubleIdentifier(strInput.substr(i));
            //console.log(">USING/FROM/JOIN/ONLY PARENTHESIS|" + intTabLevel + "<");

        // FOUND USING/FROM/JOIN/ONLY
        } else if (int_qs === 0 && strInput.substr(i).match(/^(USING|FROM|JOIN|ONLY|RETURNING)[\n\r\ \t]+/i) && bolWordBreak) {
            bolJoin = strInput.substr(i).match(/^JOIN/i) ? true : false;
            i += (strInput.substr(i).match(/^(USING|FROM|JOIN|ONLY|RETURNING)/i)[0].length);

            strFirst = ' ';
            intContextPosition = i;
            arrShortQueries = ['schemasTables', 'schemasSetFunctions'];

            doubleIdentifier(strInput.substr(i));
            //console.log(">USING/FROM/JOIN/ONLY|" + intTabLevel + "<");

        // FOUND JOIN ... ON
        } else if (int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+/i) && bolWordBreak && bolJoin) {
            i += (strInput.substr(i).match(/^ON/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];
            //console.log(">USING/FROM/JOIN/ONLY|" + intTabLevel + "<");

        // FOUND PROCEDURE
        } else if (int_qs === 0 && strInput.substr(i).match(/^PROCEDURE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^PROCEDURE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">PROCEDURE|" + intTabLevel + "<");

        // FOUND REFRESH MATERIALIZED VIEW
        } else if (int_qs === 0 && strInput.substr(i).match(/^REFRESH[\n\r\ \t]+MATERIALIZED[\n\r\ \t]+VIEW[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^REFRESH[\n\r\ \t]+MATERIALIZED[\n\r\ \t]+VIEW/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasMaterializedViews'];
            //console.log(">REFRESH MATERIALIZED VIEW|" + intTabLevel + "<");

        // FOUND DELETE ... FROM
        } else if (int_qs === 0 && strInput.substr(i).match(/^FROM[\n\r\ \t]+/i) && bolWordBreak && bolDelete) {
            i += (strInput.substr(i).match(/^FROM/i)[0].length - 1);
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">INSERT ... INTO|" + intTabLevel + "<");

        // FOUND INSERT
        } else if (int_qs === 0 && strInput.substr(i).match(/^INSERT[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^INSERT/i)[0].length - 1);
            bolInsert = true;
            //console.log(">INSERT|" + intTabLevel + "<");

        // FOUND INSERT ... INTO
        } else if (int_qs === 0 && strInput.substr(i).match(/^INTO[\n\r\ \t]+/i) && bolWordBreak && bolInsert) {
            i += (strInput.substr(i).match(/^INTO/i)[0].length - 1);
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];

            doubleIdentifier(strInput.substr(i + 1));
            //console.log(">INSERT ... INTO|" + intTabLevel + "<");

        // FOUND INSERT ... (
        } else if (int_qs === 0 && strNextOneChar === "(" && bolInsert && !bolInsertValues) {
            strFirst = '';
            intContextPosition = i + 1;
            arrShortQueries = ['contextColumns'];

            int_ps = int_ps + 1;
            intTabLevel += 1;
            //console.log(">(|" + intTabLevel + "<");

        // FOUND INSERT ... ( ... ,
        } else if (int_qs === 0 && int_ps >= 1 && strNextOneChar === "," && bolInsert && !bolInsertValues) {
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['contextColumns'];

            //console.log(">INSERT ... ( ... ,|" + intTabLevel + "<");

        // FOUND INSERT ... VALUES
        } else if (int_qs === 0 && strInput.substr(i).match(/^VALUES[\n\r\ \t]+/i) && bolWordBreak && bolInsert) {
            i += (strInput.substr(i).match(/^VALUES/i)[0].length - 1);
            strFirst = '';
            intContextPosition = 0;
            arrShortQueries = [];

            bolInsertValues = true;
            //console.log(">INSERT ... VALUES|" + intTabLevel + "<");

        // FOUND INSERT ... VALUES (
        } else if (int_qs === 0 && strNextOneChar === "(" && bolInsert && bolInsertValues) {
            strFirst = '';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'schemasFunctions', 'functions', 'builtins'];

            int_ps = int_ps + 1;
            intTabLevel += 1;
            //console.log(">(|" + intTabLevel + "<");

        // FOUND INSERT ... VALUES ( ... ,
        } else if (int_qs === 0 && int_ps >= 1 && strNextOneChar === "," && bolInsert && bolInsertValues) {
            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">(|" + intTabLevel + "<");

        // FOUND OPEN PARENTHESIS:
        } else if (int_qs === 0 && strNextOneChar === "(") {
            strFirst = '';
            intContextPosition = i + 1;
            arrShortQueries = ['snippets'];

            int_ps = int_ps + 1;
            intTabLevel += 1;
            //console.log(">(|" + intTabLevel + "<");

        // FOUND CLOSE PARENTHESIS
        } else if (int_qs === 0 && strNextOneChar === ")") {
            int_ps = int_ps - 1;
            intTabLevel -= 1;
            //console.log(">)|" + intTabLevel + "<");

        // FOUND DOUBLE COLON
        } else if (int_qs === 0 && strNextTwoChar === "::") {
            intDoubleColon = i + 2;

            strFirst = '';
            intContextPosition = i + 2;
            arrShortQueries = ['types'];
            //console.log(">::|" + intTabLevel + "<");

        // FOUND CAST
        } else if (int_qs === 0 && strInput.substr(i).match(/^CAST[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^CAST/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['types'];
            //console.log(">cast|" + intTabLevel + "<");

        // FOUND RETURNS
        } else if (int_qs === 0 && strInput.substr(i).match(/^RETURNS[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^RETURNS/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['returnTypes'];
            //console.log(">(|" + intTabLevel + "<");

        // FOUND LANGUAGE
        } else if (int_qs === 0 && strInput.substr(i).match(/^LANGUAGE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^LANGUAGE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['languages'];
            //console.log(">(|" + intTabLevel + "<");

        // FOUND TABLESPACE
        } else if (int_qs === 0 && strInput.substr(i).match(/^TABLESPACE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^TABLESPACE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['tablespaces'];
            //console.log(">(|" + intTabLevel + "<");

        // FOUND RULE
        } else if (int_qs === 0 && strInput.substr(i).match(/^RULE[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^RULE/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['rules'];
            //console.log(">(|" + intTabLevel + "<");

        // FOUND $BODY$, ignore this particular dollar quoting
        } else if (int_qs === 0 && strInput.substr(i, 6) === "$BODY$") {
            i += 5;
            bolBody = !bolBody;
            //console.log(">$BODY$|" + intTabLevel + "<");

        // FOUND DOLLAR TAG START:
        } else if (int_qs === 0 && strNextOneChar === "$") {
            //console.log('start dollar tag');
            // we should be looking ahead here. get the tag or if false start then
            // just continue
            var int_test_loop = i + 1;

            //console.log('int_test_loop = ' + int_test_loop);
            //console.log('strInput.length = ' + strInput.length);
            //console.log('strInput.substr(int_test_loop, 1) = ' + strInput.substr(int_test_loop, 1));
            while (int_test_loop < strInput.length && strInput.substr(int_test_loop, 1).match("^[a-zA-Z0-9_]$")) {
                int_test_loop += 1;
                //console.log('int_test_loop = ' + int_test_loop);
            }

            if (strInput.substr(int_test_loop, 1) === '$') {
                int_tag = (int_test_loop - (i - 1));
                str_tag = strInput.substr(i, int_tag);
                // we found the end of the tag, now look for the close tag
                i += (int_tag - 1); //We've already incremented by one
                int_qs = 2;

                //console.log('int_qs = 2');
                // SDEBUG("after int_loop: %s", int_loop);
            } else {
                //console.log('false alarm');
                // false alarm, do nothing
            }

        // END DOLLAR TAG
        } else if (int_qs === 2 && strInput.substr(i, str_tag.length) === str_tag) {
            //console.log('end dollar tag');
            int_qs = 0;
            // move pointer to end of end dollar tag
            int_tag -= 1;
            i += int_tag;

        // FOUND GRANT/REVOKE
        } else if (int_qs === 0 && strInput.substr(i, 7).match(/^(GRANT|REVOKE)\b/i) && bolWordBreak) {
            if (strInput.substr(i, 7).match(/^GRANT\b/i)) {
                bolGrant = true;
                bolRevoke = false;
            } else {
                bolGrant = false;
                bolRevoke = true;
            }
            i += (strInput.substr(i, 7).match(/^(GRANT|REVOKE)\b/i)[0].length);

            strFirst = ' ';
            intContextPosition = i;
            arrShortQueries = ['groups'];
            //console.log(">REVOKE|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED COMMA NOT INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strNextOneChar === "," && !bolGrant && !bolRevoke) {
            i++;

            strFirst = ' ';
            intContextPosition = i;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //set final if we are NOT already on a final and we are NOT past the cursor
            //console.log('bolFinal = ' + bolFinal);
            //console.log('intPosition = ' + intPosition);
            //console.log('i = ' + i);
            if (/*!bolFinal && */ intPosition > i) {
                //console.log('bolFinal := true');
                bolFinal = true;
                intFinalI = i;
                intFinalContextPosition = intContextPosition;
                arrFinalShortQueries = arrShortQueries;
                strFinalFirst = strFirst;
            }
            //console.log(">intContextPosition|" + intContextPosition + "<");

            console.log(">, lookahead|" + intTabLevel + "<");

        // FOUND AN ON SCHEMA INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+SCHEMA[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+SCHEMA/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemas'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND AN ON FUNCTION INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+FUNCTION[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+FUNCTION/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemasFunctions'];
            //console.log(">GRANT ... ON FUNCTION|" + intTabLevel + "<");

        // FOUND AN ON TABLE INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+TABLE[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+TABLE/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemasTables'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND AN ON SEQUENCE INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+SEQUENCE[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+SEQUENCE/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemasSequences'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND AN ON TYPE INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+TYPE[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+TYPE/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemasTypes'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND AN ON DOMAIN INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+DOMAIN[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+DOMAIN/i)[0].length);

            intContextPosition = i;
            arrShortQueries = ['schemasDomains'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND AN ON INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^ON[\n\r\ \t]+/i) && bolWordBreak && (bolGrant || bolRevoke)) {
            strFirst = ' ';
            intContextPosition = i + 2;
            arrShortQueries = ['schemasAll'];
            //console.log(">GRANT ... ON|" + intTabLevel + "<");

        // FOUND A FROM INSIDE A REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^FROM[\n\r\ \t]+/i) && bolWordBreak && bolRevoke) {
            strFirst = ' ';
            intContextPosition = i + 4;
            arrShortQueries = ['logins', 'groups'];
            //console.log(">REVOKE ... FROM|" + intTabLevel + "<");

        // FOUND A TO INSIDE A GRANT STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i).match(/^TO[\n\r\ \t]+/i) && bolWordBreak && bolGrant) {
            strFirst = ' ';
            intContextPosition = i + 2;
            arrShortQueries = ['logins', 'groups'];
            //console.log(">GRANT ... TO|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED COMMA INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strNextOneChar === "," && bolGrant && bolRevoke) {
            //console.log(">,|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED SEMICOLON:
        } else if (int_ps === 0 && int_qs === 0 && strNextOneChar === ";") {
            if (i + 1 >= intPosition && bolFinal) {//if we are on the last statement, and we were just looking ahead for tables, then stop here
                //console.log('break because of bolFinal');
                break;
            } else {
                //console.log('bolFinal := false');
                bolFinal = false;
            }

            if (bolRule) {
                intTabLevel -= 1;
            }

            //if state is a copy, from stdin, then we need to ignore the data after wards
            if (bolStdin) {
                i += 1 + strInput.substr(i + 1).indexOf('\n\\.') + 3;//\n\\.
                bolStdin = false;
            }

            //bolDeclare = false;//DO NOT UNCOMMENT!! after a semicolon inside a declare, we are still inside a declare
            bolFunction = false;
            bolDrop = false;
            bolAlter = false;
            bolComment = false;
            bolSecurityLabel = false;
            bolCreate = false;
            bolType = false;
            bolOperator = false;
            bolTextSearchConfiguration = false;
            bolTextSearchDictionary = false;
            bolTextSearchParser = false;
            bolTextSearchTemplate = false;
            bolGrant = false;
            bolRevoke = false;
            bolInsert = false;
            bolUpdate = false;
            bolDelete = false;
            bolSelect = false;
            bolJoin = false;
            bolInsertValues = false;
            bolRule = false;
            bolLastComment = false;
            bolBody = false;
            bolWhere = false;
            bolIf = false;
            bolPolicy = false;
            bolSequence = false;
            bolTable = false;

            autocompleteGlobals.arrStrContext = [];

            strFirst = '\\n\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'snippets'];
           // console.log(">;|" + intTabLevel + "<");

        // Function Declare
        } else if (int_qs === 0 && strInput.substr(i).match(/^DECLARE\b/i) && bolWordBreak) {
            i = i + 6 + (strInput.substr(i + 7, 1) === ' ' ? 1 : 0);
            intTabLevel += 1;
            bolDeclare = true;
           // console.log(">DECLARE|" + intTabLevel + "<");

        // Transactions
        } else if (int_qs === 0 && strInput.substr(i).match(/^BEGIN\b/i) && bolWordBreak) {
            i = i + 4 + (strInput.substr(i + 5, 1) === ' ' ? 1 : 0);
            if (bolDeclare) {
                bolDeclare = false;
            } else {
                intTabLevel += 1;
            }

            strFirst = '\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'snippets'];
           // console.log(">BEGIN|" + intTabLevel + "<");

        // FOUND CASE WHEN
        } else if (int_qs === 0 && strInput.substr(i).match(/^CASE[\ \t\n]+WHEN\b/i)) {
            i = i + (strInput.substr(i).match(/^CASE[\ \t\n]+WHEN\b/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            intTabLevel += 1;
            intCase += 1; //INCREASE CASE LEVEL, WHILE intCase > 0 THEN "THEN" AND "END" IS TREATED DIFFERENTLY
            //console.log(">CASE|" + intTabLevel + "<");

        // FOUND CASE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CASE\b/i)) {
            i = i + (strInput.substr(i).match(/^CASE\b/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            intTabLevel += 1;
            intCase += 1; //INCREASE CASE LEVEL, WHILE intCase > 0 THEN "THEN" AND "END" IS TREATED DIFFERENTLY
            //console.log(">CASE|" + intTabLevel + "<");

        // FOUND DISTINCT FROM
        } else if (int_qs === 0 && strInput.substr(i).match((/^DISTINCT[\ \t\n]+FROM[\ \t\n]+/i))) {
            i = i + (strInput.substr(i).match((/^DISTINCT[\ \t\n]+FROM/i))[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];


        // FOUND CASE... THEN
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^THEN\b/i) && bolWordBreak) {
            i = i + 3;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">C THEN|" + intTabLevel + "<");

        // FOUND CASE... WHEN
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^WHEN\b/i) && bolWordBreak) {
            i = i + 3;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">WHEN|" + intTabLevel + "<");

        // FOUND CASE... ELSE
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^ELSE\b/i) && bolWordBreak) {
            i = i + 3;

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'contextTablesColumns', 'schemasFunctions', 'functions', 'builtins'];

            //console.log(">C ELSE|" + intTabLevel + "<");

        // FOUND CASE... END
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^END\b/i) && bolWordBreak) {
            i = i + 2;
            intTabLevel -= 1;
            intCase -= 1;
            //console.log(">END|" + intTabLevel + "<");

        // FOUND THEN
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^THEN\b/i) && bolWordBreak) {
            intTabLevel += 1;
            i = i + 3;

            if (i + 1 >= intPosition && bolFinal) {//if we are on the last statement, and we were just looking ahead for tables, then stop here
                break;
            } else {
                bolFinal = false;
            }

            strFirst = '\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'snippets'];
            //console.log(">I THEN|" + intTabLevel + "<");

        // FOUND LOOP
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^LOOP\b/i) && bolWordBreak) {
            intTabLevel += 1;
            i = i + 3;

            if (i + 1 >= intPosition && bolFinal) {//if we are on the last statement, and we were just looking ahead for tables, then stop here
                break;
            } else {
                bolFinal = false;
            }

            strFirst = '\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['variables', 'snippets'];
            //console.log(">LOOP|" + intTabLevel + "<");

        // FOUND THEN... ELSE
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^ELSE\b/i) && bolWordBreak) {
            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            //console.log(">ELSE|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE RULE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?RULE\b/i) && bolWordBreak) {
            bolRule = true;
            bolCreate = true;
            i += (strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE[\ \t]+)?RULE/i)[0].length - 1);
            intTabLevel += 1;
            //console.log(">CREATE OR REPLACE RULE|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE RULE... INSTEAD
        } else if (int_qs === 0 && bolRule && strInput.substr(i,8).match(/^INSTEAD[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i,8).match(/^INSTEAD/i)[0].length - 1);

            strFirst = '\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['snippets'];
            //console.log(">INSTEAD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE FUNCTION
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+FUNCTION/i) && bolWordBreak) {
            bolFunction = true;
            i += (strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+FUNCTION/i)[0].length - 1);
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE FUNCTION... AS
        } else if (int_qs === 0 && bolFunction && strInput.substr(i).match(/^AS[\n\r\ \t]+/i) && bolWordBreak) {

            bolFunction = false;
            i += 1;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND AS
        } else if (int_qs === 0 && (!bolFunction) && strInput.substr(i).match(/^AS[\n\r\ \t]+/i) && bolWordBreak) {
            i += 1;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND END IF;
        } else if (int_qs === 0 && strInput.substr(i).match(/^END[\ \t\n\r]+IF[\ \t\n\r]*;/i)) {
            intTabLevel -= 1;
            i = i + (-1) + (strInput.substr(i).match(/^END[\ \t\n\r]+IF[\ \t\n\r]*;[\ \t]*/i)[0].length);
            bolLastComment = false;


            strFirst = '\\n\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['snippets'];
            //console.log(">END IF;|" + intTabLevel + "<");

        // FOUND END LOOP;
        } else if (int_qs === 0 && strInput.substr(i).match(/^END[\ \t\n\r]+LOOP[\ \t\n\r]*;/i)) {
            intTabLevel -= 1;
            i = i + (-1) + (strInput.substr(i).match(/^END[\ \t\n\r]+LOOP[\ \t\n\r]*;[\ \t]*/i)[0].length);
            bolLastComment = false;


            strFirst = '\\n\\n' + '(\\t|    )'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            intContextPosition = i + 1;
            arrShortQueries = ['snippets'];
            //console.log(">END IF;|" + intTabLevel + "<");

        // ELSIF
        } else if (int_qs === 0 && strInput.substr(i).match(/^ELSIF\b/i)) {
            intTabLevel -= 1;
            i = i + (-1) + (strInput.substr(i).match(/^ELSIF\b/i)[0].length);
            //console.log(">ELSIF;|" + intTabLevel + "<");

        // Not an END IF, at this point it has to be a BEGIN END
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^END\b/i) && bolWordBreak) {
            intTabLevel -= 1;
            i = i + 2 + (strInput.substr(i + 3, 1) === ' ' ? 1 : 0);
            //console.log(">END|" + intTabLevel + "<");

        // FOUND VACUUM/TRUNCATE/LOCK/ANALYZE
        } else if (int_qs === 0 && strInput.substr(i).match(/^(VACUUM|TRUNCATE|LOCK|ANALYZE)[\n\r\ \t]+/i) && bolWordBreak) {
            i += (strInput.substr(i).match(/^(VACUUM|TRUNCATE|LOCK|ANALYZE)/i)[0].length - 1);

            strFirst = ' ';
            intContextPosition = i + 1;
            arrShortQueries = ['schemasTables'];
            //console.log(">VACUUM/TRUNCATE/LOCK/ANALYZE|" + intTabLevel + "<");

        // Not whitespace
        } else if (int_qs === 0 && !strInput.substr(i).match('^[\n\r\ \t]+')) {

        // Whitespace
        } else if (int_qs === 0 && strInput.substr(i).match('^[\n\r\ \t]+')) {
            //console.log("strInput i>" + strInput.substr(i).match('^[\n\r\ \t]+')[0] + "|" + strInput.substr(i).match('^[\n\r\ \t]+')[0].length + "<");
            i = i + (-1) + (strInput.substr(i).match('^[\n\r\ \t]+')[0].length);
            //console.log(">whitespace|" + intTabLevel + "<");

        // Default is to continue collecting characters
        } else {

        }

        //if we switch contexts, and we are doing a lookahead, and we haven't reached the cursor yet, then cancel the lookahead
        if (bolFinal && intContextPosition !== intFinalContextPosition && i + 1 < intPosition) {
            //console.log('i + 1', i + 1);
            //console.log('intPosition', intPosition);
            //console.log('cancel lookahead');
            bolFinal = false;
        }

        //console.log('check>' + strNextOneChar + '|' + i + '|' + intPosition + '<');
        if (i + 1 >= intPosition && !bolFinal) {//+ 1 so that we don't get the character after the cursor
            break;
        }

        i += 1;
    }

    //console.log('bolFinal', bolFinal);
    if (bolFinal) {
        //console.log('lookahead');
        //console.log('before i', i);
        //console.log('before intContextPosition', intContextPosition);
        //console.log('before arrShortQueries', arrShortQueries);
        //console.log('before strFirst', strFirst);
        i = intFinalI;
        intContextPosition = intFinalContextPosition;
        arrShortQueries = arrFinalShortQueries;
        strFirst = strFinalFirst;

        //console.log('after i', i);
        //console.log('after intContextPosition', intContextPosition);
        //console.log('after arrShortQueries', arrShortQueries);
        //console.log('after strFirst', strFirst);
    }

    //console.log('i', i);
    //console.log('intPosition', intPosition);

    //console.log('Check Distance', i + 2 <= intPosition && !bolFinal);
    if (i + 2 <= intPosition && !bolFinal) {
        return;
    }


    //console.log('intContextPosition>' + intContextPosition + '<');
    //console.log('strFirst>' + strFirst + '<');
    //console.log('Relevant>' + strInput.substr(intContextPosition, strFirst.length) + '<');
    if (strFirst.length > 0) {
        //console.log('strFirst Correct', ! strInput.substring(intContextPosition).match(new RegExp("^" + strFirst)));
        if (! strInput.substring(intContextPosition).match(new RegExp("^" + strFirst))) {
            return;
        } else {
            intContextPosition += strInput.substring(intContextPosition).match(new RegExp("^" + strFirst))[0].length;
        }
    }

    //console.log('autocompleteGlobals.bolSnippets', autocompleteGlobals.bolSnippets);
    //console.log('after intContextPosition', intContextPosition);
    //console.log('intPosition', intPosition);
    strContext = strInput.substring(intContextPosition, intPosition);
    //console.log('strContext', strContext);

    //console.log('intDoubleColon', intDoubleColon);
    //console.log('intContextPosition', intContextPosition);
    //console.log('check strContext.length and intDoubleColon', strContext.length === 0 && intDoubleColon !== intContextPosition);
    //if we haven't typed anything, don't show up the popup, with the exception of ::
    if (strContext.length === 0 && intDoubleColon !== intContextPosition) {
        return;
    }

    // console.log('arrShortQueries', arrShortQueries);
    if (arrShortQueries.indexOf('schemas') > -1) {
        arrQueries.push(autocompleteQuery.schemas);
    } if (arrShortQueries.indexOf('functions') > -1) {
        arrQueries.push(autocompleteQuery.funcSnippets
            .replace(/\{\{ADDITIONALWHERE}\}/gi,
                'AND pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \')))')
        );
    } if (arrShortQueries.indexOf('builtins') > -1) {
        arrQueries.push(autocompleteQuery.builtIns);
    } if (arrShortQueries.indexOf('groups') > -1) {
        arrQueries.push(autocompleteQuery.groups);
    } if (arrShortQueries.indexOf('logins') > -1) {
        arrQueries.push(autocompleteQuery.logins);
    } if (arrShortQueries.indexOf('returnTypes') > -1) {
        arrQueries.push(autocompleteQuery.returnTypes);
    } if (arrShortQueries.indexOf('types') > -1) {
        arrQueries.push(autocompleteQuery.types2);
    } if (arrShortQueries.indexOf('language') > -1) {
        arrQueries.push(autocompleteQuery.language);
    } if (arrShortQueries.indexOf('rules') > -1) {
        arrQueries.push(autocompleteQuery.rules);
    } if (arrShortQueries.indexOf('tablespaces') > -1) {
        arrQueries.push(autocompleteQuery.tablespace);
    } if (arrShortQueries.indexOf('languages') > -1) {
        arrQueries.push(autocompleteQuery.language);
    } if (arrShortQueries.indexOf('snippets') > -1) {
        autocompleteGlobals.bolSnippets = true;
    } if (arrShortQueries.indexOf('variables') > -1/* && bolBody*/) {
        autocompleteGlobals.bolAlpha = true;
    }

    // use the current context for above rules, next rules modify the context
    for (var i = 0, len = arrQueries.length; i < len; i++) {
        //console.log(arrQueries[i]);
        arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), strContext.toLowerCase() + '%');
    }

    var strCopyContext = strContext;

    if (arrShortQueries.indexOf('schemasAll') > -1
        || arrShortQueries.indexOf('schemasAggregates') > -1
        || arrShortQueries.indexOf('schemasConversions') > -1
        || arrShortQueries.indexOf('schemasConstraints') > -1
        || arrShortQueries.indexOf('schemasCollations') > -1
        || arrShortQueries.indexOf('schemasTables') > -1
        || arrShortQueries.indexOf('schemasTablesOnly') > -1
        || arrShortQueries.indexOf('schemasViewsOnly') > -1
        || arrShortQueries.indexOf('schemasMaterializedViews') > -1
        || arrShortQueries.indexOf('schemasFunctions') > -1
        || arrShortQueries.indexOf('schemasSequences') > -1
        || arrShortQueries.indexOf('schemasTypes') > -1
        || arrShortQueries.indexOf('schemasDomains') > -1
        || arrShortQueries.indexOf('schemasOperators') > -1
        || arrShortQueries.indexOf('schemasForeignTables') > -1
        || arrShortQueries.indexOf('schemasIndexes') > -1
        || arrShortQueries.indexOf('schemasOperatorClasses') > -1
        || arrShortQueries.indexOf('schemasOperatorFamilies') > -1
        || arrShortQueries.indexOf('schemasTextSearchConfigurations') > -1
        || arrShortQueries.indexOf('schemasTextSearchDictionaries') > -1
        || arrShortQueries.indexOf('schemasTextSearchParsers') > -1
        || arrShortQueries.indexOf('schemasTextSearchTemplates') > -1) {
        //console.log('arrShortQueries', arrShortQueries);
        //console.log('before strContext', strContext);
        if (strContext.match(/^.*\./)) {
            var arrMatches = strContext.match(/^(.*)\.([^.]*)/);
            var strSchema = arrMatches[1];
            strContext = arrMatches[2];

            autocompleteGlobals.bolAlpha = false;

            //console.log('strSchema', strSchema);
            //console.log('after strContext', strContext);

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasAggregates') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_aggregates
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasConversions') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_conversions
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasConstraints') > -1) {
                arrQueries.push(
                    autocompleteQuery.constraints
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasCollations') > -1) {
                arrQueries.push(
                    autocompleteQuery.collations
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTables') > -1
                || arrShortQueries.indexOf('schemasTablesOnly') > -1) {
                arrQueries.push(
                    autocompleteQuery.tables
                        .replace(/\{\{CATALOG}\}/gi, '-1')
                        .replace(/\{\{TOAST}\}/gi, '-1')
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTables') > -1
                || arrShortQueries.indexOf('schemasViewsOnly') > -1) {
                arrQueries.push(
                    autocompleteQuery.views
                        .replace(/\{\{CATALOG}\}/gi, '-1')
                        .replace(/\{\{TOAST}\}/gi, '-1')
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }

            if (arrShortQueries.indexOf('schemasMaterializedViews') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_materialized_views
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasFunctions') > -1) {
                arrQueries.push(
                    autocompleteQuery.funcSnippets
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasSetFunctions') > -1) {
                arrQueries.push(
                    autocompleteQuery.funcSnippets
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND proretset AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasSequences') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_sequences
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTypes') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_types
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasDomains') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_domains
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasOperators') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_operators
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasForeignTables') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_foreign_tables
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasIndexes') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_indexes
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasOperatorClasses') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_operator_classes
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasOperatorFamilies') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_operator_families
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTextSearchConfigurations') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_text_search_configurations
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTextSearchDictionaries') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_text_search_dictionaries
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTextSearchParsers') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_text_search_parsers
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
            if (arrShortQueries.indexOf('schemasAll') > -1
                || arrShortQueries.indexOf('schemasTextSearchTemplates') > -1) {
                arrQueries.push(
                    autocompleteQuery.qualified_text_search_templates
                        .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND (pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                            + ' OR pg_namespace.nspname IN (SELECT unnest(string_to_array(current_setting(\'search_path\'), \', \'))))')
                );
            }
        } else {
            arrQueries.push(autocompleteQuery.schemas);
        }
    } if (arrShortQueries.indexOf('contextColumns') > -1) {
        var i, len;
        for (i = 0, len = autocompleteGlobals.arrStrContext.length; i < len; i++) {
            arrQueries.push(
                autocompleteQuery.columns
                    .replace(/\{\{ADDITIONALWHERE}\}/gi,
                        ' AND pg_namespace.nspname = $SCHEMATOKEN$' + autocompleteGlobals.arrStrContext[i][0] + '$SCHEMATOKEN$' +
                        ' AND pg_class.relname = $TABLETOKEN$' + autocompleteGlobals.arrStrContext[i][1] + '$TABLETOKEN$')
            );
        }
    } if (arrShortQueries.indexOf('contextTablesColumns') > -1) {
        //console.log('arrShortQueries', arrShortQueries);
        //console.log('before strContext', strContext);
        //console.log('before strCopyContext', strCopyContext);

        var strSchema = '';
        var strTable = '';

        strContext = strCopyContext;

        if (strContext.match(/^.*\..*\./)) {
            var arrMatches = strContext.match(/^(.*)\.(.*)\.([^.]*)/);
            strSchema = arrMatches[1];
            strTable = arrMatches[2];
            strContext = arrMatches[3];

            autocompleteGlobals.bolAlpha = false;

            //console.log('strSchema', strSchema);
            //console.log('strTable', strTable);
            //console.log('after strContext', strContext);
        } else if (strContext.match(/^.*\..*/)) {
            var arrMatches = strContext.match(/^(.*)\.([^.]*)/);
            strTable = arrMatches[1];
            strContext = arrMatches[2];

            autocompleteGlobals.bolAlpha = false;

            //console.log('strTable', strTable);
            //console.log('after strContext', strContext);
        }

        //console.log('autocompleteGlobals.arrStrContext', autocompleteGlobals.arrStrContext);
        var i, len;
        for (i = 0, len = autocompleteGlobals.arrStrContext.length; i < len; i++) {
            //console.log(i + ' test1' + (autocompleteGlobals.arrStrContext[i][0] === strSchema && strSchema !== ''));
            //console.log(i + ' test2' + (autocompleteGlobals.arrStrContext[i][1] === strTable && strTable !== ''));
            //console.log(i + ' test3' + (autocompleteGlobals.arrStrContext[i][2] === strTable && autocompleteGlobals.arrStrContext[i][2] !== ''));
            if ((autocompleteGlobals.arrStrContext[i][0] === strSchema && strSchema !== '')
                || (autocompleteGlobals.arrStrContext[i][1] === strTable && strTable !== '')
                || (autocompleteGlobals.arrStrContext[i][2] === strTable && autocompleteGlobals.arrStrContext[i][2] !== '')
                || (strSchema === '' && strTable === '')) {
                //console.log('i ' + i + ' pass');
                arrQueries.push(
                    autocompleteQuery.columns
                        .replace(/\{\{ADDITIONALWHERE}\}/gi,
                            (autocompleteGlobals.arrStrContext[i][0] !== ''
                                ? ' AND pg_namespace.nspname = $SCHEMATOKEN$' + autocompleteGlobals.arrStrContext[i][0] + '$SCHEMATOKEN$'
                                : '')
                            + (autocompleteGlobals.arrStrContext[i][1] !== ''
                                ? ' AND pg_class.relname = $TABLETOKEN$' + autocompleteGlobals.arrStrContext[i][1] + '$TABLETOKEN$'
                                : ''))
                );
            }
            if (strTable === '' && autocompleteGlobals.arrStrContext[i][2] !== '') {
                arrQueries.push(ml(function () {/*SELECT $STRINGTOKEN${{STRING}}$STRINGTOKEN$ AS obj_name, 'special_table' AS obj_meta*/})
                    .replace(/\{\{STRING}\}/gi, autocompleteGlobals.arrStrContext[i][2]));
            }
            if (strTable === '' && autocompleteGlobals.arrStrContext[i][0] !== ''
                && autocompleteGlobals.arrStrContext[i][1] !== '' && autocompleteGlobals.arrStrContext[i][2] === '') {
                arrQueries.push(ml(function () {/*SELECT $STRINGTOKEN${{STRING}}$STRINGTOKEN$ AS obj_name, 'special_table' AS obj_meta*/})
                    .replace(/\{\{STRING}\}/gi, autocompleteGlobals.arrStrContext[i][0] + '.'
                    + autocompleteGlobals.arrStrContext[i][1]));
            }
            if (strTable === '' && autocompleteGlobals.arrStrContext[i][1] !== '' && autocompleteGlobals.arrStrContext[i][2] === '') {
                arrQueries.push(ml(function () {/*SELECT $STRINGTOKEN${{STRING}}$STRINGTOKEN$ AS obj_name, 'special_table' AS obj_meta*/})
                    .replace(/\{\{STRING}\}/gi, autocompleteGlobals.arrStrContext[i][1]));
            }
        }
    } if (arrShortQueries.indexOf('schemasTablesColumns') > -1) {
        //console.log('arrShortQueries', arrShortQueries);
        //console.log('before strContext', strContext);
        //console.log('before strCopyContext', strCopyContext);

        var strSchema = '';
        var strTable = '';

        strContext = strCopyContext;

        if (strContext.match(/^.*\..*\./)) {
            var arrMatches = strContext.match(/^(.*)\.(.*)\.([^.]*)/);
            strSchema = arrMatches[1];
            strTable = arrMatches[2];
            strContext = arrMatches[3];

            autocompleteGlobals.bolAlpha = false;

            //console.log('strSchema', strSchema);
            //console.log('strTable', strTable);
            //console.log('after strContext', strContext);

            arrQueries.push(
                autocompleteQuery.columns
                    .replace(/\{\{ADDITIONALWHERE}\}/gi,
                        ' AND pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$'
                        + ' AND pg_class.relname = $TABLETOKEN$' + strTable + '$TABLETOKEN$'
                        )
            );

        } else if (strContext.match(/^.*\..*/)) {
            var arrMatches = strContext.match(/^(.*)\.([^.]*)/);
            strSchema = arrMatches[1];
            strContext = arrMatches[2];

            autocompleteGlobals.bolAlpha = false;

            //console.log('strSchema', strSchema);
            //console.log('after strContext', strContext);

            arrQueries.push(
                autocompleteQuery.tables
                    .replace(/\{\{CATALOG}\}/gi, '-1')
                    .replace(/\{\{TOAST}\}/gi, '-1')
                    .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$')
            );

            arrQueries.push(
                autocompleteQuery.views
                    .replace(/\{\{CATALOG}\}/gi, '-1')
                    .replace(/\{\{TOAST}\}/gi, '-1')
                    .replace(/\{\{ADDITIONALWHERE}\}/gi, 'AND pg_namespace.nspname = $SCHEMATOKEN$' + strSchema + '$SCHEMATOKEN$')
            );

        } else {
            arrQueries.push(autocompleteQuery.schemas);
        }
    }

    // use the updated context for remaining rules, remaining rules modify the context
    for (var i = 0, len = arrQueries.length; i < len; i++) {
        //console.log(arrQueries[i]);
        arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), strContext.toLowerCase() + '%');
    }

    //console.log('check queries', arrQueries.length === 0 && autocompleteGlobals.bolSnippets === false);
    if (arrQueries.length === 0 && autocompleteGlobals.bolSnippets === false) {
        return;
    }

    var objContext = {
        'strContext': strContext
        , 'arrQueries': arrQueries
        , 'searchLength': strContext.length
        , 'intContextPosition': intContextPosition
    };

    //console.log('objContext', objContext);

    return objContext;
}

function autocompleteLoadTypes() {
    'use strict';
    var strQuery = ml(function () {/*
            SELECT string_agg(pg_type.typname, ',')
              FROM pg_catalog.pg_type
             WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
               AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
               AND (pg_type.typtype <> 'd')
    */});

    autocompleteGlobals.bolQueryRunning = true;
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;

        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');

                autocompleteGlobals.arrTypes = GS.decodeFromTabDelimited(arrRows[0]).split(',');
            }
        } else {
            GS.webSocketErrorDialog(data);
        }
        autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
    });
}

function autocompleteLoadKeywords() {
    'use strict';
                    // ROW #1: "C": unreserved (cannot be function or type name)
                    // ROW #2: "R": reserved
                    // ROW #3: "T": reserved (can be function or type name)
                    // ROW #4: "U": unreserved
    var strQuery = ml(function () {/*
            SELECT string_agg(word, ',')
              FROM pg_catalog.pg_get_keywords()
          GROUP BY catcode
          ORDER BY catcode
    */});

    autocompleteGlobals.bolQueryRunning = true;
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;

        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');

                autocompleteGlobals.jsnKeywords.c = GS.decodeFromTabDelimited(arrRows[0] || '').split(',');
                autocompleteGlobals.jsnKeywords.c.desc = 'unreserved but cannot be the name of a FUNCTION or TYPE';

                autocompleteGlobals.jsnKeywords.r = GS.decodeFromTabDelimited(arrRows[1] || '').split(',');
                autocompleteGlobals.jsnKeywords.r.desc = 'reserved';

                autocompleteGlobals.jsnKeywords.t = GS.decodeFromTabDelimited(arrRows[2] || '').split(',');
                autocompleteGlobals.jsnKeywords.t.desc = 'reserved but can be the name of a FUNCTION or TYPE)';

                autocompleteGlobals.jsnKeywords.u = GS.decodeFromTabDelimited(arrRows[3] || '').split(',');
                autocompleteGlobals.jsnKeywords.u.desc = 'unreserved';

                // prevent any of these arrays from only containing empty string
                if (
                    autocompleteGlobals.jsnKeywords.c &&
                    autocompleteGlobals.jsnKeywords.c[0] === '' &&
                    autocompleteGlobals.jsnKeywords.c.length === 1
                ) {
                    autocompleteGlobals.jsnKeywords.c = [];
                }
                if (
                    autocompleteGlobals.jsnKeywords.r &&
                    autocompleteGlobals.jsnKeywords.r[0] === '' &&
                    autocompleteGlobals.jsnKeywords.r.length === 1
                ) {
                    autocompleteGlobals.jsnKeywords.r = [];
                }
                if (
                    autocompleteGlobals.jsnKeywords.t &&
                    autocompleteGlobals.jsnKeywords.t[0] === '' &&
                    autocompleteGlobals.jsnKeywords.t.length === 1
                ) {
                    autocompleteGlobals.jsnKeywords.t = [];
                }
                if (
                    autocompleteGlobals.jsnKeywords.u &&
                    autocompleteGlobals.jsnKeywords.u[0] === '' &&
                    autocompleteGlobals.jsnKeywords.u.length === 1
                ) {
                    autocompleteGlobals.jsnKeywords.u = [];
                }

                autocompleteGlobals.jsnKeywords.all = [];
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.c);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.r);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.t);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.u);
            }
        } else {
            GS.webSocketErrorDialog(data);
        }
        autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
    });
}

function autocompleteGetObjectType(strName, arrQueries, callback, schemaOID) {
    'use strict';
    var strQuery, arrResults = [], i, len;

    // normailize name
    strName = GS.trim(strName.trim(), '"');

    // loop through array of queries
    for (i = 0, len = arrQueries.length; i < len; i += 1) {
        arrQueries[i] = arrQueries[i].replace(/\{\{NAME\}\}/gi, strName);

        // if schemaOID has a value: schema qualify the query
        if (schemaOID) {
            arrQueries[i] = arrQueries[i].replace(/\{\{ADDITIONALWHERE\}\}/gi, 'AND pg_namespace.oid = ' + schemaOID);
        } else {
            arrQueries[i] = arrQueries[i].replace(/\{\{ADDITIONALWHERE\}\}/gi, '');
        }
    }

    // join array into a query
    strQuery =  'SELECT * FROM (\n' +
                    arrQueries.join('\n     UNION ALL\n') + '\n' +
                ') em;';

    //autocompleteGlobals.bolQueryRunning = true;
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;

        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');

                for (i = 0, len = arrRows.length; i < len; i += 1) {
                    arrRows[i] = arrRows[i].split('\t');
                    arrRows[i][1] = GS.decodeFromTabDelimited(arrRows[i][1]);

                    arrResults.push(arrRows[i]);
                }

            } else if (data.strMessage === '\\.') {
                callback(arrResults);
            }
        }// else {
        //    GS.webSocketErrorDialog(data);
        //}
        //autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
    });
}
