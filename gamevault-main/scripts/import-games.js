const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const METADATA_FILE = path.join(
    __dirname,
    "game-metadata.json"
);

/*
 * Load existing metadata.
 */

function loadMetadata() {

    if (!fs.existsSync(METADATA_FILE)) {
        return {};
    }

    const content =
        fs.readFileSync(
            METADATA_FILE,
            "utf8"
        ).trim();

    if (!content) {
        return {};
    }

    try {

        return JSON.parse(content);

    } catch (error) {

        console.error(
            "ERROR: game-metadata.json contains invalid JSON."
        );

        process.exit(1);
    }
}

/*
 * Save metadata.
 */

function saveMetadata(metadata) {

    fs.writeFileSync(
        METADATA_FILE,

        JSON.stringify(
            metadata,
            null,
            2
        ) + "\n",

        "utf8"
    );
}

/*
 * Create an ID from the game title.
 */

function createId(value) {

    return String(value)

        .toLowerCase()

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );
}

/*
 * Usage information.
 */

function showUsage() {

    console.log(`
GameVault Game Importer

Usage:

npm.cmd run import-game -- "GAME NAME" "HTML FILE" "MAIN IMAGE URL" [HOVER IMAGE URLS...]

Example:

npm.cmd run import-game -- "Konkr.io" "games/konkr io.html" "https://example.com/logo.png" "https://example.com/1.jpg" "https://example.com/2.jpg"

The number of hover images is unlimited.

You can provide:

0 hover images
1 hover image
2 hover images
4 hover images
10 hover images
etc.

The importer DOES NOT download images.

It only stores the URLs.
`);

}

/*
 * Read command-line arguments.
 */

const args =
    process.argv.slice(2);

if (args.length < 3) {

    showUsage();

    process.exit(1);
}

const title =
    args[0];

const htmlFile =
    args[1];

const mainImage =
    args[2];

/*
 * Everything after the first three
 * arguments is a hover image.
 */

const hoverImages =
    args
        .slice(3)
        .filter(Boolean);

/*
 * Create the ID.
 */

const id =
    createId(title);

/*
 * Load existing metadata.
 */

const metadata =
    loadMetadata();

/*
 * Preserve existing information
 * when updating a game.
 */

const existing =
    metadata[id] || {};

/*
 * Save the game information.
 */

metadata[id] = {

    title,

    file:
        htmlFile,

    image:
        mainImage,

    hoverImages,

    category:
        existing.category ||
        "all",

    featured:
        existing.featured ||
        false,

    created:
        existing.created ||
        new Date()
            .toISOString()
            .slice(0, 10)
};

/*
 * Write metadata.
 */

saveMetadata(metadata);

/*
 * Make sure the game file exists.
 */

const gamePath =
    path.join(
        ROOT,
        htmlFile
    );

if (!fs.existsSync(gamePath)) {

    console.warn(
        `⚠ Warning: ${htmlFile} was not found.`
    );

    console.warn(
        "The metadata was still saved."
    );

} else {

    console.log(
        `✓ Found game file: ${htmlFile}`
    );
}

/*
 * Display what was imported.
 */

console.log("");

console.log(
    `✓ Game: ${title}`
);

console.log(
    `✓ Main image: ${mainImage}`
);

console.log(
    `✓ Hover images: ${hoverImages.length}`
);

console.log(
    "✓ Metadata saved."
);

console.log("");

console.log(
    "Now run:"
);

console.log("");

console.log(
    "npm.cmd run build"
);

console.log("");