const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PROXY_DIR = path.join(ROOT, "proxy");
const UV_DIR = path.join(PROXY_DIR, "uv");

function copyDirectory(source, destination) {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
}

async function main() {
    const { uvPath } = await import("@titaniumnetwork-dev/ultraviolet");
    const { epoxyPath } = await import("@mercuryworkshop/epoxy-transport");
    const { baremuxPath } = await import("@mercuryworkshop/bare-mux/node");

    copyDirectory(uvPath, UV_DIR);
    copyDirectory(epoxyPath, path.join(PROXY_DIR, "epoxy"));
    copyDirectory(baremuxPath, path.join(PROXY_DIR, "baremux"));

    fs.writeFileSync(
        path.join(UV_DIR, "uv.config.js"),
        `self.__uv$config = {
    prefix: "/proxy/service/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/proxy/uv/uv.handler.js",
    client: "/proxy/uv/uv.client.js",
    bundle: "/proxy/uv/uv.bundle.js",
    config: "/proxy/uv/uv.config.js",
    sw: "/proxy/uv/uv.sw.js",
};
`,
        "utf8"
    );

    console.log("✓ Built Netlify Ultraviolet proxy assets.");
    console.log("  Proxy page: /proxy/");
    console.log("  Transport: wss://wisp.mercurywork.shop/");
}

main().catch((error) => {
    console.error("\nERROR: Failed to build the Ultraviolet proxy.\n");
    console.error(error);
    process.exit(1);
});
