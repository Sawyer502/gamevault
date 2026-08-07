const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const gamesDirectory =
    path.join(root, "games");

const imagesDirectory =
    path.join(root, "images");

const outputFile =
    path.join(root, "games.json");


function ensureDirectory(directory) {

    if (!fs.existsSync(directory)) {

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );
    }
}


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
            character =>
                character.toUpperCase()
        );
}


ensureDirectory(
    gamesDirectory
);

ensureDirectory(
    imagesDirectory
);


const files =
    fs.readdirSync(
        gamesDirectory
    )


    .filter(
        file =>
            file
                .toLowerCase()
                .endsWith(".html")
    )


    .sort(
        (a,b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
    );


const games =
    files.map(file => {

        const id =
            file.replace(
                /\.html$/i,
                ""
            );


        const imageExtensions = [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp"
        ];


        let image = null;


        for (
            const extension
            of imageExtensions
        ) {

            const imageName =
                `${id}${extension}`;


            const imagePath =
                path.join(
                    imagesDirectory,
                    imageName
                );


            if (
                fs.existsSync(
                    imagePath
                )
            ) {

                image =
                    `images/${imageName}`;

                break;
            }
        }


        return {

            id,

            title:
                prettifyName(file),

            file:
                `games/${file}`,

            image,

            category:
                "all",

            featured:
                false

        };

    });


fs.writeFileSync(
    outputFile,

    JSON.stringify(
        games,
        null,
        2
    ) + "\n",

    "utf8"
);


console.log(
    `GameVault: generated ${games.length} game(s).`
);
