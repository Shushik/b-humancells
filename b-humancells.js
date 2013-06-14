/**
 * Yet another tool to sort and filter html tables
 *
 * @author  Shushik <silkleopard@yandex.ru>
 * @version 1.0
 *
 * @constructor
 *
 * @this   {HumanCells}
 * @param  {DOMNode}
 * @param  {undefined|object}
 * @return {HumanCells}
 */
function
    HumanCells(self, conf) {
        // Try to get the config
        conf = conf || (self.onclick ? self.onclick() : {});

        var
            al0 = '';

        // Set properties required for the init method
        this._dom  = {self : self};
        this._conf = {};
        this._prox = {init : this._proxy(this.init, this)};

        // Clone the config
        for (al0 in conf) {
            this._conf[al0] = conf[al0];
        }

        //
        if (!conf.number_separator) {
            this._conf.number_separator = ' ';
        }

        //
        if (conf.initialization_delay) {
            delete this._conf.initialization_delay;
        } else {
            // Start when the DOM is ready
            if (document.addEventListener) {
                window.addEventListener('DOMContentLoaded', this._prox.init);
            } else {
                window.attachEvent('onDOMContentLoaded', this._prox.init);
            }
        }
    }

    /**
     * Init the module
     *
     * @this   {HumanCells}
     * @return {HumanCells}
     */
    HumanCells.prototype.init = function() {
        // Enable global variables
        this.ready    = false;
        this.parsed   = false;
        this.thinking = false;
        this._timer   = 0;
        this._mem     = {};
        this._move    = {};
        this._order   = {};
        this._timers  = {};

        // Setup the table instance
        this._setup();
        this._alive();

        //
        this._timers.resize = setTimeout(this._prox.resize, 0);

        // Parse the table
        if (this._conf.parsing_delay === undefined) {
            this.parse();
        }

        return this;
    }

    /**
     * Setup the table instance
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup = function() {
        this._setup4order();
        this._setup4prox();
        this._setup4dom();
        this._setup4mem();
        this._setup4sort();
    }

    /**
     * Create the column object
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {number}
     * @param  {object|DOMNode}
     * @return {object}
     */
    HumanCells.prototype._setup4col = function(pos, raw) {
        var
            real    = raw instanceof HTMLTableCellElement,
            floated = false,
            id      = '',
            html    = real ? raw.innerHTML : '',
            text    = !real ? raw.value : raw.textContent,
            mem     = {},
            node    = null,
            params  = {};

        // Get the column settings
        if (!real) {
            params = raw;
        } else if (raw.onclick) {
            params = raw.onclick();
        }

        // Get the column id
        if (real && raw.id) {
            mem.alias = id = raw.id;
        } else if (params.alias) {
            mem.alias = id = params.alias;
        } else {
            mem.alias = id = HumanCells.trim(text).
                             replace(/[\n\r\t]/g, '').
                             substring(0, 30);
        }

        // Create an ID for the column
        id = id.replace(/[^\w\d_]/g, '_');

        // Create the virtual column and set it`s main properties
        mem = this._mem.cols[pos] = this._mem.cols[id] = {};
        mem.real     = real;
        mem.floated  = floated = (pos == 0 && params.floated != undefined ? true : false);
        mem.avg      = 0;
        mem.val      = 0;
        mem.rows     = 0;
        mem.offset   = pos;
        mem.alias    = id;
        mem.method   = params.method ? params.method : null;
        mem.formula  = (
                           params.formula ?
                           params.formula :
                           '{{ ' + id + '|avg }}'
                       ).
                       replace(
                           /\{\{ ([\w\d_]*)\|(avg|val|rows) \}\}/g,
                           'this._mem.cols.$1.$2'
                       );
        mem.civilize = params.civilize ? params.civilize : this._prox.civilize;
        mem.template = params.template ? params.template : '{% avg %}';

        // Insert the column alias into order arrays
        this._order.count[pos] = id;
        this._order.given[pos] = id;

        // Cache DOM nodes for the column
        if (real) {
            this._order.real++;

            // Raw cell
            mem.cell = raw;
            mem.cell.className = 'b-humancells__cell';
            mem.cell.innerHTML = '';

            // Order control
            if (!params.order_off && !this._conf.orders_off) {
                node = document.createElement('div');
                node.className = 'b-humancells__sort';
                node.innerHTML = '<div class="b-humancells__desc"></div>' +
                                 '<div class="b-humancells__asc"></div>';
                mem.cell.appendChild(node);
            }

            // Column title
            node = mem.title = document.createElement('div');
            node.className = 'b-humancells__title';
            node.innerHTML = html;
            mem.cell.appendChild(node);

            // Column total line
            if (!this._conf.totals_off) {
                node = mem.total = document.createElement('div');
                node.className = 'b-humancells__total';
                node.innerHTML = !params.total_off && params.total_avg ?
                                 params.total_avg :
                                 '&nbsp;';
                mem.cell.appendChild(node);
            }

            // Column filter control
            if (!this._conf.inputs_off) {
                node = mem.input = document.createElement('div');
                node.className = 'b-humancells__input';

                if (!params.input_off) {
                    node.setAttribute('contenteditable', 'true');
                }

                mem.cell.appendChild(node);
            }
        }

        return mem;
    }

    /**
     * Create and cache important DOM nodes
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup4dom = function() {
        var
            node = null;

        // Create the table header DOM
        this._dom.head = document.createElement('table');
        this._dom.head.className = 'b-humancells__head';

        // Get the table body DOM
        this._dom.body = this._conf.dom_body ?
                         this._conf.dom_body :
                         this._dom.self.getElementsByTagName('table')[0];

        // Create the spinner DOM
        this._dom.wait = document.createElement('tr');
        this._dom.wait.className = 'b-humancells__wait';
        node = document.createElement('td');
        node.className = 'b-humancells__cell';
        this._dom.wait.appendChild(node);

        // Get the raw headers
        this._dom.raws = this._conf.dom_head ?
                         this._conf.dom_head :
                         this._dom.body.getElementsByTagName('tr')[0];
        this._dom.raws.className = 'b-humancells__raws';

        // Insert the table header
        this._dom.self.appendChild(this._dom.head);

        // Create the scroll limiters
        this._move.from = {};
        this._move.till = {};
    }

    /**
     * Create the memory stacks
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup4mem = function() {
        var
            it0  = 0,
            ln0  = 0,
            mem  = null,
            raws = null;

        // Create the memory stacks
        this._mem.cols = {};
        this._mem.rows = [];

        // Get the header`s td
        this._dom.raws.className = 'b-humancells__head';
        raws = Array.prototype.
               slice.call(this._dom.raws.getElementsByTagName('td')).
               concat(this._dom.raws.onclick ? this._dom.raws.onclick() : []);
        ln0  = raws.length;

        // Iterate through the DOM columns to create
        // their memory copies
        while (it0 < ln0) {
            mem = this._setup4col(it0, raws[it0]);

            it0++;
        }
    }

    /**
     * Cache the proxifyed methods to not proxy them every time
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup4prox = function() {
        this._prox.sort         = this._proxy(this._sort,         this);
        this._prox.parse        = this._proxy(this._parse,        this);
        this._prox.route        = this._proxy(this._route,        this);
        this._prox.total        = this._proxy(this._total,        this);
        this._prox.filter       = this._proxy(this._filter,       this);
        this._prox.resize       = this._proxy(this._resize,       this);
        this._prox.scroll       = this._proxy(this._scroll,       this);
        this._prox.civilize     = this._proxy(this.civilize,      this);
        this._prox.sort4asc     = this._proxy(this._sort4asc,     this);
        this._prox.sort4desc    = this._proxy(this._sort4desc,    this);
        this._prox.sort4default = this._proxy(this._sort4default, this);
    }

    /**
     * Build the dependence order for the .total() method
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup4sort = function() {
        var
            ch0     = 0,
            ch1     = 0,
            it0     = this._order.given.length,
            it1     = 0,
            al0     = '',
            al1     = '',
            formula = '';

        // Iterate through the columns to order them by the
        // formulas importance
        while (it0-- > 0) {
            al0     = this._mem.cols[it0].alias;
            formula = this._mem.cols[it0].formula.
                      replace(/this\._mem\.cols\./g, '').
                      replace(/(avg|val|rows)/g,     '').
                      replace(/[^\w\d_ ]/g,          ' ').
                      replace(/ {2,}/g,              ' ').
                      replace(/(^ *| *$)/g,          '');

            // Check the priority of the column by it`s formula
            // and move it in the order if needed
            if (formula != al0) {
                formula = formula.split(' ');
                it1     = formula.length;

                while (it1-- > 0) {
                    al1 = formula[it1];

                    if (al0 != al1 && this._mem.cols[al1]) {
                        ch0 = this._order.count.indexOf(al0);
                        ch1 = this._order.count.indexOf(al1);

                        if (ch1 > ch0) {
                            this._order.count.splice(ch1, 1);
                            this._order.count.unshift(al1);
                        }
                    }
                }
            }
        }
    }

    /**
     * Fill the order object with the default values
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._setup4order = function() {
        this._order.real   = 0;
        this._order.offset = 0;
        this._order.col    = '';
        this._order.type   = 'asc';
        this._order.count  = [];
        this._order.given  = [];
    }

    /**
     * Bind events handlers
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._alive = function() {
        var
            it0    = 0,
            method = '',
            prefix = '',
            events = [
                'focus',
                'keyup',
                'mousedown',
                'mousemove',
                'touchstart'
            ];

        // Choose the method to set the event handler
        if (document.addEventListener) {
            method = 'addEventListener';
        } else {
            method = 'attachEvent';
            prefix = 'on';
        }

        // Set the document events handlers
        document[method](prefix + 'mousemove', this._prox.route);
        document[method](prefix + 'scroll',    this._prox.route);

        it0 = events.length;

        // Set the block events handlers
        while (it0-- > 0) {
            this._dom.self[method](prefix + events[it0], this._prox.route);
        }
    }

    /**
     * Route event to handlers
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._route = function(event) {
        event = event || window.event;

        var
            type  = event.type,
            node  = event.target,
            code  = 0,
            where = '',
            rexp  = /^b-humancells(__(asc|desc|input))?[\s\S]*/g;

        // Target
        if (!node) {
            node = event.srcElement;
        }

        if (node && node.nodeType === 3) {
            node = node.parentNode;
        }

        // Keycode
        if (
            type == 'keypress' ||
            type == 'keydown' ||
            type == 'keyup'
        ) {
            code = event.keyCode;

            if (!code && event.which) {
                code = event.which;
            }
        }

        if (node == document) {
            // Window events
            if (this['_' + type + '4document']) {
                this['_' + type + '4document'](event);
            }
        } else if (node.className && node.className.match(rexp)) {
            // Module events
            if (!node.className.match('disabled')) {
                where = node.className.replace(rexp, '$2');

                if (where === '') {
                    where = 'self';
                }

                if (this['_' + type + '4' + where]) {
                    this['_' + type + '4' + where](event);
                }
            }
        }
    }

    /**
     * Resize the table cols
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._resize = function() {
        var
            it0   = 0,
            ln0   = this._order.given.length,
            col   = null,
            mem   = null,
            off   = null,
            stl   = null,
            body  = document.createElement('colgroup'),
            head  = document.createElement('colgroup'),
            node  = null;

        // 
        while (it0 < ln0) {
            mem = this._mem.cols[it0];

            //
            if (mem.real) {
                // Get the column offset width
                off = this._offset(mem.cell, this._dom.self);

                // 
                node = document.createElement('col');
                node.style.width = off.width + 'px';
                node.className = 'b-humancells__col';
                head.appendChild(node);

                // 
                node = document.createElement('col');
                node.style.width = off.width + 'px';
                node.className = 'b-humancells__col';
                body.appendChild(node);
            }

            it0++;
        }

        // Count the total offsets
        off = this._offset(this._dom.body);
        this._move.from.top = off.top;
        this._move.till.top = off.top + off.height;

        this._dom.head.appendChild(head);
        this._dom.body.insertBefore(body, this._dom.body.firstChild);

        this._dom.head.style.width = off.width + 'px';
        this._dom.body.style.width = off.width + 'px';

        node = document.createElement('tbody');
        this._dom.head.appendChild(node);
        this._dom.wait.firstChild.setAttribute('colspan', this._order.real);
        node.appendChild(this._dom.raws);
        node.appendChild(this._dom.wait);

        off = this._offset(this._dom.head);
        this._move.till.top -= off.height;

        this._dom.body.style.top = off.height + 'px';

        this._dom.raws.className = 'b-humancells__row';
        this._dom.self.className = 'b-humancells b-humancells_are_ready';

        this.ready = true;

        this.wait();

        // 
        delete this._dom.raws;
    }

    /**
     * Table parser delayer
     *
     * @this   {HumanCells}
     * @return {HumanCells}
     */
    HumanCells.prototype.parse = function() {
        if (this.parsed) {
            return;
        }

        this._timers.parse = setTimeout(this._prox.parse, 0);

        return this;
    }

    /**
     * Table parser
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._parse = function() {
        var
            real    = false,
            floated = this._mem.cols[0].floated,
            it0     = 0,
            it1     = 0,
            ln0     = 0,
            ln1     = 0,
            num     = 0,
            txt     = '',
            col     = null,
            mem     = null,
            off     = null,
            raw     = null,
            row     = null,
            raws    = null,
            body    = floated ? document.createElement('tbody') : null,
            cell    = null,
            cells   = null;

        // Create the temporary object with the rows collection
        if (!this._dom.raws) {
            this._dom.raws = {};
            this._dom.raws.rows = this._dom.body.querySelectorAll('.b-humancells__row');
            this._dom.raws.step = 100;
            this._dom.raws.loop = 0;
            this._dom.raws.all  = this._dom.raws.rows.length;
        }

        // 
        raws = this._dom.raws.rows;
        it0  = this._dom.raws.loop * this._dom.raws.step;
        ln0  = it0 + this._dom.raws.step;
        ln0  = ln0 > this._dom.raws.all ? this._dom.raws.all : ln0;

        // Iterate through trs
        while (it0 < ln0) {
            row = raws[it0];
            raw = Array.prototype.
                  slice.call(row.getElementsByTagName('td'));
            raw = raw.concat(row.onclick ? row.onclick() : []);
            mem = {
                active : true,
                offset : it0,
                node   : row,
                cells  : []
            };
            it1 = 0;
            ln1 = raw.length;

            // Iterate through tds
            while (it1 < ln1) {
                col  = raw[it1];
                real = this._mem.cols[it1].real;
                txt  = real ? col.textContent : col;
                num  = txt - 0;

                //
                if (!isNaN(num)) {
                    if (it0 == 0) {
                        this._mem.cols[it1].type = 'number';
                    }

                    this._mem.cols[it1].avg += num;

                    mem.cells[it1] = num;
                } else {
                    if (it0 == 0) {
                        this._mem.cols[it1].type = 'string';
                    }

                    mem.cells[it1] = txt;
                }

                this._mem.cols[it1].rows++;

                it1++;
            }

            // Create a memory row
            this._mem.rows[it0] = mem;

            // Draw «zebra»
            if (!(it0 % 2)) {
                row.className = 'b-humancells__row b-humancells__row_is_odd';
            } else {
                row.className = 'b-humancells__row b-humancells__row_is_even';
            }

            it0++;
        }

        // Run the next parsing iteration or finish
        // the parsing process
        if (ln0 < this._dom.raws.all) {
            this._dom.raws.loop++;

            this.parse();
        } else {
            delete this._dom.raws;
            this.parsed = true;

            // Make the first order
            if (this._conf.order_column) {
                this.sort(
                    this._conf.order_column,
                    this._conf.order_type ?
                    this._conf.order_type :
                    'asc'
                );
            }

            this.total();
        }
    }

    /**
     * Table sort delayer
     *
     * @this   {HumanCells}
     * @param  {string}
     * @param  {string}
     * @return {HumanCells}
     */
    HumanCells.prototype.sort = function(col, type) {
        if (this._timers.sort) {
            clearTimeout(this._timers.sort);
        }

        this.wait();

        //
        if (this._mem.cols[col]) {
            if (this._order.col) {
                this._mem.cols[this._order.col].
                cell.className = 'b-humancells__cell';
            }

            this._order.offset = this._mem.cols[col].offset;
            this._order.col    = col;
            this._order.type   = type;

            this._timers.sort = setTimeout(this._prox.sort, 0);
        }

        return this;
    }

    /**
     * Table sort
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._sort = function() {
        var
            it0  = 0,
            it1  = 0,
            ln0  = this._mem.rows.length,
            row  = null,
            body = this._dom.body.
                   getElementsByTagName('tbody')[0],
            raws = this._dom.raws;

        // Scroll to the top and run the spinner
        (
            document.documentElement ?
            document.documentElement :
            window
        ).scrollTop = this._dom.from;

        //
        if (this._order.type != 'default') {
            this._mem.cols[this._order.col].
            cell.className = 'b-humancells__cell ' +
                             'b-humancells__cell_is_ordering-by-' +
                             this._order.type;
        }

        // Apply the table sorter handler to the memory stack
        this._mem.rows.sort(this._prox['sort4' + this._order.type]);

        // Iterate through the sorted memory stack
        while (it0 < ln0) {
            row = this._mem.rows[it0];

            // Move the node
            body.appendChild(row.node);

            // Draw «zebra»
            if (row.active) {
                if (!(it1 % 2)) {
                    row.node.className = 'b-humancells__row b-humancells__row_is_odd';
                } else {
                    row.node.className = 'b-humancells__row b-humancells__row_is_even';
                }

                it1++;
            }

            it0++;
        }

        // Finish the visual processing
        if (this._order.type != 'default') {
            this._mem.cols[this._order.col].
            cell.className = 'b-humancells__cell ' +
                             'b-humancells__cell_is_ordered-by-' +
                             this._order.type;
        }

        this.unwait();
    }


    /**
     * Ascending sorter
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Array}
     * @param  {Array}
     * @return {number}
     */
    HumanCells.prototype._sort4asc = function(row0, row1) {
        if (row0.cells[this._order.offset] > row1.cells[this._order.offset]) {
            return 1;
        } else if (row0.cells[this._order.offset] < row1.cells[this._order.offset]) {
            return -1;
        }

        return 0;
    }

    /**
     * Descending sorting
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Array}
     * @param  {Array}
     * @return {number}
     */
    HumanCells.prototype._sort4desc = function(row0, row1) {
        if (row0.cells[this._order.offset] > row1.cells[this._order.offset]) {
            return -1;
        } else if (row0.cells[this._order.offset] < row1.cells[this._order.offset]) {
            return 1;
        }

        return 0;
    }

    /**
     * Default sorting
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Array}
     * @param  {Array}
     * @return {number}
     */
    HumanCells.prototype._sort4default = function(row0, row1) {
        if (row0.offset > row0.offset) {
            return 1;
        } else if (row0.offset < row1.offset) {
            return -1;
        }

        return 0;
    }

    /**
     * Table filter delayer
     *
     * @this   {HumanCells}
     * @param  {string}
     * @param  {string}
     * @return {HumanCells}
     */
    HumanCells.prototype.filter = function(col, word) {
        if (this._timers.filter) {
            clearTimeout(this._timers.filter);
        }

        this.wait();

        //
        this._mem.cols[col].filter = word;

        //
        this._timers.filter = setTimeout(this._prox.filter, 350);

        return this;
    }

    /**
     * Table filter
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._filter = function() {
        var
            off  = false,
            it0  = 0,
            it1  = 0,
            it2  = 0,
            ln0  = this._mem.rows.length,
            ln1  = this._order.given.length,
            col  = null,
            row  = null,
            cell = null;

        // Scroll to the top
        (
            document.documentElement ?
            document.documentElement :
            window
        ).scrollTop = this._dom.from;

        //
        while (it0 < ln0) {
            off = false;
            it1 = 0;
            row = this._mem.rows[it0];

            //
            while (it1 < ln1) {
                col = this._mem.cols[it1];

                if (
                    col.filter &&
                    (row.cells[it1] + '').indexOf(col.filter) == -1
                ) {
                    off = true;

                    break;
                }

                it1++;
            }

            if (off) {
                // Hide row
                row.active = false;
                row.node.className = 'b-humancells__row b-humancells__row_is_off';
            } else {
                it1 = 0;

                // Display row
                row.active = true;

                // Draw «zebra»
                if (!(it2 % 2)) {
                    row.node.className = 'b-humancells__row b-humancells__row_is_odd';
                } else {
                    row.node.className = 'b-humancells__row b-humancells__row_is_even';
                }

                // Recount the totals
                while (it1 < ln1) {
                    col = this._mem.cols[it1];

                    // Count rows for column
                    if (it2 == 0) {
                        col.rows = 1;
                    } else {
                        col.rows += 1;
                    }

                    // Count avg for column
                    if (col.type == 'number') {
                        if (it2 == 0) {
                            col.avg = row.cells[it1];
                        } else {
                            col.avg += row.cells[it1];
                        }
                    }

                    it1++;
                }

                it2++;
            }

            it0++;
        }

        // Recount the maximum position for
        // the table header scrolling
        this._dom.till = this._dom.from +
                         this._offset(this._dom.body, this._dom.self).height;

        this.total();
    }

    /**
     * Delayer for totals counter
     *
     * @this   {HumanCells}
     * @return {HumanCells}
     */
    HumanCells.prototype.total = function() {
        if (this._conf.totals_off) {
            return;
        }

        // Run the table parsing
        this._timers.total = setTimeout(
            this._prox.total,
            0
        );

        return this;
    }

    /**
     * Totals counter
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._total = function() {
        var
            it0 = 0,
            ln0 = this._order.count.length,
            ch0 = '',
            col = null;

        while (it0 < ln0) {
            col = this._mem.cols[it0];

            // Only number columns should be counted
            if (col.type === 'number' || col.template.indexOf('{% rows %}') != -1) {
                // Run the column formula
                col.val = eval(col.formula);

                // Apply the user defined method
                if (col.method) {
                    ch0 = typeof col.method;

                    if (ch0 == 'function') {
                        col.val = col.method(col.val)
                    } else if (ch0 == 'string') {
                        col.val = Math[col.method](col.val);
                    }
                }

                // Save the result
                if (col.real && col.total) {
                    col.total.innerHTML = col.template.
                                          replace(
                                              /\{% avg %\}/g,
                                              col.civilize ?
                                              col.civilize(col.avg) :
                                              this.civilize(col.avg)
                                          ).
                                          replace(
                                              /\{% val %\}/g,
                                              col.civilize ?
                                              col.civilize(col.val) :
                                              this.civilize(col.val)
                                          ).
                                          replace(
                                              /\{% rows %\}/g,
                                              col.civilize ?
                                              col.civilize(col.rows) :
                                              this.civilize(col.rows)
                                          );
                }
            }

            it0++;
        }

        this.unwait();
    }

    /**
     * Turn the spinner on
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {string}
     */
    HumanCells.prototype.wait = function() {
        this.thinking = true;
        this._dom.self.className += ' b-humancells_are_thinking';
    }

    /**
     * Turn the spinner off
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {string}
     */
    HumanCells.prototype.unwait = function() {
        this.thinking = false;
        this._dom.self.className = 'b-humancells b-humancells_are_ready';
    }

    /**
     * Default number civilizer
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {number}
     * @return {string}
     */
    HumanCells.prototype.civilize = function(num) {
        return HumanCells.civilize(
            HumanCells.round(num),
            this._conf.number_separator
        );
    }

    /**
     * Make the table hat «flying» on scroll
     *
     * @private
     *
     * @this   {HumanCells}
     * @return {undefined}
     */
    HumanCells.prototype._scroll = function() {
        var
            pos = document.documentElement.scrollTop ?
                  document.documentElement.scrollTop :
                  document.body.scrollTop;

        if (pos > this._move.from.top && pos < this._move.till.top) {
            this._dom.head.style.top = (pos - this._move.from.top) + 'px';
        } else {
            this._dom.head.style.top = 0;
        }
    }

    /**
     * Keyup event handler for the filter input
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._keyup4input = function(event) {
        var
            it0   = this._order.given.length,
            code  = event.keyCode,
            val   = event.target.textContent,
            input = event.target;

        if (code == 27) {
            // Blur from the «input» via Esc
            input.blur();
        } else if (
            // Filter some keys
            code != 9  &&
            code != 13 &&
            code != 16 &&
            code != 17 &&
            code != 18 &&
            code != 27 &&
            code != 37 &&
            code != 38 &&
            code != 39 &&
            code != 40 &&
            code != 224
        ) {
            //
            while (it0-- > 0) {
                if (this._mem.cols[it0].input == input) {
                    this._mem.cols[it0].filter = val;

                    this.filter(this._mem.cols[it0].alias, val);

                    break;
                }
            }
        }
    }

    /**
     * Mousedown event handler for the ascending sort control
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._mousedown4asc = function(event) {
        this._mousedown4sort(event);
    };


    /**
     * Mousedown event handler for the descending sort control
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._mousedown4desc = function(event) {
        this._mousedown4sort(event);
    };

    /**
     * Mousedown event handler for the common sort control
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._mousedown4sort = function(event) {
        var
            it0   = this._order.given.length,
            order = '',
            col   = null,
            node  = event.target.parentNode.parentNode;

        while (it0-- > 0) {
            col = this._mem.cols[it0];

            if (col.cell == node) {
                order = event.target.className.replace('b-humancells__', '');

                this.sort(col.alias, order);
                break;
            }
        }
    }

    /**
     * Scroll event handler for the document
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {Event}
     * @return {undefined}
     */
    HumanCells.prototype._scroll4document = function(event) {
        //
        if (this._timers.scroll) {
            clearTimeout(this._timers.scroll);
        }

        this._dom.head.style.top = 0;

        //
        this._timers.scroll = setTimeout(
            this._prox.scroll,
            150
        );
    }

    /**
    * Run the function in a given context
    *
    * @private
    *
    * @this   {HumanCells}
    * @param  {function}
    * @param  {object}
    * @return {function}
    */
    HumanCells.prototype._proxy = function(fn, ctx) {
        return function() {
            return fn.apply(ctx, arguments);
        }
    }

    /**
     * Get an offset for chosen elements
     * (magic copypasted from jQuery)
     *
     * @private
     *
     * @this   {HumanCells}
     * @param  {DOMNode}
     * @param  {undefined|DOMNode}
     * @return {object}
     */
    HumanCells.prototype._offset = function(from, till) {
        till = till || document.body;

        var
            quirks  = false,
            table   = /^t(?:able|d|h)$/i,
            doc     = document,
            body    = doc.body,
            view    = doc.defaultView ? doc.defaultView.getComputedStyle : null,
            node    = from,
            prev    = view ? view(node, null) : node.currentStyle,
            curr    = null,
            offset  = {
                top    : node.offsetTop,
                left   : node.offsetLeft,
                width  : node.offsetWidth,
                height : node.offsetHeight
            },
            cparent = node.offsetParent,
            pparent = from;

        if (navigator.userAgent.match(/MSIE [67]/) && doc.compatMode != 'CSS1Compat') {
            quirks = true;
        }

        while ((node = node.parentNode) && node != till) {
            if (prev.position === 'fixed') {
                break;
            }

            curr = view ? view(node, null) : node.currentStyle;

            offset.top  -= node.scrollTop;
            offset.left -= node.scrollLeft;

            if (node === cparent) {
                offset.top  += node.offsetTop;
                offset.left += node.offsetLeft;

                if (quirks && table.test(node.tagName)) {
                    offset.top  += parseFloat(curr.borderTopWidth) || 0;
                    offset.left += parseFloat(curr.borderLeftWidth) || 0;
                }

                pparent = cparent;
                cparent = node.offsetParent;
            }

            if (curr.overflow !== 'visible') {
                offset.top  += parseFloat(curr.borderTopWidth) || 0;
                offset.left += parseFloat(curr.borderLeftWidth) || 0;
            }

            prev = curr;
        }

        if (node === body) {
            if (prev.position === 'relative' || prev.position === 'static') {
                offset.top  += body.offsetTop;
                offset.left += body.offsetLeft;
            } else if (prev.position === 'fixed') {
                offset.top  += Math.max(doc.scrollTop, body.scrollTop);
                offset.left += Math.max(doc.scrollLeft, body.scrollLeft)
            }
        }

        return offset;
    }

    /**
     * Remove spaces and line breaks from the begin and the end
     * of the string
     *
     * @static
     *
     * @this   {HumanCells}
     * @param  {string}
     * @return {string}
     */
    HumanCells.trim = function(str) {
        return str.replace(/(^\s*|\s*$)/g, '');
    }

    /**
     * Round a given float/number up to a desired
     * number of decimal places
     *
     * @static
     *
     * @this   {HumanCells}
     * @param  {number}
     * @param  {undefined|number}
     * @return {number}
     */
    HumanCells.round = function(num, to) {
        to = to || 2;

        var
            cf = '1000000000000'.substring(0, to + 1) - 0;

        return Math.round(num * cf) / cf;
    }

    /**
     * Separate thousands and millions with a given separator
     *
     * @static
     *
     * @this   {HumanCells}
     * @param  {number}
     * @param  {undefined|string}
     * @return {string}
     */
    HumanCells.civilize = function(num, sep) {
        sep = sep || ' ';

        var
            tmp = (num + '').split('.');

        tmp[0] = tmp[0].replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1' + sep);

        return tmp.join('.');
    }