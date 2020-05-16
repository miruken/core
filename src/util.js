import { Base } from "./base2";
import { createKeyChain } from "./privates";

const _ = createKeyChain();

/**
 * Helper class to simplify array manipulation.
 * @class ArrayManager
 * @constructor
 * @param  {Array}  [...items]  -  initial items
 * @extends Base
 */
export const ArrayManager = Base.extend({
    constructor(items) {
        _(this).items = [];
        if (items) {
            this.append(items);
        }
    },
    /** 
     * Gets the array.
     * @method getItems
     * @returns  {Array} array.
     */
    getItems() { return _(this).items; },
    /** 
     * Gets the item at array `index`.
     * @method getIndex
     * @param    {number}  index - index of item
     * @returns  {Any} item at index.
     */
    getIndex(index) {
        const { items } = _(this);
        if (items.length > index) {
            return items[index];
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
        const { items } = _(this);
        if (items[index] === undefined) {
            items[index] = this.mapItem(item);
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
        _(this).items.splice(index, 0, this.mapItem(item));
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
        _(this).items[index] = this.mapItem(item);
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
        const { items } = _(this);
        if (items.length > index) {
            items.splice(index, 1);
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
                _(this).items.push(this.mapItem(newItems[i]));
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
 * @param  {Function}  order  -  partially orders items
 * @extends Base
 */
export const IndexedList = Base.extend({
    constructor(order = defaultOrder) {
        const _this = _(this);
        _this.index = Object.create(null);
        _this.order = order;
    },
    /** 
     * Determines if list is empty.
     * @method isEmpty
     * @returns  {boolean}  true if list is empty, false otherwise.
     */
    isEmpty() {
        return !this.head;
    },
    /** 
     * Determines if `node` is present in list using `$equals`.
     * @method has
     * @param   {Any} node  -  node to test for
     * @returns  {boolean}  true if `node` exists.
     */            
    has(node) {
        const index = node.index;
        let   indexedNode = this.getFirst(index);
        while (indexedNode && indexedNode.index === index) {
            if ($equals(indxedNode, node)) { return true; }
            indexedNode = indexedNode.next;
        }
        return false;
    },
    /** 
     * Gets the first node at `index`.
     * @method getFirst
     * @param    {number} index  -  index of node
     * @returns  {Any}  the first node at index.
     */
    getFirst(index) {
        return index && _(this).index[index];
    },
    /** 
     * Inserts `node` at `index`.
     * @method insert
     * @param  {Any}     node   -  node to insert
     * @param  {number}  index  -  index to insert at
     * @returns  {IndexedList}  the updated list.
     * @chainable
     */
    insert(node, index) {
        const indexedNode = this.getFirst(index);
        let insert = indexedNode;
        if (index) {
            insert = insert || this.head;
            while (insert && _(this).order(node, insert) >= 0) {
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
                _(this).index[index] = node;
            }
        }
        return this;
    },
    /** 
     * Removes `node` from the list.
     * @method remove
     * @param  {Any}  node  -  node to remove
     * @returns  {IndexedList}  the updated list.
     * @chainable
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
        if (this.getFirst(index) === node) {
            if (next && next.index === index) {
                _(this).index[index] = next;
            } else {
                delete _(this).index[index];
            }
        }
        return this;
    },
    /** 
     * Merges `list` into this list.
     * @method list
     * @param  {IndexedList}  list  -  list to merge
     * @returns  {IndexedList}  the updated list.
     * @chainable
     */
    merge(list) {
        if (!list) { return this; }
        if (list.constructor !== this.constructor) {
            throw new TypeError("merge expects lists of equal type.");
        }
        let node = list.head;
        while (node) {
            const next = node.next;
            if (!this.has(node)) {
                this.insert(node, node.index);
            }
            node = next;
        }
        return this;
    }    
});

function defaultOrder(a, b) {
    return a < b;
}

