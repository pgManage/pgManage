#include "split.h"


static void sql_split_test( char * str_test, char * str_1, char * str_2 ) {

  char  **sq_1 = sql_split(str_test);
  if ( strcmp( sq_1[0], str_1) == 0 && strcmp( sq_1[1], str_2) == 0 ) {
    sunlogf("PASS: %s", str_test);

  } else {
    sunlogf("FAIL: %s", str_test);
    sunlogf("  Received: %s // %s", sq_1[0], sq_1[1] );
    sunlogf("  Expected: %s // %s", str_1, str_2);
  
  }
  
  free(sq_1[2]);
  free(sq_1[1]);
  free(sq_1[0]);
  free(sq_1);

}


int main() {
  
  sunlogf("CHECKING SINGLE QUOTES");
  // check that single quotes work
  sql_split_test( "SELECT sql.untaint('test;'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test;');", "SELECT sql.untaint('test;');" );
  // check that single quotes work with wide chars
  sql_split_test( "SELECT sql.untaint('testÃ Â¾Â ;'); SELECT sql.untaint('test;');", "SELECT sql.untaint('testÃ Â¾Â ;');", "SELECT sql.untaint('test;');" );
  // check that single quotes ignore slashed single quote
  sql_split_test( "SELECT sql.untaint('test\\';'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test\\';');", "SELECT sql.untaint('test;');" );
  // check that single quotes ignore slashed dbl quote
  sql_split_test( "SELECT sql.untaint('test\\\";'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test\\\";');", "SELECT sql.untaint('test;');" );
  // check that single quotes ignore dollar signs 
  sql_split_test( "SELECT sql.untaint('test$;'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test$;');", "SELECT sql.untaint('test;');" );
  // check that single quotes ignore dash comment 
  sql_split_test( "SELECT sql.untaint('test--;'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test--;');", "SELECT sql.untaint('test;');" );
  // check that single quotes ignore multiline comments 
  sql_split_test( "SELECT sql.untaint('test/*;'); SELECT sql.untaint('test;');", "SELECT sql.untaint('test/*;');", "SELECT sql.untaint('test;');" );


  sunlogf("CHECKING DOLLAR TAGS");
  sql_split_test( "SELECT sql.untaint($$test;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags work with wide chars
  sql_split_test( "SELECT sql.untaint($$testÃ Â¾Â ;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$testÃ Â¾Â ;$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags exclude non-matching dollar signs
  sql_split_test( "SELECT sql.untaint($$test$;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test$;$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $a$ tags exclude non-matching dollar signs (extra semicolons)
  sql_split_test( "SELECT sql.untaint($$test;;$aa;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test;;$aa;$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags exclude single quote
  sql_split_test( "SELECT sql.untaint($$test';$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test';$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags exclude backslash single quote
  sql_split_test( "SELECT sql.untaint($$test\';$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test\';$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags exclude dbl quote
  sql_split_test( "SELECT sql.untaint($$test\";$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test\";$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags interprets slashes as normal chars: SELECT $$\$$;
  sql_split_test( "SELECT sql.untaint($$test;\\$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test;\\$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags ignores single quotes: SELECT $$\$$;
  sql_split_test( "SELECT sql.untaint($$test--;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test--;$$);", "SELECT sql.untaint($$test;$$);" );
  // check that $$ tags ignores double quotes: SELECT $$\$$;
  sql_split_test( "SELECT sql.untaint($$test/*;$$); SELECT sql.untaint($$test;$$);", "SELECT sql.untaint($$test/*;$$);", "SELECT sql.untaint($$test;$$);" );
  
  sunlogf("CHECKING NAMED TAGS");
  sql_split_test( "SELECT sql.untaint($a$test;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags work with wide chars
  sql_split_test( "SELECT sql.untaint($a$testÃ Â¾Â ;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$testÃ Â¾Â ;$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags exclude non-matching dollar signs
  sql_split_test( "SELECT sql.untaint($a$test$;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test$;$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags exclude non-matching dollar signs (extra semicolons)
  sql_split_test( "SELECT sql.untaint($a$test;;$aa;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test;;$aa;$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags exclude single quote
  sql_split_test( "SELECT sql.untaint($a$test';$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test';$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags exclude dbl quote
  sql_split_test( "SELECT sql.untaint($a$test\";$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test\";$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags interprets slashes as normal chars: SELECT $a$\$;
  sql_split_test( "SELECT sql.untaint($a$test\\$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test\\$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags ignores dash comments
  sql_split_test( "SELECT sql.untaint($a$test--;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test--;$a$);", "SELECT sql.untaint($a$test;$a$);" );
  // check that $a$ tags ignores multiline comments
  sql_split_test( "SELECT sql.untaint($a$test/*;$a$); SELECT sql.untaint($a$test;$a$);", "SELECT sql.untaint($a$test/*;$a$);", "SELECT sql.untaint($a$test;$a$);" );

  sunlogf("CHECKING DOUBLE QUOTES");
  // check that dbl quotes work: SELECT "text_example" FROM wfp.aatest;
  sql_split_test( "SELECT sql.untaint(\"test;\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test;\");" );
  // Anything goes within dbl quotes...
  // check that dbl quotes doesn't choke on wide chars: ALTER TABLE wfp.aatest ADD COLUMN "wegbÃ Â¾Â " text; SELECT chr(4000)
  sql_split_test( "SELECT sql.untaint(\"testÃ Â¾Â ;Ã Â¾Â \"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"testÃ Â¾Â ;Ã Â¾Â \");", "SELECT sql.untaint(\"test;\");" );
  // check that dbl quotes interprets slashes as normal chars: ALTER TABLE wfp.aatest ADD COLUMN "wegb\" text;
  //   a slash would normally cause next character (dbl quote) to be ignored.
  sql_split_test( "SELECT sql.untaint(\"test;\\\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test;\\\");", "SELECT sql.untaint(\"test;\");" );
  // check that dbl quotes interprets dollar signs as normal chars
  sql_split_test( "SELECT sql.untaint(\"test$;\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test$;\");", "SELECT sql.untaint(\"test;\");" );
  // check that dbl quotes interprets single quotes as normal chars
  sql_split_test( "SELECT sql.untaint(\"test';\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test';\");", "SELECT sql.untaint(\"test;\");" );
  // check that dbl quotes ignores dash comments
  sql_split_test( "SELECT sql.untaint(\"test--;\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test--;\");", "SELECT sql.untaint(\"test;\");" );
  // check that dbl quotes ignores multiline comments
  sql_split_test( "SELECT sql.untaint(\"test/*;\"); SELECT sql.untaint(\"test;\");", "SELECT sql.untaint(\"test/*;\");", "SELECT sql.untaint(\"test;\");" );

  sunlogf("CHECKING NO QUOTES");
  // check that no quotes interprets single dollar as normal character if followed by other than [a-z0-9A-Z_]
  sql_split_test( "SELECT sql.untaint($a$test;$a$)$; SELECT sql.untaint($a$test;$a$\");", "SELECT sql.untaint($a$test;$a$)$;", "SELECT sql.untaint($a$test;$a$\");" ); 

  sunlogf("CHECKING COMMENTS");
  // check that multiline comments ignore everything
  sql_split_test( "/*SELECT sql.untaint();\\*/ SELECT sql.untaint(); SELECT current_date;", "/*SELECT sql.untaint();\\*/ SELECT sql.untaint();", "SELECT current_date;" ); 
  // check that dash comments ignore everything but \n
  sql_split_test( "--SELECT sql.untaint();\n SELECT sql.untaint(); SELECT current_date;", "--SELECT sql.untaint();\n SELECT sql.untaint();", "SELECT current_date;" ); 
  
  sunlogf("###");
  // check that dash comments ignore everything but \r
  sql_split_test( "--SELECT sql.untaint();\r\n SELECT sql.untaint(); SELECT current_date;", "--SELECT sql.untaint();\r\n SELECT sql.untaint();", "SELECT current_date;" );   
  
  
  char  **sq_1 = sql_split("CREATE SCHEMA test \
  AUTHORIZATION pgsql;    \
\
COMMENT ON SCHEMA test\
  IS 'this is a test';\
\
GRANT ALL ON SCHEMA test TO pgsql;            \
\
GRANT ALL ON SCHEMA \"test\" TO \"public_user\";       ");

  char  **sq_2 = sql_split("CREATE SCHEMA test \
  AUTHORIZATION pgsql;\
\
COMMENT ON SCHEMA test\
  IS 'this is a test';\
\
GRANT ALL ON SCHEMA test TO pgsql;\
\
GRANT ALL ON SCHEMA \"test\" TO \"public_user\";       ");
  printf("0:%s\n", sq_1[0]);
  printf("1:%s\n", sq_1[1]);
  printf("2:%s\n", sq_1[2]);
  printf("3:%s\n", sq_1[3]);
  printf("4:%s\n", sq_1[4]);
  if ( sq_1[4] == 0 ) {
    printf("zero\n");
  }else {
    printf("not zero\n");
  }

  printf("0:%s\n", sq_2[0]);
  printf("1:%s\n", sq_2[1]);
  printf("2:%s\n", sq_2[2]);
  printf("3:%s\n", sq_2[3]);
  printf("4:%s\n", sq_2[4]);
  if ( sq_2[4] == 0 ) {
    printf("zero\n");
  }else {
    printf("not zero\n");
  }
  
    
  free(sq_1[0]);
  free(sq_1[1]);
  free(sq_1[2]);
  free(sq_1[3]);
  free(sq_1[4]);
  free(sq_1);
  
  free(sq_2[0]);
  free(sq_2[1]);
  free(sq_2[2]);
  free(sq_2[3]);
  free(sq_2[4]);
  free(sq_2);

  return 1;
}

