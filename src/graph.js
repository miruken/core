import { Base, Abstract, Module } from './base2';
import { Protocol, $isFunction, $equals } from './meta';
import { Enum } from './enum';

/**
 * TraversingAxis enum
 * @class TraversingAxis
 * @extends miruken.Enum
 */
export const TraversingAxis = Enum({
    /**
     * Traverse only current node.
     * @property {number} Self
     */
    Self: 1,
    /**
     * Traverse only current node root.
     * @property {number} Root
     */
    Root: 2,
    /**
     * Traverse current node children.
     * @property {number} Child
     */
    Child: 3,
    /**
     * Traverse current node siblings.
     * @property {number} Sibling
     */
    Sibling: 4,
    /**
     * Traverse current node ancestors.
     * @property {number} Ancestor
     */
    Ancestor: 5,
    /**
     * Traverse current node descendants.
     * @property {number} Descendant
     */
    Descendant: 6,
    /**
     * Traverse current node descendants in reverse.
     * @property {number} DescendantReverse
     */
    DescendantReverse: 7,
    /**
     * Traverse current node and children.
     * @property {number} ChildOrSelf
     */
    ChildOrSelf: 8,
    /**
     * Traverse current node and siblings.
     * @property {number} SiblingOrSelf
     */
    SiblingOrSelf: 9,
    /**
     * Traverse current node and ancestors.
     * @property {number} AncestorOrSelf
     */
    AncestorOrSelf: 10,
    /**
     * Traverse current node and descendents.
     * @property {number} DescendantOrSelf
     */
    DescendantOrSelf: 11,
    /**
     * Traverse current node and descendents in reverse.
     * @property {number} DescendantOrSelfReverse
     */
    DescendantOrSelfReverse: 12,
    /**
     * Traverse current node, ancestors and siblings.
     * @property {number} AncestorSiblingOrSelf 
     */
    AncestorSiblingOrSelf: 13
});

/**
 * Protocol for traversing an abitrary graph of objects.
 * @class Traversing
 * @extends miruken.Protocol
 */
export const Traversing = Protocol.extend({
    /**
     * Traverse a graph of objects.
     * @method traverse
     * @param {miruken.graph.TraversingAxis} axis        -  axis of traversal
     * @param {Function}                     visitor     -  receives visited nodes
     * @param {Object}                       [context]   -  visitor callback context
     */
    traverse(axis, visitor, context) {}
});

/**
 * Mixin for Traversing functionality.
 * @class TraversingMixin
 * @uses miruken.graph.Traversing
 * @extends Module
 */
export const TraversingMixin = Module.extend({
    traverse(object, axis, visitor, context) {
        if ($isFunction(axis)) {
            context = visitor;
            visitor = axis;
            axis    = TraversingAxis.Child;
        }
        if (!$isFunction(visitor)) return;
        switch (axis) {
        case TraversingAxis.Self:
            _traverseSelf.call(object, visitor, context);
            break;
            
        case TraversingAxis.Root:
            _traverseRoot.call(object, visitor, context);
            break;
            
        case TraversingAxis.Child:
            _traverseChildren.call(object, visitor, false, context);
            break;

        case TraversingAxis.Sibling:
            _traverseAncestorSiblingOrSelf.call(object, visitor, false, false, context);
            break;
            
        case TraversingAxis.ChildOrSelf:
            _traverseChildren.call(object, visitor, true, context);
            break;

        case TraversingAxis.SiblingOrSelf:
            _traverseAncestorSiblingOrSelf.call(object, visitor, true, false, context);
            break;
            
        case TraversingAxis.Ancestor:
            _traverseAncestors.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.AncestorOrSelf:
            _traverseAncestors.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.Descendant:
            _traverseDescendants.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.DescendantReverse:
            _traverseDescendantsReverse.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.DescendantOrSelf:
            _traverseDescendants.call(object, visitor, true, context);
            break;

        case TraversingAxis.DescendantOrSelfReverse:
            _traverseDescendantsReverse.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.AncestorSiblingOrSelf:
            _traverseAncestorSiblingOrSelf.call(object, visitor, true, true, context);
            break;

        default:
            throw new Error(`Unrecognized TraversingAxis ${axis}.`);
        }
    }
});

