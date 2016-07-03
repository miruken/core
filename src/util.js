import { Base } from './base2';
import { $isSomething } from './meta';

/**
 * Helper class to simplify array manipulation.
 * @class ArrayManager
 * @constructor
 * @param  {Array}  [...items]  -  initial items
 * @extends Base
 */
export const ArrayManager = Base.extend({
    constructor(items) {
        let _items = [];
        this.extend({
            /** 
             * Gets the array.
             * @method getItems
             * @returns  {Array} array.
             */
            getItems() { return _items; },
            /** 
             * Gets the item at array `index`.
             * @method getIndex
             * @param    {number}  index - index of item
             * @returns  {Any} item at index.
             */
            getIndex(index) {
                if (_items.length > index) {
                    return _items[index];
                }
            },
            /** 
             * Sets `item` at array `index` if empty.
             * @method setIndex
             * @param    {number}  index - index of item
             * @param    {Any}     item  - item to set
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            setIndex(index, item) {
                if ((_items.length <= index) ||
                    (_items[index] === undefined)) {
                    _items[index] = this.mapItem(item);
                }
                return this;
            },
            /** 
             * Inserts `item` at array `index`.
             * @method insertIndex
             * @param    {number}   index - index of item
             * @param    {Item}     item  - item to insert
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            insertIndex(index, item) {
                _items.splice(index, 0, this.mapItem(item));
                return this;
            },
            /** 
             * Replaces `item` at array `index`.
             * @method replaceIndex
             * @param    {number}   index - index of item
             * @param    {Item}     item  - item to replace
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            replaceIndex(index, item) {
                _items[index] = this.mapItem(item);
                return this;
            },
            /** 
             * Removes the item at array `index`.
             * @method removeIndex
             * @param    {number}   index - index of item
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            removeIndex(index) {
                if (_items.length > index) {
                    _items.splice(index, 1);
                }
                return this;
            },
            /** 
             * Appends one or more items to the end of the array.
             * @method append
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            append(/* items */) {
                let newItems;
                if (arguments.length === 1 && Array.isArray(arguments[0])) {
                    newItems = arguments[0];
                } else if (arguments.length > 0) {
                    newItems = arguments;
                }
                if (newItems) {
                    for (let i = 0; i < newItems.length; ++i) {
                        _items.push(this.mapItem(newItems[i]));
                    }
                }
                return this;
            },
            /** 
             * Merges the items into the array.
             * @method merge
             * @param    {Array}  items - items to merge from
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            merge(items) {
                for (let index = 0; index < items.length; ++index) {
                    const item = items[index];
                    if (item !== undefined) {
                        this.setIndex(index, item);
                    }
                }
                return this;
            }
        });
        if (items) {
            this.append(items);
        }
    },
    /** 
     * Optional mapping for items before adding to the array.
     * @method mapItem
     * @param    {Any}  item  -  item to map
     * @returns  {Any}  mapped item.
     */
    mapItem(item) { return item; }
});

/**
 * Maintains a simple doublely-linked list with indexing.
 * Indexes are partially ordered according to the order comparator.
 * @class IndexedList
 * @constructor
 * @param  {Function}  order  -  orders items
 * @extends Base
 */
export const IndexedList = Base.extend({
    constructor(order) {
        let _index = {};
        this.extend({
            /** 
             * Determines if list is empty.
             * @method isEmpty
             * @returns  {boolean}  true if list is empty, false otherwise.
             */
            isEmpty() {
                return !this.head;
            },
            /** 
             * Gets the node at an `index`.
             * @method getIndex
             * @param    {number} index - index of node
             * @returns  {Any}  the node at index.
             */
            getIndex(index) {
                return index && _index[index];
            },
            /** 
             * Inserts `node` at `index`.
             * @method insert
             * @param  {Any}     node   - node to insert
             * @param  {number}  index  - index to insert at
             */
            insert(node, index) {
                const indexedNode = this.getIndex(index);
                let insert = indexedNode;
                if (index) {
                    insert = insert || this.head;
                    while (insert && order(node, insert) >= 0) {
                        insert = insert.next;
                    }
                }
                if (insert) {
                    const prev  = insert.prev;
                    node.next   = insert;
                    node.prev   = prev;
                    insert.prev = node;
                    if (prev) {
                        prev.next = node;
                    }
                    if (this.head === insert) {
                        this.head = node;
                    }
                } else {
                    delete node.next;
                    const tail = this.tail;
                    if (tail) {
                        node.prev = tail;
                        tail.next = node;
                    } else {
                        this.head = node;
                        delete node.prev;
                    }
                    this.tail = node;
                }
                if (index) {
                    node.index = index;
                    if (!indexedNode) {
                        _index[index] = node;
                    }
                }
            },
            /** 
             * Removes `node` from the list.
             * @method remove
             * @param  {Any}  node  - node to remove
             */
            remove(node) {
                const prev = node.prev,
                      next = node.next;
                if (prev) {
                    if (next) {
                        prev.next = next;
                        next.prev = prev;
                    } else {
                        this.tail = prev;
                        delete prev.next;
                    }
                } else if (next) {
                    this.head = next;
                    delete next.prev;
                } else {
                    delete this.head;
                    delete this.tail;
                }
                const index = node.index;
                if (this.getIndex(index) === node) {
                    if (next && next.index === index) {
                        _index[index] = next;
                    } else {
                        delete _index[index];
                    }
                }
            }
        });
    }
});

/**
 * Recursively flattens and optionally prune an array.
 * @method $flatten
 * @param    {Array}   arr     -  array to flatten
 * @param    {boolean} prune  -  true if prune null items
 * @returns  {Array}   flattend/pruned array or `arr`
 */
export function $flatten(arr, prune) {
    if (!Array.isArray(arr)) return arr;
    let items = arr.map(item => $flatten(item, prune));
    if (prune) items = items.filter($isSomething);
    return [].concat(...items);
}

/**
 * Throttles `fn` over a time period.
 * @method $debounce
 * @param    {Function} fn                  -  function to throttle
 * @param    {int}      wait                -  time (ms) to throttle func
 * @param    {boolean}  immediate           -  if true, trigger func early
 * @param    {Any}      defaultReturnValue  -  value to return when throttled
 * @returns  {Function} throttled function
 */
export function $debounce(fn, wait, immediate, defaultReturnValue) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) {
                return fn.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            return fn.apply(context, args);
        }
        return defaultReturnValue;
    };
};
