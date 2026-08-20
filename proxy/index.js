"use strict";

const form = document.getElementById("proxy-form");
const address = document.getElementById("address");
const button = document.getElementById("go");
const error = document.getElementById("error");
const frame = document.getElementById("frame");

const WISP_URL = "wss://wisp.mercurywork.shop/";
const connection = new BareMux.BareMuxConnection("/proxy/baremux/worker.js");

function normalizeUrl(value) {
    const input = value.trim();

    if (!input) {
        return null;
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(input)) {
        return input;
    }

    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) {
        return `https://${input}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    button.disabled = true;

    try {
        await registerSW();

        if ((await connection.getTransport()) !== "/proxy/epoxy/index.mjs") {
            await connection.setTransport("/proxy/epoxy/index.mjs", [
                { wisp: WISP_URL }
            ]);
        }

        const url = normalizeUrl(address.value);
        if (!url) {
            throw new Error("Enter a website or search term.");
        }

        frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
        frame.style.display = "block";
    } catch (err) {
        error.textContent = err instanceof Error ? err.message : String(err);
        console.error(err);
    } finally {
        button.disabled = false;
    }
});
