const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PROXY_DIR = path.join(ROOT, "proxy");

function copyDirectory(source, destination) {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
}

async function main() {
    const { uvPath } = await import("@titaniumnetwork-dev/ultraviolet");
    const { epoxyPath } = await import("@mercuryworkshop/epoxy-transport");
    const { baremuxPath } = await import("@mercuryworkshop/bare-mux/node");

    copyDirectory(uvPath, path.join(PROXY_DIR, "uv"));
    copyDirectory(epoxyPath, path.join(PROXY_DIR, "epoxy"));
    copyDirectory(baremuxPath, path.join(PROXY_DIR, "baremux"));

    console.log("✓ Built Netlify Ultraviolet proxy assets.");
    console.log("  Proxy page: /proxy/");
    console.log("  Transport: wss://wisp.mercurywork.shop/");
}

main().catch((error) => {
    console.error("\nERROR: Failed to build the Ultraviolet proxy.\n");
    console.error(error);
    process.exit(1);
});
