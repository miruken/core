import { Base } from "../src/base2";
import {
    Traversal, Traversing, TraversingAxis, TraversingMixin
} from "../src/graph";
import "../src/core";

import { expect } from "chai";

export const TreeNode = Base.extend(Traversing, TraversingMixin, {
    constructor(data) { 
        let _children = [];
        this.extend({
            get parent() { return null; },
            get children() { return _children; },                
            get data() { return data; },
            addChild(...nodes) {
                const parent = this;
                nodes.forEach(node => {
                    node.extend({get parent() { return parent; }});
                    _children.push(node);
                });
                return this;
            }
        });
    }
});

describe("Traversing", () => {
    describe("#traverse", () => {
        it("should traverse self", () => {
            const root    = new TreeNode("root"),
                  visited = [];
            root.traverse(TraversingAxis.Self, node => {
                visited.push(node);
            });
            expect(visited).to.eql([root]);
        });

        it("should traverse root", () => {
            const root    = new TreeNode("root"),
                  child1  = new TreeNode("child 1"),
                  child2  = new TreeNode("child 2"),
                  child3  = new TreeNode("child 3"),
                  visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Root, node => {
                visited.push(node);
            });
            expect(visited).to.eql([root]);
        });

        it("should traverse children", () => {
            const root    = new TreeNode("root"),
                  child1  = new TreeNode("child 1"),
                  child2  = new TreeNode("child 2"),
                  child3  = new TreeNode("child 3")
                  .addChild(new TreeNode("child 3 1")),
                  visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Child, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child2, child3]);
        });

        it("should traverse siblings", () => {
            const root    = new TreeNode("root"),
                  child1  = new TreeNode("child 1"),
                  child2  = new TreeNode("child 2"),
                  child3  = new TreeNode("child 3")
                  .addChild(new TreeNode("child 3 1")),
                  visited = [];
            root.addChild(child1, child2, child3);
            child2.traverse(TraversingAxis.Sibling, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child3]);
        });

        it("should traverse children and self", () => {
            const root    = new TreeNode("root"),
                  child1  = new TreeNode("child 1"),
                  child2  = new TreeNode("child 2"),
                  child3  = new TreeNode("child 3")
                  .addChild(new TreeNode("child 3 1")),
                  visited = [];
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.SelfOrChild, node => {
                visited.push(node);
            });
            expect(visited).to.eql([root, child1, child2, child3]);
        });

        it("should traverse siblings and self", () => {
            const root    = new TreeNode("root"),
                  child1  = new TreeNode("child 1"),
                  child2  = new TreeNode("child 2"),
                  child3  = new TreeNode("child 3")
                  .addChild(new TreeNode("child 3 1")),
                  visited = [];
            root.addChild(child1, child2, child3);
            child2.traverse(TraversingAxis.SelfOrSibling, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child2, child1, child3]);
        });

        it("should traverse ancestors", () => {
            const root       = new TreeNode("root"),
                  child      = new TreeNode("child"),
                  grandChild = new TreeNode("grandChild"),
                  visited    = [];
            root.addChild(child);
            child.addChild(grandChild);
            grandChild.traverse(TraversingAxis.Ancestor, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child, root]);
        });

        it("should traverse ancestors or self", () => {
            const root       = new TreeNode("root"),
                  child      = new TreeNode("child"),
                  grandChild = new TreeNode("grandChild"),
                  visited    = [];
            root.addChild(child);
            child.addChild(grandChild);
            grandChild.traverse(TraversingAxis.SelfOrAncestor, node => {
                visited.push(node);
            });
            expect(visited).to.eql([grandChild, child, root]);
        });

        it("should traverse descendants", () => {
            const root     = new TreeNode("root"),
                  child1   = new TreeNode("child 1"),
                  child2   = new TreeNode("child 2"),
                  child3   = new TreeNode("child 3"),
                  child3_1 = new TreeNode("child 3 1"),
                  visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.Descendant, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child1, child2, child3, child3_1]);
        });

        it("should traverse descendants reverse", () => {
            const root     = new TreeNode("root"),
                  child1   = new TreeNode("child 1"),
                  child2   = new TreeNode("child 2"),
                  child3   = new TreeNode("child 3"),
                  child3_1 = new TreeNode("child 3 1"),
                  visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.DescendantReverse, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child3_1, child1, child2, child3]);
        });

        it("should traverse descendants or self", () => {
            const root     = new TreeNode("root"),
                  child1   = new TreeNode("child 1"),
                  child2   = new TreeNode("child 2"),
                  child3   = new TreeNode("child 3"),
                  child3_1 = new TreeNode("child 3 1"),
                  visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.SelfOrDescendant, node => {
                visited.push(node);
            });
            expect(visited).to.eql([root, child1, child2, child3, child3_1]);
        });

        it("should traverse descendants or self reverse", () => {
            const root     = new TreeNode("root"),
                  child1   = new TreeNode("child 1"),
                  child2   = new TreeNode("child 2"),
                  child3   = new TreeNode("child 3"),
                  child3_1 = new TreeNode("child 3 1"),
                  visited  = [];
            child3.addChild(child3_1);
            root.addChild(child1, child2, child3);
            root.traverse(TraversingAxis.SelfOrDescendantReverse, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child3_1, child1, child2, child3, root]);
        });

        it("should traverse ancestor, siblings or self", () => {
            const root     = new TreeNode("root"),
                  parent   = new TreeNode("parent"),
                  child1   = new TreeNode("child 1"),
                  child2   = new TreeNode("child 2"),
                  child3   = new TreeNode("child 3"),
                  child3_1 = new TreeNode("child 3 1"),
                  visited  = [];
            child3.addChild(child3_1);
            parent.addChild(child1, child2, child3);
            root.addChild(parent);
            child3.traverse(TraversingAxis.SelfSiblingOrAncestor, node => {
                visited.push(node);
            });
            expect(visited).to.eql([child3, child1, child2, parent, root]);
        });

        it("should detect circular references", () => {
            const CircularParent = Base.extend(TraversingMixin, {
                  constructor(data) { 
                      this.extend({
                          get parent() { return this; },
                          get children() { return []; },
                      });
                  }});

            const CircularChildren = Base.extend(TraversingMixin, {
                  constructor(data) { 
                      this.extend({
                          get parent() { return null; },
                          get children() { return [this]; },
                      });
                  }});

            const circularParent = new CircularParent();
            expect(() => { 
                circularParent.traverse(TraversingAxis.Ancestor, node => {})
            }).to.throw(Error, /Circularity detected/);

            const circularChildren = new CircularChildren();
            expect(() => { 
                circularChildren.traverse(TraversingAxis.Descendant, node => {})
            }).to.throw(Error, /Circularity detected/);
        });
    });
});

