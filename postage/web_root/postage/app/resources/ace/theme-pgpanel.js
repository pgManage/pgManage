var pgPanelCSSText = ml(function () {/*
    .ace-pgpanel .ace_gutter {
        background: #ebebeb;
        color: #333
    }
    .ace-pgpanel .ace_print-margin {
        width: 1px;
        background: #e8e8e8
    }
    .ace-pgpanel {
        background-color: #FFFFFF;
        color: #000000
    }
    .ace-pgpanel .ace_cursor {
        color: #000000
    }
    .ace-pgpanel .ace_marker-layer .ace_selection {
        background: #BDD5FC
    }
    .ace-pgpanel.ace_multiselect .ace_selection.ace_start {
        box-shadow: 0 0 3px 0px #FFFFFF;
    }
    .ace-pgpanel .ace_marker-layer .ace_step {
        background: rgb(255, 255, 0)
    }
    .ace-pgpanel .ace_marker-layer .ace_bracket {
        margin: -1px 0 0 -1px;
        border: 1px solid #BFBFBF
    }
    .ace-pgpanel .ace_marker-layer .ace_active-line {
        background: #FFFBD1
    }
    .ace-pgpanel .ace_gutter-active-line {
        background-color: #dcdcdc
    }
    .ace-pgpanel .ace_marker-layer .ace_selected-word {
        border: 1px solid #BDD5FC
    }
    .ace-pgpanel .ace_invisible {
        color: #BFBFBF
    }
    .ace-pgpanel .ace_keyword,
    .ace-pgpanel .ace_meta,
    .ace-pgpanel .ace_support.ace_constant.ace_property-value {
        color: #AF956F
    }
    .ace-pgpanel .ace_keyword.ace_operator {
        color: #484848
    }
    .ace-pgpanel .ace_keyword.ace_other.ace_unit {
        color: #96DC5F
    }
    .ace-pgpanel .ace_constant.ace_language {
        color: #39946A
    }
    .ace-pgpanel .ace_constant.ace_character.ace_entity {
        color: #BF78CC
    }
    .ace-pgpanel .ace_invalid {
        background-color: #FF002A
    }
    .ace-pgpanel .ace_fold {
        background-color: #AF956F;
        border-color: #000000
    }
    .ace-pgpanel .ace_storage,
    .ace-pgpanel .ace_support.ace_class,
    .ace-pgpanel .ace_support.ace_function,
    .ace-pgpanel .ace_support.ace_other,
    .ace-pgpanel .ace_support.ace_type {
        color: #C52727
    }
    .ace-pgpanel .ace_string {
        color: #5D90CD
    }
    .ace-pgpanel .ace_comment {
        color: #BCC8BA
    }
    .ace-pgpanel .ace_entity.ace_name.ace_tag,
    .ace-pgpanel .ace_entity.ace_other.ace_attribute-name {
        color: #606060
    }
    .ace-pgpanel .ace_indent-guide {
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==") right repeat-y
    }
    
    .ace-pgpanel .ace_bullet { color: #000; }
    .ace-pgpanel .ace_arrowdown { color: #000; font-size: 1em;}
    .ace-pgpanel .ace_arrowright { color: #000; font-size: 0.8em;}
    
    .ace-pgpanel .ace_ag,
    .ace-pgpanel .ace_cl,
    .ace-pgpanel .ace_cn,
    .ace-pgpanel .ace_do,
    .ace-pgpanel .ace_ft,
    .ace-pgpanel .ace_tc,
    .ace-pgpanel .ace_td,
    .ace-pgpanel .ace_tp,
    .ace-pgpanel .ace_tt,
    .ace-pgpanel .ace_fn,
    .ace-pgpanel .ace_in,
    .ace-pgpanel .ace_op,
    .ace-pgpanel .ace_oc,
    .ace-pgpanel .ace_of,
    .ace-pgpanel .ace_sq,
    .ace-pgpanel .ace_tb,
    .ace-pgpanel .ace_tf,
    .ace-pgpanel .ace_ty,
    .ace-pgpanel .ace_vw {
        font-size: 0.75em;
        font-weight: 900;
    }
    
    .ace-pgpanel .ace_ag { color: #CF4F19; }
    .ace-pgpanel .ace_cl { color: #8A3F00; }
    .ace-pgpanel .ace_cn { color: #6F003D; }
    .ace-pgpanel .ace_do { color: #3F055C; }
    .ace-pgpanel .ace_ft { color: #CB0073; }
    .ace-pgpanel .ace_tc { color: #2D2390; }
    .ace-pgpanel .ace_td { color: #20338D; }
    .ace-pgpanel .ace_tp { color: #1B4689; }
    .ace-pgpanel .ace_tt { color: #175984; }
    .ace-pgpanel .ace_fn { color: #4fb977; }
    .ace-pgpanel .ace_in { color: #819C00; }
    .ace-pgpanel .ace_op { color: #000000; }
    .ace-pgpanel .ace_oc { color: #888888; }
    .ace-pgpanel .ace_of { color: #AAAAAA; }
    .ace-pgpanel .ace_sq { color: #FE4F00; }
    .ace-pgpanel .ace_tb { color: #8A0000; }
    .ace-pgpanel .ace_tf { color: #CA3C4D; }
    .ace-pgpanel .ace_ty { color: #9200A9; }
    .ace-pgpanel .ace_vw { color: #006E00; }
*/});

/*

    .ace-pgpanel .ace_constant.ace_numeric {
        color: #46A609
    }

    AG  ag  Aggregates
    CL  cl  Collations
    CN  cn  Conversions
    DO  do  Domains
    FT  ft  Foreign Tables
    TC  tc  TS Configurations
    TD  td  TS Dictionaries
    TP  tp  TS Parsers
    TT  tt  TS Templates
    FN  fn  Functions
    IN  in  Indexes
    OP  op  Operators
    OC  oc  Operator Classes
    OF  of  Operator Families
    SQ  sq  Sequences
    TB  tb  Tables
    TF  tf  Trigger Functions
    TY  ty  Types
    VW  vw  Views
*/

define("ace/theme/pgpanel",["require","exports","module","ace/lib/dom"],function(e,t,n){t.isDark=!1,t.cssClass="ace-pgpanel",t.cssText=pgPanelCSSText;var r=e("../lib/dom");r.importCssString(t.cssText,t.cssClass)});