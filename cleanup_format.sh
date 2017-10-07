#!/usr/bin/env bash

clang-format -style="{BasedOnStyle: llvm, IndentWidth: 4, AllowShortFunctionsOnASingleLine: None, "\
"KeepEmptyLinesAtTheStartOfBlocks: false, ColumnLimit: 130, UseTab: Always, "\
"AlignAfterOpenBracket: false, ContinuationIndentWidth: 4, TabWidth: 4, IndentCaseLabels: true}" \
	-i envelope/*.{c,h} pgmanage/*.{c,h} db_framework_pq/*.{c,h} db_framework_odbc/*.{c,h} util/*.{c,h} common/*.{c,h}
#tidy -m web_root/*/*.html web_root/*/*/*.html web_root/*/*/*/*.html

#clang-tidy -fix \
#    -fix-errors \
#    -header-filter=.* \
#    --checks=readability-braces-around-statements,misc-macro-parentheses \
#    src/*.{c,h} src/util/*.{c,h} \
#    -- -I.
