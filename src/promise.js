
if (Promise.prototype.finally === undefined)
    Promise.prototype.finally = function (callback) {
        let p = this.constructor;
        return this.then(
            value  => p.resolve(callback()).then(() => value),
            reason => p.resolve(callback()).then(() => { throw reason })
        );
    };

if (Promise.delay === undefined)
    Promise.delay = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
