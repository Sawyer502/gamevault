const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const GAMES_DIR =
    path.join(
        ROOT,
        "games"
    );

const GAMES_JSON =
    path.join(
        ROOT,
        "games.json"
    );

const GAME_METADATA =
    path.join(
        ROOT,
        "scripts",
        "game-metadata.json"
    );


/* =========================================================
   SETUP
========================================================= */

if (!fs.existsSync(GAMES_DIR)) {

    fs.mkdirSync(
        GAMES_DIR,
        {
            recursive: true
        }
    );
}


if (!fs.existsSync(GAME_METADATA)) {

    fs.writeFileSync(
        GAME_METADATA,
        "{}\n",
        "utf8"
    );
}


/* =========================================================
   LOAD METADATA
========================================================= */

let metadata = {};


try {

    const content =
        fs
            .readFileSync(
                GAME_METADATA,
                "utf8"
            )
            .trim();


    if (content) {

        metadata =
            JSON.parse(content);
    }

} catch (error) {

    console.error(
        "\nERROR: game-metadata.json is invalid.\n"
    );

    console.error(
        error.message
    );

    process.exit(1);
}


/* =========================================================
   CLEAN IMAGE URL
========================================================= */

function cleanImageUrl(value) {

    if (!value) {
        return "";
    }


    let url =
        String(value).trim();


    if (!url) {
        return "";
    }


    /*
     * Handle Markdown:
     *
     * [https://example.com/image.png](https://example.com/image.png)
     */

    const markdownMatch =
        url.match(
            /^\[.*?\]\((.*?)\)$/
        );


    if (markdownMatch) {

        url =
            markdownMatch[1].trim();
    }


    /*
     * Remove accidental whitespace.
     */

    url =
        url.replace(
            /\s+/g,
            ""
        );


    return url;
}


/* =========================================================
   CLEAN HOVER IMAGES
========================================================= */

function cleanHoverImages(value) {

    if (!Array.isArray(value)) {
        return [];
    }


    return value

        .map(
            cleanImageUrl
        )

        .filter(Boolean);
}


/* =========================================================
   PRETTIFY NAME
========================================================= */

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
            char =>
                char.toUpperCase()
        );
}


/* =========================================================
   CREATE ID
========================================================= */

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


/* =========================================================
   FIND GAMES
========================================================= */

const files =

    fs
        .readdirSync(
            GAMES_DIR
        )

        .filter(
            file =>
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


/* =========================================================
   GENERATE GAMES
========================================================= */

const games =

    files.map(
        file => {

            /*
             * The filename is the source of truth.
             */

            const id =
                createId(file);


            /*
             * Find metadata using
             * the same ID as the importer.
             */

            const info =
                metadata[id] || {};


            /*
             * Title.
             */

            const title =
                info.title ||
                prettifyName(file);


            /*
             * Images.
             */

            const image =
                cleanImageUrl(
                    info.image
                );


            const hoverImages =
                cleanHoverImages(
                    info.hoverImages
                );


            /*
             * Created date.
             */

            const created =
                info.created ||

                new Date()
                    .toISOString()
                    .slice(0, 10);


            /*
             * Final game object.
             */

            return {

                id,

                title,

                /*
                 * Root-relative path.
                 */

                file:
                    `/games/${encodeURIComponent(file)}`,

                image,

                hoverImages,

                category:
                    info.category ||
                    "all",

                featured:
                    Boolean(
                        info.featured
                    ),

                created
            };
        }
    );


/* =========================================================
   WRITE GAMES.JSON
========================================================= */

fs.writeFileSync(

    GAMES_JSON,

    JSON.stringify(
        games,
        null,
        2
    ) + "\n",

    "utf8"
);


/* =========================================================
   REPORT
========================================================= */

console.log(
    `\n✓ Generated games.json with ${games.length} game(s).\n`
);


if (games.length > 0) {

    console.log(
        "Games found:"
    );


    games.forEach(
        game => {

            console.log(
                `  • ${game.title} (${game.id})`
            );
        }
    );


    console.log("");


} else {

    console.log(
        "⚠ No .html games were found in the games folder."
    );

    console.log(
        `  Checked: ${GAMES_DIR}\n`
    );
}
