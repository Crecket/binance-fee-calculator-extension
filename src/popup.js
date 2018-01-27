"use strict";

// load the styles
require("materialize-css/sass/materialize.scss");
require("./scss/popup.scss");

const supportedCurrencies = [
    "USD",
    "EUR",
    "GBP",

    "AUD",
    "BGN",
    "BRL",
    "CAD",
    "CHF",
    "CNY",
    "CZK",
    "DKK",
    "HKD",
    "HRK",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "JPY",
    "KRW",
    "MXN",
    "MYR",
    "NOK",
    "NZD",
    "PHP",
    "PLN",
    "RON",
    "RUB",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "ZAR"
];

// render the popup list
const renderPopupSettings = () => {
    // set default state for the checkbox
    chrome.storage.local.get(["currency"], result => {
        // default this setting to USD
        if (typeof result.currency === "undefined") {
            chrome.storage.local.set({ currency: "USD" });
            result.currency = "USD";
        }
        const currency = result.currency;
        $("#currency_input").html("");

        // loop through the currencies
        supportedCurrencies.map(supportedCurrency => {
            // const selected = currency === supportedCurrency ? "selected" : "";

            $("#currency_input").append(
                `<option value="${supportedCurrency}">${supportedCurrency}</option>`
            );
        });

        // select the currency
        $("#currency_input").val(currency);
    });
};

// handle form for currency selection
$(document).ready(() => {
    $("#save-btn").on("click", event => {
        event.preventDefault();

        const currencyInput = $("#currency_input")
            .val()
            .trim();

        // store the new list
        chrome.storage.local.set({ currency: currencyInput });
    });

    $("#fee-btn").on("click", event => {
        event.preventDefault();

        chrome.tabs.create({ url: "https://www.binance.com/fees.html" });
    });
});

renderPopupSettings();
