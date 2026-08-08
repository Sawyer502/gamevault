const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const GAMES_DIR = path.join(ROOT, "games");
const GAMES_JSON = path.join(ROOT, "games.json");
const GAME_METADATA = path.join(
    ROOT,
    "scripts",
    "game-metadata.json"
);


/*
 * Make sure the directories/files exist.
 */

if (!fs.existsSync(GAMES_DIR)) {
    fs.mkdirSync(GAMES_DIR, {
        recursive: true
    });
}


if (!fs.existsSync(GAME_METADATA)) {
    fs.writeFileSync(
        GAME_METADATA,
        "{}\n",
        "utf8"
    );
}


/*
 * Load metadata created by import-games.js.
 */

let metadata = {};

try {

    const content =
        fs.readFileSync(
            GAME_METADATA,
            "utf8"
        ).trim();

    if (content) {
        metadata = JSON.parse(content);
    }

} catch (error) {

    console.error(
        "ERROR: game-metadata.json is invalid."
    );

    process.exit(1);
}


/*
 * Turn a filename into a readable title.
 */

function prettifyName(filename) {

    return filename
        .replace(
            /\.html$/i,
            ""
        )

        .replace(
            /[-_]+/g,
            " "
        )

        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


/*
 * Create a safe ID.
 */

function createId(filename) {

    return filename
        .replace(
            /\.html$/i,
            ""
        )

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
 * Find every HTML game.
 */

const files =
    fs.readdirSync(GAMES_DIR)
        .filter(file =>
            file
                .toLowerCase()
                .endsWith(".html")
        )
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
        );


/*
 * Generate games.json.
 */

const games = files.map(file => {

    const id =
        createId(file);


    /*
     * Find metadata supplied by
     * import-games.js.
     */
    const info =
        metadata[id] || {};


    return {

        id,

        title:
            info.title ||
            prettifyName(file),

        file:
            `games/${file}`,

        image:
            info.image ||
            "",

        hoverImages:
            Array.isArray(
                info.hoverImages
            )
                ? info.hoverImages
                : [],

        category:
            info.category ||
            "all",

        featured:
            Boolean(
                info.featured
            ),

        created:
            info.created ||
            new Date()
                .toISOString()
                .slice(0, 10)

    };

});


/*
 * Write the automatically generated
 * games.json.
 */

fs.writeFileSync(

    GAMES_JSON,

    JSON.stringify(
        games,
        null,
        2
    ) + "\n",

    "utf8"
);


console.log(
    `✓ Generated games.json with ${games.length} game(s).`
);