describe("Traversal", () => {
    const root     = new TreeNode("root"),
          child1   = new TreeNode("child 1"),
          child1_1 = new TreeNode("child 1 1"),
          child2   = new TreeNode("child 2"),
          child2_1 = new TreeNode("child 2 1"),
          child2_2 = new TreeNode("child 2 2"),
          child3   = new TreeNode("child 3"),
          child3_1 = new TreeNode("child 3 1"),
          child3_2 = new TreeNode("child 3 2"),
          child3_3 = new TreeNode("child 3 3");
          child1.addChild(child1_1);
          child2.addChild(child2_1, child2_2);
          child3.addChild(child3_1, child3_2, child3_3);
    root.addChild(child1, child2, child3);

    describe("#preOrder", () => {
        it("should traverse graph in pre-order", () => {
            const visited = [];
            Traversal.preOrder(root, node => { visited.push(node); });
            expect(visited).to.eql([root,     child1, child1_1, child2,   child2_1,
                                    child2_2, child3, child3_1, child3_2, child3_3]);
        });
    });

    describe("#postOrder", () => {
        it("should traverse graph in post-order", () => {
            const visited = [];
            Traversal.postOrder(root, node => { visited.push(node); });
            expect(visited).to.eql([child1_1, child1,   child2_1, child2_2, child2,
                                    child3_1, child3_2, child3_3, child3,   root]);
        });
    });

    describe("#levelOrder", () => {
        it("should traverse graph in level-order", () => {
            const visited = [];
            Traversal.levelOrder(root, node => { visited.push(node); });
            expect(visited).to.eql([root,     child1,   child2,   child3,   child1_1,
                                    child2_1, child2_2, child3_1, child3_2, child3_3]);
        });
    });

    describe("#reverseLevelOrder", () => {
        it("should traverse graph in reverse level-order", () => {
            const visited = [];
            Traversal.reverseLevelOrder(root, node => { visited.push(node); });

            expect(visited).to.eql([child1_1, child2_1, child2_2, child3_1, child3_2,
                                    child3_3, child1,   child2,   child3,   root]);
        });
    });
});