function _checkCircularity(visited, node) {
    if (visited.indexOf(node) !== -1) {
        throw new Error(`Circularity detected for node ${node}`);
    }
    visited.push(node);
    return node;
}

function _traverseSelf(visitor, context) {
    visitor.call(context, this);
}

function _traverseRoot(visitor, context) {
    let parent, root = this, visited = [this];
    while (parent = root.parent) {
        _checkCircularity(visited, parent);
        root = parent;   
    }
    visitor.call(context, root);
}

function _traverseChildren(visitor, withSelf, context) {
    if ((withSelf && visitor.call(context, this))) {
        return;
    }
    for (const child of this.children) {
        if (visitor.call(context, child)) {
            return;
        }
    }
}

function _traverseAncestors(visitor, withSelf, context) {
    let parent = this, visited = [this];
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    while ((parent = parent.parent) && !visitor.call(context, parent)) {
        _checkCircularity(visited, parent);
    }
}

function _traverseDescendants(visitor, withSelf, context) {
    if (withSelf) {
        Traversal.levelOrder(this, visitor, context);
    } else {
        Traversal.levelOrder(this, node =>
            !$equals(this, node) && visitor.call(context, node),
            context);
    }
}

function _traverseDescendantsReverse(visitor, withSelf, context) {
    if (withSelf) {
        Traversal.reverseLevelOrder(this, visitor, context);
    } else {
        Traversal.reverseLevelOrder(this, node =>
            !$equals(this, node) && visitor.call(context, node),
            context);
    }
}

function _traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    const parent = this.parent;
    if (parent) {
        for (const sibling of parent.children) {
            if (!$equals(this, sibling) && visitor.call(context, sibling)) {
                return;
            }
        }
        if (withAncestor) {
            _traverseAncestors.call(parent, visitor, true, context);
        }
    }
}

/**
 * Helper class for traversing a graph.
 * @static
 * @class Traversal
 * @extends Abstract
 */
export const Traversal = Abstract.extend({}, {
    /**
     * Performs a pre-order graph traversal.
     * @static
     * @method preOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    preOrder(node, visitor, context) {
        return _preOrder(node, visitor, context);
    },
    /**
     * Performs a post-order graph traversal.
     * @static
     * @method postOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    postOrder(node, visitor, context) {
        return _postOrder(node, visitor, context);
    },
    /**
     * Performs a level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    levelOrder(node, visitor, context) {
        return _levelOrder(node, visitor, context);
    },
    /**
     * Performs a reverse level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    reverseLevelOrder(node, visitor, context) {
        return _reverseLevelOrder(node, visitor, context);
    }
});

function _preOrder(node, visitor, context, visited = []) {
    _checkCircularity(visited, node);
    if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
        return true;
    }
    if ($isFunction(node.traverse))
        node.traverse(child => _preOrder(child, visitor, context, visited));
    return false;
}

function _postOrder(node, visitor, context, visited = []) {
    _checkCircularity(visited, node);
    if (!node || !$isFunction(visitor)) {
        return true;
    }
    if ($isFunction(node.traverse))
        node.traverse(child => _postOrder(child, visitor, context, visited));
    return visitor.call(context, node);
}

function _levelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    const queue = [node];
    while (queue.length > 0) {
        const next = queue.shift();
        _checkCircularity(visited, next);
        if (visitor.call(context, next)) {
            return;
        }
        if ($isFunction(next.traverse))
            next.traverse(child => {
                if (child) queue.push(child);
            });
    }
}

function _reverseLevelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    const queue = [node],
          stack = [];
    while (queue.length > 0) {
        const next = queue.shift();
        _checkCircularity(visited, next);
        stack.push(next);
        const level = [];
        if ($isFunction(next.traverse))
            next.traverse(child => {
                if (child) level.unshift(child);
            });
        queue.push.apply(queue, level);
    }
    while (stack.length > 0) {
        if (visitor.call(context, stack.pop())) {
            return;
        }
    }
}
