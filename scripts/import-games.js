const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const METADATA_FILE = path.join(
    __dirname,
    "game-metadata.json"
);


/* =========================================================
   LOAD METADATA
========================================================= */

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

        console.error(error.message);

        process.exit(1);
    }
}


/* =========================================================
   SAVE METADATA
========================================================= */

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


/* =========================================================
   CREATE ID
========================================================= */

function createId(value) {

    return String(value)

        .toLowerCase()

        .replace(
            /\.html$/i,
            ""
        )

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );
}


/* =========================================================
   USAGE
========================================================= */

function showUsage() {

    console.log(`
GameVault Game Importer

Usage:

npm.cmd run import-game -- "GAME NAME" "HTML FILE" "MAIN IMAGE URL" [HOVER IMAGE URLS...]

Example:

npm.cmd run import-game -- "Konkr.io" "games/konkr io.html" "https://example.com/logo.png" "https://example.com/1.jpg" "https://example.com/2.jpg"

The number of hover images is unlimited.

The importer does not download images.
It only stores the image URLs.
`);
}


/* =========================================================
   ARGUMENTS
========================================================= */

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


/* =========================================================
   GAME ID
========================================================= */

/*
 * IMPORTANT:
 *
 * The HTML filename is the permanent ID.
 *
 * Example:
 *
 * games/konkr io.html
 *
 * becomes:
 *
 * konkr-io
 *
 * This matches generate-games.js.
 */

const filename =
    path.basename(
        htmlFile
    );


const id =
    createId(filename);


if (!id) {

    console.error(
        "ERROR: Could not create a valid game ID from the HTML filename."
    );

    process.exit(1);
}


/* =========================================================
   LOAD EXISTING METADATA
========================================================= */

const metadata =
    loadMetadata();


const existing =
    metadata[id] || {};


/* =========================================================
   SAVE GAME
========================================================= */

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
        Boolean(
            existing.featured
        ),

    created:
        existing.created ||
        new Date()
            .toISOString()
            .slice(0, 10)
};


/* =========================================================
   WRITE METADATA
========================================================= */

saveMetadata(metadata);


/* =========================================================
   CHECK GAME FILE
========================================================= */

const gamePath =
    path.join(
        ROOT,
        htmlFile
    );


console.log("");


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


/* =========================================================
   REPORT
========================================================= */

console.log(
    `✓ Game: ${title}`
);

console.log(
    `✓ ID: ${id}`
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
