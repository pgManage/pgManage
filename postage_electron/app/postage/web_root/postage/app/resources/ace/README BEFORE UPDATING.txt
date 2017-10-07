
there is a file that we made for the postgres panel highlighting, mode-pgpanel.js DONT DELETE IT
~michael

there is a file that we made for the postgres panel highlighting theme, theme-pgpanel.js DONT DELETE IT
~michael

/ext-language_tools.js has a change for custom snippets (the non-minified code)



mode-pgsql change {token:"keyword.statementBegin",regex:"^[a-zA-Z]+",next:"statement"} to {token:"keyword.statementBegin",regex:"[a-zA-Z]+",next:"statement"}
mode-pgsql change to


statement:[{token:"comment",regex:"--.*$"},{token:"comment",regex:"\\/\\*",next:"commentStatement"},{token:"statementEnd",regex:";",next:"start"},{token:"string",regex:"\\$perl\\$",next:"perl-start"},{token:"string",regex:"\\$python\\$",next:"python-start"},{token:"string",regex:"\\$json\\$",next:"json-start"},{token:"string",regex:"\\$(js|javascript)\\$",next:"javascript-start"},{token:"string",regex:"\\$(?!.*BODY)[\\w_0-9]*\\$$",next:"dollarSql"},{token:"string",regex:"\\$(?=.*BODY)[\\w_0-9]*\\$$",next:"dollarSql"},{token:"string",regex:"\\$[\\w_0-9]*\\$",next:"dollarStatementString"}].concat(r),dollarSql:[{token:"comment",regex:"--.*$"},{token:"comment",regex:"\\/\\*",next:"commentDollarSql"},{token:"string",regex:"^\\$[\\w_0-9]*\\$",next:"statement"},{token:"string",regex:"\\$(?!.*BODY)[\\w_0-9]*\\$$",next:"dollarSql"},{token:"string",regex:"\\$[\\w_0-9]*\\$",next:"dollarSqlString"}].concat(r),comment:[{token:"comment",regex:".*?\\*\\/",next:"start"},{token:"comment",regex:".+"}],commentStatement:[{token:"comment",regex:".*?\\*\\/",next:"statement"},{token:"comment",regex:".+"}],commentDollarSql:[{token:"comment",regex:".*?\\*\\/",next:"dollarSql"},{token:"comment",regex:".+"}],dollarStatementString:[{token:"string",regex:".*?\\$[\\w_0-9]*\\$",next:"statement"},{token:"string",regex:".+"}],dollarSqlString:[{token:"string",regex:".*?\\$[\\w_0-9]*\\$",next:"dollarSql"},{token:"string",regex:".+"}]},this.embedRules(s,"doc-",[s.getEndRule("start")]),this.embedRules(u,"perl-",[{token:"string",regex:"\\$perl\\$",next:"statement"}]),this.embedRules(a,"python-",[{token:"string",regex:"\\$python\\$",next:"statement"}]),this.embedRules(f,"json-",[{token:"string",regex:"\\$json\\$",next:"statement"}]),this.embedRules(l,"javascript-",[{token:"string",regex:"\\$(js|javascript)\\$",next:"statement"}])};r.inherits(c,o),t.PgsqlHighlightRules=c}),define("ace/mode/pgsql",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/pgsql_highlight_rules","ace/range"],function(e,t,n){var r=e("../lib/oop"),i=e("../mode/text").Mode,s=e("./pgsql_highlight_rules").PgsqlHighlightRules,o=e("../range").Range,u=function(){this.HighlightRules=s};r.inherits(u,i),function(){this.lineCommentStart="--",this.blockComment={start:"/*",end:"*/"},this.getNextLineIndent=function(e,t,n){return e=="start"||e=="keyword.statementEnd"?"":this.$getIndent(t)},this.$id="ace/mode/pgsql"}.call(u.prototype),t.Mode=u})
