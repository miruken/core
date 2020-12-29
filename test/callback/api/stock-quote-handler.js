import { Base } from "../../../src/core/base2";
import { Handler } from "../../../src/callback/handler";
import { handles } from "../../../src/callback/callback-policy";
import { Request } from "../../../src/callback/api/request";
import { Message } from "../../../src/callback/api/message";
import { ignore } from "../../../src/callback/map/mapping";
import { typeId } from "../../../src/callback/api/type-id";
import { response } from "../../../src/callback/api/response";

@typeId("StockQuote")
export class StockQuote extends Base {
    symbol;
    value;
}

@response(StockQuote)
@typeId("GetStockQuote")
export class GetStockQuote extends Request {
    constructor(symbol) {
        super();
        this.symbol = symbol;
    }

    symbol;
}

@typeId("SellStock")
export class SellStock extends Message {
    constructor(symbol, numShares) {
        super();
        this.symbol    = symbol;
        this.numShares = numShares;
    }

    symbol;
    numShares;
}

export class StockQuoteHandler extends Handler {
    @handles(GetStockQuote)
    getQuote(getQuote) {
        ++StockQuoteHandler.called;
        
        if (getQuote.symbol == "EX")
            throw new Error("Stock Exchange is down");

        return Promise.resolve(new StockQuote().extend({
            symbol: getQuote.symbol,
            value:  Math.random() * 10
        }));
    }

    @handles(SellStock)
    sellStock(sellStock) {
        if (sellStock.Symbol == "EX")
            throw new Error("Stock Exchange is down");
    }

    static called = 0;
}
