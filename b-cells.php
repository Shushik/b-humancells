<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">

<link rel="stylesheet" type="text/css" href="blocks/b-cells/b-cells.css">

<title>b-cells</title>
</head><body>
    <p>1</p>
    <p>2</p>
    <div class="b-cells">
        <?
            $cols = array(
                'My My',
                'At',
                'Waterloo',
                'Napoleon',
                'Did',
                'Surrender',
                'Oh',
                'Yeah',
                'And',
                'I',
                'Have',
                'Meet',
                'My',
                'Destiny',
                'In',
                'Quite',
                'A',
                'Similar',
                'Way',
                'The History',
                'Book',
                'On',
                'The Shelf',
                'Is',
                'Always',
                'Repeating',
                'Itself',
            );
            $end = count($cols);
            $it0 = 0;
            $it1 = 0;
        ?>
        <? /* ?>
        <table class="b-cells__head" width="1998">
            <? foreach ($cols as $col) { ?>
                <col width="72" style="text-align: right;">
            <? } ?>
            <tr class="b-cells__row">
                <? foreach ($cols as $col) { ?>
                    <td class="b-cells__cell">
                        <div class="b-cells__sort">
                            <div class="b-cells__desc"></div>
                            <div class="b-cells__asc"></div>
                        </div>
                        <div class="b-cells__title"><?= $col ?></div>
                        <div class="b-cells__total">1234555</div>
                        <div class="b-cells__input" contenteditable="true"></div>
                    </td>
                    <? $it++; ?>
                <? } ?>
            </tr>
        </table>
        <? */ ?>
        <table class="b-cells__body">
            <? /* foreach ($cols as $col) { ?>
                width="1998" style="top: 48px;"
                <col width="72">
            <? } */ ?>
            <tr class="b-cells__row">
                <? foreach ($cols as $col) { ?>
                    <td
                        class="b-cells__cell"
                        onclick="return {
                            <? if ($it0 == 0) { ?>
                                template : 'Total: {% rows %}'
                            <? } else if ($it0 == 3) { ?>
                                template : '{% val %}',
                                formula : '{{ At|avg }} / 100'
                            <? } ?>
                        }"
                    ><?= $col ?></td>
                    <? $it0++; ?>
                <? } ?>
            </tr>
            <? for ($it0 = 0; $it0 < 1500; $it0++) { ?>
                <tr class="b-cells__row<? /* if ($it0 % 2) { ?>b-cells__row_is_odd<? } else { ?>b-cells__row_is_even<? } */ ?>">
                    <? for ($it1 = 0; $it1 < $end; $it1++) { ?>
                        <? if ($it1 == 0) { ?>
                            <td class="b-cells__cell b-cells__cell_is_title"><a href="#"><?= $cols[rand(0, $end - 1)] ?></a></td>
                        <? } elseif ($it1 == 4) { ?>
                            <td class="b-cells__cell"><a href="#"><?= rand(1, 100) ?></a></td>
                        <? } elseif ($it1 % 2) { ?>
                            <td class="b-cells__cell"><?= rand(1, 100) ?></td>
                        <? } else { ?>
                            <td class="b-cells__cell"><?= (rand(1, 10000) / 100) ?></td>
                        <? } ?>
                    <? }; ?>
                </tr>
            <? }; ?>
        </table>
    </div>

    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>
    <p>1</p>
    <p>2</p>

    <script type="text/javascript" src="blocks/b-cells/b-cells.js"></script>
    <script type="text/javascript">
        var
            table = document.querySelectorAll('.b-cells')[0],
            cells = new HumanCells(
                table
            );
    </script>

</body></html>