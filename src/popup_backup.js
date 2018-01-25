"use strict";

// load the styles
require("materialize-css/sass/materialize.scss");
require("./scss/popup.scss");

const supportedCurrencies = ["USD", "EUR"];

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

        supportedCurrencies.map(supportedCurrency => {
            const selected = currency === supportedCurrency ? "selected" : "";
            $("#currency_input").append(
                `<option value="${supportedCurrency}" ${selected}>${supportedCurrency}</option>`
            );
        });
    });
};

// handle form for new custom torrent sites
$("#currency_input").on("change", event => {
    event.preventDefault();

    const currencyInput = $("#currency_input")
        .val()
        .trim();

    // store the new list
    chrome.storage.local.set({ currency: currencyInput });
});

renderPopupSettings();
