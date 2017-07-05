
there is a file that we made for the postgres panel highlighting, mode-pgpanel.js DONT DELETE IT
~michael

there is a file that we made for the postgres panel highlighting theme, theme-pgpanel.js DONT DELETE IT
~michael

/ext-language_tools.js has a change for custom snippets (the non-minified code)


mode-pgsql change {token:"string",regex:"\\$[\\w_0-9]*\\$$",next:"dollarsql"} to {token:"string",regex:"\\$[\\w_0-9]*\\$$",next:"statement"}
