"use strict";

// styles
require("./scss/content.scss");

// libraries
require("babel-core/register");
require("babel-polyfill");
const $ = require("jquery");
const axios = require("axios");

// extension files
const Logger = require("./Helpers/Logger");

// list of all binance symbols with current price
let symbolList = {};
// current btc/usdt price
let btcUsdPrice = 10000;

/**
 * Fetches torrent information for a given imdbID
 * @returns {Promise.<*>}
 */
const getBinanceSymbols = async () => {
    // do lookup to the yts api
    const result = await axios.get(
        "https://api.binance.com/api/v3/ticker/price"
    );
    Logger.debug("ticker binance api", result);

    const symbols = result.data;

    // loop through all ticker symbols
    symbols.map(symbol => {
        if (symbol.symbol === "BTCUSDT") {
            btcUsdPrice = parseFloat(symbol.price);
        }

        // only add btc pairs
        if (symbol.symbol.endsWith("BTC")) {
            symbolList[symbol.symbol] = {
                symbol: symbol.symbol,
                btcPrice: parseFloat(symbol.price),
                usdPrice: 0
            };
        }
    });

    // calculate the USD value for all items
    Object.keys(symbolList).map(symbolKey => {
        const symbolItem = symbolList[symbolKey];

        symbolList[symbolKey] = {
            ...symbolItem,
            usdPrice: symbolItem.btcPrice * btcUsdPrice
        };
    });

    return symbolList;
};

/**
 * Only triggered on the https://www.binance.com/fees.html page
 * @param accountInfoListItems
 * @param binancePromise
 * @returns {Promise<void>}
 */
const renderFeeOutput = async (accountInfoListItems, binancePromise) => {
    // make sure it is finished
    await binancePromise;

    let first = true;
    accountInfoListItems.each((key, accountInfoListItem) => {
        if (first) {
            first = false;
            return;
        }

        // get the columns for each row
        const columns = $(accountInfoListItem).find("div div");
        const feeColumn = columns[3];
        // get the symbol value
        const feeValues = $(feeColumn)
            .text()
            .split(/  /);

        // parse the fee and symbol from the row
        const feeSymbol = feeValues[1].trim();
        const feeAmount = parseFloat(feeValues[0]);

        // get the symbol info from the api results
        let symbolInfo = symbolList[feeSymbol + "BTC"];

        // exception for BTC
        if (feeSymbol === "BTC") {
            console.log(feeAmount, btcUsdPrice);
            symbolInfo = {
                usdPrice: btcUsdPrice
            };
        }

        // some coins don't have a ticker price
        if (!symbolInfo) {
            return;
        }

        // calculate the usd price
        const finalPrice = (feeAmount * symbolInfo.usdPrice).toFixed(2);

        // update the column with the new value
        $(feeColumn).html(`${$(feeColumn).html()} - $${finalPrice}`);
    });
};

/**
 * Start the content script
 * @returns {Promise<any>}
 */
const start = async () => {
    const binancePromise = getBinanceSymbols();

    // delay the script to let binance load the fees
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            const accountInfoListItems = $(".accountInfo-lists li");

            if (accountInfoListItems.length > 0) {
                // render the output for the fee overview list
                renderFeeOutput(accountInfoListItems, binancePromise)
                    .then(resolve)
                    .catch(reject);
            }
        }, 500);
    });
};

// start the content script
start()
    .then(console.log)
    .catch(console.error);
