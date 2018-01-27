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
// list of all currencies with their respective transfer rates
let currencyList = {};
// current btc/usdt price
let btcUsdPrice = 10000;
// selected currency
let selectedCurrency = "USD";

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
 * Get the transfer rates for different currencies
 * @returns {Promise<{}>}
 */
const getCurrencyRates = async () => {
    // do lookup to fixer api to get USD values
    const result = await axios.get("https://api.fixer.io/latest?base=USD");
    Logger.debug("fixer currency api", result);

    // get currency rates
    const currencyRates = result.data.rates;

    // loop through currencies and get rate value
    Object.keys(currencyRates).map(currency => {
        const currencyRate = currencyRates[currency];

        currencyList[currency] = {
            rate: currencyRate,
            currency: currency
        };
    });

    return currencyList;
};

/**
 * Only triggered on the https://www.binance.com/fees.html page
 * @param accountInfoListItems
 * @param selectedCurrency
 * @param binancePromise
 * @param currencyPromise
 * @returns {Promise<void>}
 */
const renderFeeOutput = async (
    accountInfoListItems,
    selectedCurrency,
    binancePromise,
    currencyPromise
) => {
    // make sure it is finished
    await binancePromise;
    await currencyPromise;

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

        // check if the selected currency is usd and else calculate the correct price
        const price =
            selectedCurrency === "USD"
                ? // normal usd price
                  symbolInfo.usdPrice
                : // alternate currency price
                  symbolInfo.usdPrice * currencyList[selectedCurrency].rate;

        console.log()

        // calculate the usd price
        const finalPrice = (feeAmount * price).toFixed(2);

        // update the column with the new value
        $(feeColumn).html(`${$(feeColumn).html()} - ${finalPrice} ${selectedCurrency}`);
    });
};

/**
 * Start the content script
 * @returns {Promise<any>}
 */
const start = async () => {
    const binancePromise = getBinanceSymbols();
    const currencyPromise = getCurrencyRates();

    // delay the script to let binance load the fees
    return await new Promise((resolve, reject) => {
        chrome.storage.local.get(["currency"], result => {
            // default this setting to USD
            if (typeof result.currency === "undefined") {
                chrome.storage.local.set({ currency: "USD" });
                result.currency = "USD";
            }
            selectedCurrency = result.currency;

            // delay the app so the fee page is loaded
            setTimeout(() => {
                const accountInfoListItems = $(".accountInfo-lists li");

                if (accountInfoListItems.length > 0) {
                    // render the output for the fee overview list
                    renderFeeOutput(
                        accountInfoListItems,
                        selectedCurrency,
                        binancePromise,
                        currencyPromise
                    )
                        .then(resolve)
                        .catch(reject);
                }
            }, 500);
        });
    });
};

// start the content script
start()
    .then(console.log)
    .catch(console.error);
