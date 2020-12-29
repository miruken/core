import { Base } from "../../src/core/base2";

import { $decorate, $decorator } from "../../src/core/core";

import {
    createKey, createKeyChain, createKeyState
} from "../../src/core/privates";

const _ = createKey(),
      C = createKeyChain();

describe("privates", () => {
    const echo = $decorator({
        get name() {
            return `${this.base()} ${this.base()}`;
        }
    });

    describe("createKey", () => {
        const Player = Base.extend({
            constructor(name) {
                _(this).name = name;
            },

            get name() { return _(this).name; },
            set name(name) { _(this).name = name; }
        });

        it("should create privates", () => {
            const player = new Player("Craig");
            expect(player.name).to.equal("Craig");
            player.name  = "Matthew";
            expect(player.name).to.equal("Matthew");
        });

        it("should fail privates for decorators", () => {
            const player = echo(new Player("Craig"));
            expect(player.name).to.equal("undefined undefined");
            player.name = "Matthew";
            expect(player.name).to.equal("Matthew Matthew");
        });   
    });

    describe("createKeyChain", () => {
       const Player = Base.extend({
           constructor(name) {
              C(this).name = name;
           },

           get name() { return C(this).name; },
           set name(name) { C(this).name = name; }
        });

        it("should build decoratee chain", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(C(player)).to.not.equal(C(playerEcho));
            expect(C(player)).to.equal(C(Object.getPrototypeOf(playerEcho)));
        })

        it("should create privates", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(player.name).to.equal("Craig");
            expect(playerEcho.name).to.equal("Craig Craig");
            player.name  = "Matthew";
            expect(player.name).to.equal("Matthew");
            expect(playerEcho.name).to.equal("Matthew Matthew");
            playerEcho.name = "Lauren";
            expect(player.name).to.equal("Matthew");
            expect(playerEcho.name).to.equal("Lauren Lauren");
            C(player).age = 13;
            expect(C(player).age).to.equal(13);
            expect(C(playerEcho).age).to.equal(13);
            C(playerEcho).age = 16;
            expect(C(playerEcho).age).to.equal(16);
            expect(C(player).age).to.equal(13);
        });

        it("should fail privates for decorators", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            C(player).age = 13;
            expect(_(playerEcho).age).to.be.undefined;          
        });   
    });
});
