
    b-humancells — clientside table sorter and filterer for HTML tables



    Goods:

    — no external libraries required (pure JavaScript);
    — no AJAX;
    — simple syntax;
    — virtual columns and rows support;
    — columns sorting;
    — columns filtering;
    — formulas usage for columns totals;
    — templates usage for totals values.



    Requirements:

    — JavaScript.



    Code example:

    <code>
        <div class="b-humancells">
            <link rel="stylesheet" href="b-humancells/b-humancells.css">

            <table class="b-humancells__body">
                <tr class="b-humancells__row">
                    <td class="b-humancells__cell">First</td>
                    <td class="b-humancells__cell">Second</td>
                    <td class="b-humancells__cell">Third</td>
                </tr>
                <tr class="b-humancells__row">
                    <td class="b-humancells__cell">Some text</td>
                    <td class="b-humancells__cell">2</td>
                    <td class="b-humancells__cell">3</td>
                </tr>
                <tr class="b-humancells__row">
                    <td class="b-humancells__cell">Some text</td>
                    <td class="b-humancells__cell">2</td>
                    <td class="b-humancells__cell">3</td>
                </tr>
                <tr class="b-humancells__row">
                    <td class="b-humancells__cell">Yet another string</td>
                    <td class="b-humancells__cell">2</td>
                    <td class="b-humancells__cell">3</td>
                </tr>
                <tr class="b-humancells__row">
                    <td class="b-humancells__cell">Yet another string</td>
                    <td class="b-humancells__cell">2</td>
                    <td class="b-humancells__cell">3</td>
                </tr>
            </table>

            <script src="b-humancells/b-humancells.js"></script>
            <script>
                var
                    table = document.querySelectorAll('.b-humancells')[0],
                    cells = new HumanCells(table);
            </script>
        </div>
    </code>



    Common settings:

    Could be given in two ways:
    
    1. As a second argument for HumanCells constructor;

    <code>
        ...
        ...
        ...
        <script>
            var
                table = document.querySelectorAll('.b-humancells')[0],
                cells = new HumanCells(
                    table,
                    {
                        parsing_delay : true
                    }
                );
        </script>
    </code>


    2. As an onclick attribute for .b-humancells.

    <code>
        <div
            class="b-humancells"
            onclick="return {
                parsing_delay : true
            }"
        >
            ...
            ...
            ...
        </div>
    </code>


    Common settings list:

     param                | value
    ==========================================================================
     inputs_off           | True if you want to turn the filter inputs
                          | off for all table columns.
    --------------------------------------------------------------------------
     orders_off           | True if you want to turn the order control
                          | off for all table columns.
    --------------------------------------------------------------------------
     totals_off           | True if you want to turn the totals off for
                          | all table columns.
    --------------------------------------------------------------------------
     parsing_delay        | True if you want to run the table parsing
                          | later.
    --------------------------------------------------------------------------
     initialization_delay | True if you want to run the initialization later.
    --------------------------------------------------------------------------
     order_type           | Order type for a next paramether:
                          | asc or desc (asc by default).
    --------------------------------------------------------------------------
     order_column         | Order a table by this column after parsing.
    --------------------------------------------------------------------------
     number_separator     | Separator for long numbers (thinp by default).
    --------------------------------------------------------------------------
     dom_body             | DOM node which will be sorted and filtered
                          | (first table in .b-humancells by default).
    --------------------------------------------------------------------------
     dom_head             | DOM node for a table head raw (first tr
                          | in .b-humancells by default).
    ==========================================================================



    Column settings:

    Could be given as an onclick attribute for each td in dom_head
    (it`s the first tr by default).

    <code>
        ...
        ...
        ...
        <!--
            Create a table and set a column template for the first column,
            the formula for the second and turn off order and filter controls
            for the third
        -->
        <table class="b-humancells__body">
            <tr class="b-humancells__row">
                <td
                    class="b-humancells__cell"
                    onclick="return {
                        template : 'Total : {% rows %}'
                    }"
                >First</td>
                <td
                    class="b-humancells__cell"
                    onclick="return {
                        formula : '{{ Third|avg }} / {{ Second|avg }} * 100'
                    }"
                >Second</td>
                <td
                    class="b-humancells__cell
                    onclick="return {
                        input_off : true,
                        order_off : true
                    }"
                ">Third</td>
            </tr>
            <tr class="b-humancells__row">
                <td class="b-humancells__cell">Some text</td>
                <td class="b-humancells__cell">2</td>
                <td class="b-humancells__cell">3</td>
            </tr>
            <tr class="b-humancells__row">
                <td class="b-humancells__cell">Some text</td>
                <td class="b-humancells__cell">2</td>
                <td class="b-humancells__cell">3</td>
            </tr>
        </table>
        ...
        ...
        ...
    </code>


    Column settings list:

     param     | value
    ===========================================================================
     input_off | True if you want to turn off the filter control for
               | the column only.
    ---------------------------------------------------------------------------
     order_off | True if you want to turn off the ordering control
               | for the column only.
    ---------------------------------------------------------------------------
     total_off | True if you want to turn off the totals string for the
               | column only.
    ---------------------------------------------------------------------------
     total     | Number for the default total string value
    ---------------------------------------------------------------------------
     method    | String alias for a Math object method which will be applied
               | to formula results or your own function to make it yorself.
               | 
               | The function should get the only number argument and
               | return number.
    ---------------------------------------------------------------------------
     formula   | Formula to count total using the other columns totals.
               | May take the following variables:
               | — {{ %column_alias%|avg }}  — simple sum of all values
               |                               in the given columns;
               | — {{ %column_alias%|val }}  — value counted through the
               |                               given column formula;
               | — {{ %column_alias%|rows }} — the number of rows in the
               |                               given column.
               |
               | {{% %column_name%|avg %}} by default.
    ---------------------------------------------------------------------------
     template  | template for total string output. May take the following
               | pseudo tags:
               | — {% avg %}  — simple sum of all values in column;
               | — {% val %}  — value counted through the column formula;
               | — {% rows %} — number of rows in column.
               |
               | {% avg %} by default.
    ---------------------------------------------------------------------------
     civilize  | A function to civilize the output of the column total string.
    ===========================================================================



    Virtual columns and cells:

    HumanCells support virtual (invisible) columns and cells. They`re
    needed for a correct calculations in formulas in cases when
    you don`t want to show them, but to count them only.


    Virtual columns:

    Could be given as an onclick attribute in dom_head 
    (it`s the first tr by default)

    <code>
        ...
        ...
        ...
        <table class="b-humancells__body">
            <tr
                class="b-humancells__row"
                onclick="return [
                    {
                        title : 'Fourth'
                    },
                    {
                        title : 'Fifth',
                    }
                ]"
            >
                <td
                    class="b-humancells__cell"
                    onclick="return {
                        formula  : '{{ Third|avg }} / {{ Fifth|avg }} * 100',
                        template : 'Total : {% rows %}'
                    }"
                >First</td>
                <td class="b-humancells__cell">Second</td>
                <td
                    class="b-humancells__cell
                    onclick="return {
                        input_off : true,
                        order_off : true
                    }"
                ">Third</td>
            </tr>
        ...
        ...
        ...
    </code>


    Virtual column settings list:

     param     | value
    ===========================================================================
     total     | Number for the default total string value
    ---------------------------------------------------------------------------
     method    | String alias for a Math object method which will be applied
               | to formula results or your own function to make it yorself.
               | 
               | The function should get the only number argument and
               | return number.
    ---------------------------------------------------------------------------
     formula   | Formula to count total using the other columns totals.
               | May take the following variables:
               | — {{ %column_alias%|avg }}  — simple sum of all values
               |                               in the given columns;
               | — {{ %column_alias%|val }}  — value counted through the
               |                               given column formula;
               | — {{ %column_alias%|rows }} — the number of rows in the
               |                               given column.
               |
               | {{% %column_name%|avg %}} by default.
    ---------------------------------------------------------------------------
     template  | template for total string output. May take the following
               | pseudo tags:
               | — {% avg %}  — simple sum of all values in column;
               | — {% val %}  — value counted through the column formula;
               | — {% rows %} — number of rows in column.
               |
               | {% avg %} by default.
    ---------------------------------------------------------------------------
     civilize  | A function to civilize the output of the column total string.
    ===========================================================================


    Virtual cells:

    Should be given as an onclick attribute in each table row.

    <code>
        ...
        ...
        ...
        <table class="b-humancells__body">
            ...
            <tr
                class="b-humancells__row"
                onclick="return [
                    4,
                    5,
                    6.6
                ]"
            >
                <td class="b-humancells__cell">Some text</td>
                <td class="b-humancells__cell">2</td>
                <td class="b-humancells__cell">3</td>
            </tr>
            <tr
                class="b-humancells__row"
                onclick="return [
                    7,
                    8,
                    9.9
                ]"
            >
                <td class="b-humancells__cell">Some text</td>
                <td class="b-humancells__cell">2</td>
                <td class="b-humancells__cell">3</td>
            </tr>
            ...
        </table>
        ...
        ...
        ...
    </code>



    Instance methods:

     method    | value
    ===========================================================================
     .init()   | Should be called if the initialization_delay paramether was
               | given only
    ---------------------------------------------------------------------------
     .sort()   | A column sorter caller for manual sorting. Takes two
               | arguments:
               | — column alias (id);
               | — asc or desc order type (optional).
    ---------------------------------------------------------------------------
     .parse()  | Should be called if the parsing_delay paramether was given
               | only
    ---------------------------------------------------------------------------
     .total()  | All columns totals recounter for manual call
    ---------------------------------------------------------------------------
     .filter() | A column filter caller for manual filtering. Takes two
               | arguments:
               | — column alias (id);
               | — string to search.
    ---------------------------------------------------------------------------



    Static methods:

     method      | value
    ===========================================================================
     .round()    | Round a float to a given decimal. Takes two arguments:
                 | — float to round;
                 | — number of zeros.
    ---------------------------------------------------------------------------
     .civilize() | Separate the thousand and million number parts with a given
                 | separator. Takes two args:
                 | — number to separate;
                 | — separator.
    ===========================================================================