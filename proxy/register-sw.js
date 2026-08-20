"use strict";

async function registerSW() {
    if (!navigator.serviceWorker) {
        throw new Error("This browser does not support service workers.");
    }

    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        throw new Error("Ultraviolet requires HTTPS on deployed sites.");
    }

    await navigator.serviceWorker.register("/proxy/uv/sw.js", {
        scope: "/proxy/"
    });
}
