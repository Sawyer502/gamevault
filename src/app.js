let games = [];
let filteredGames = [];
let currentGame = null;
let currentCategory = "all";


const elements = {

    gamesGrid:
        document.getElementById(
            "gamesGrid"
        ),

    gameSearch:
        document.getElementById(
            "gameSearch"
        ),

    gameCount:
        document.getElementById(
            "gameCount"
        ),

    heroGameCount:
        document.getElementById(
            "heroGameCount"
        ),

    loadingState:
        document.getElementById(
            "loadingState"
        ),

    emptyState:
        document.getElementById(
            "emptyState"
        ),

    clearSearchButton:
        document.getElementById(
            "clearSearchButton"
        ),


    gamePlayer:
        document.getElementById(
            "gamePlayer"
        ),

    gameFrame:
        document.getElementById(
            "gameFrame"
        ),

    playerTitle:
        document.getElementById(
            "playerTitle"
        ),

    playerGameIcon:
        document.getElementById(
            "playerGameIcon"
        ),


    browseButton:
        document.getElementById(
            "browseButton"
        ),

    luckyButton:
        document.getElementById(
            "luckyButton"
        ),

    randomGameButton:
        document.getElementById(
            "randomGameButton"
        ),


    closeGameButton:
        document.getElementById(
            "closeGameButton"
        ),

    fullscreenButton:
        document.getElementById(
            "fullscreenButton"
        ),

    reloadGameButton:
        document.getElementById(
            "reloadGameButton"
        ),


    themeButton:
        document.getElementById(
            "themeButton"
        )
};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    setupEvents();

    loadTheme();

    await loadGames();

    openGameFromHash();
}


/* =========================================================
   GAME LOADING
========================================================= */

async function loadGames() {

    showLoading(true);


    try {

        /*
         * IMPORTANT:
         *
         * games.json is at the website root.
         */

        const response =
            await fetch(
                "/games.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `games.json returned ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "games.json must contain an array."
            );
        }


        games =
            data

                .filter(
                    game =>
                        game &&
                        typeof game === "object"
                )

                .map(
                    normalizeGame
                );


        filteredGames =
            [...games];


        updateGameCounts();

        renderGames();


    } catch (error) {

        console.error(
            "GameVault failed to load games:",
            error
        );


        games = [];

        filteredGames = [];


        if (elements.gamesGrid) {

            elements.gamesGrid.innerHTML =
                "";
        }


        if (elements.emptyState) {

            elements.emptyState.hidden =
                false;
        }


        updateGameCounts();

        updateGameCount();


    } finally {

        showLoading(false);
    }
}


/* =========================================================
   NORMALIZE GAME
========================================================= */

function normalizeGame(game) {

    const id =
        String(
            game.id ||
            game.title ||
            "game"
        ).trim();


    const title =
        String(
            game.title ||
            prettifyName(id)
        ).trim();


    /* =====================================================
       IMAGE PATH
    ===================================================== */

    function normalizeImage(image) {

        if (!image) {
            return null;
        }


        const value =
            String(image).trim();


        if (!value) {
            return null;
        }


        /*
         * External image.
         */

        if (

            value.startsWith(
                "http://"
            ) ||

            value.startsWith(
                "https://"
            ) ||

            value.startsWith(
                "//"
            ) ||

            value.startsWith(
                "data:"
            )

        ) {

            return value;
        }


        /*
         * Already root-relative.
         */

        if (
            value.startsWith("/")
        ) {

            return value;
        }


        /*
         * images/example.png
         *
         * becomes
         *
         * /images/example.png
         */

        if (
            value.startsWith(
                "images/"
            )
        ) {

            return `/${value}`;
        }


        /*
         * ../images/example.png
         */

        if (
            value.startsWith(
                "../images/"
            )
        ) {

            return value.replace(
                /^\.\.\//,
                "/"
            );
        }


        /*
         * Anything else.
         */

        return `/${value}`;
    }


    /* =====================================================
       GAME FILE
    ===================================================== */

    function normalizeGameFile(file) {

        if (!file) {

            return `/games/${encodeURIComponent(
                id + ".html"
            )}`;
        }


        const value =
            String(file).trim();


        if (!value) {

            return `/games/${encodeURIComponent(
                id + ".html"
            )}`;
        }


        /*
         * External game URL.
         */

        if (

            value.startsWith(
                "http://"
            ) ||

            value.startsWith(
                "https://"
            ) ||

            value.startsWith(
                "//"
            )

        ) {

            return value;
        }


        /*
         * Already root-relative.
         */

        if (
            value.startsWith("/")
        ) {

            return value;
        }


        /*
         * games/example.html
         *
         * becomes
         *
         * /games/example.html
         */

        if (
            value.startsWith(
                "games/"
            )
        ) {

            return `/${value
                .split("/")
                .map(
                    part =>
                        encodeURIComponent(
                            part
                        )
                )
                .join("/")}`;
        }


        /*
         * ../games/example.html
         */

        if (
            value.startsWith(
                "../games/"
            )
        ) {

            const clean =
                value.replace(
                    /^\.\.\//,
                    ""
                );


            return `/${clean
                .split("/")
                .map(
                    part =>
                        encodeURIComponent(
                            part
                        )
                )
                .join("/")}`;
        }


        return `/${value}`;
    }


    const image =
        normalizeImage(
            game.image
        );


    const hoverImages =

        Array.isArray(
            game.hoverImages
        )

            ? game.hoverImages

                .map(
                    normalizeImage
                )

                .filter(Boolean)

            : [];


    return {

        ...game,

        id,

        title,

        file:
            normalizeGameFile(
                game.file
            ),

        image,

        hoverImages,

        category:
            game.category ||
            "all",

        featured:
            Boolean(
                game.featured
            ),

        created:
            game.created ||
            null
    };
}


/* =========================================================
   NAME FORMATTING
========================================================= */

function prettifyName(name) {

    return String(name)

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


/* =========================================================
   RENDER GAMES
========================================================= */

function renderGames() {

    if (!elements.gamesGrid) {
        return;
    }


    elements.gamesGrid.innerHTML =
        "";


    if (!filteredGames.length) {

        if (elements.emptyState) {

            elements.emptyState.hidden =
                false;
        }


        elements.gamesGrid.style.display =
            "none";


        updateGameCount();

        return;
    }


    if (elements.emptyState) {

        elements.emptyState.hidden =
            true;
    }


    elements.gamesGrid.style.display =
        "grid";


    filteredGames.forEach(
        (game, index) => {

            const card =
                createGameCard(
                    game,
                    index
                );


            elements.gamesGrid.appendChild(
                card
            );
        }
    );


    updateGameCount();
}


/* =========================================================
   GAME CARD
========================================================= */

function createGameCard(
    game,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "game-card";


    card.tabIndex =
        0;


    card.style.animationDelay =
        `${Math.min(
            index * 35,
            350
        )}ms`;


    card.innerHTML = `

        <div class="game-image">

            ${createGameImage(game)}

        </div>


        <div class="game-info">

            <div class="game-name-wrapper">

                <div
                    class="game-name"
                    title="${escapeHTML(
                        game.title
                    )}"
                >
                    ${escapeHTML(
                        game.title
                    )}
                </div>


                <div class="game-meta">

                    ${escapeHTML(
                        getGameMeta(game)
                    )}

                </div>

            </div>


            <button
                class="play-button"
                type="button"
                aria-label="Play ${escapeAttribute(
                    game.title
                )}"
            >
                ▶
            </button>

        </div>
    `;


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".play-button"
                )
            ) {

                event.stopPropagation();
            }


            openGame(game);
        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (

                event.key ===
                    "Enter" ||

                event.key ===
                    " "

            ) {

                event.preventDefault();

                openGame(game);
            }
        }
    );


    setupGameImageSlideshow(
        card
    );


    return card;
}


/* =========================================================
   CREATE GAME IMAGE
========================================================= */

function createGameImage(game) {

    const images = [

        game.image,

        ...(
            Array.isArray(
                game.hoverImages
            )

                ? game.hoverImages

                : []
        )

    ].filter(Boolean);


    if (!images.length) {

        return `

            <div class="game-placeholder">
                ✦
            </div>

        `;
    }


    return images

        .map(
            (
                image,
                index
            ) => `

                <img
                    class="${
                        index === 0
                            ? "active"
                            : ""
                    }"

                    src="${escapeAttribute(
                        image
                    )}"

                    alt="${escapeAttribute(
                        game.title
                    )}"

                    loading="${
                        index === 0
                            ? "eager"
                            : "lazy"
                    }"

                    data-image-index="${index}"

                    onerror="this.style.display='none'"
                >

            `
        )

        .join("");
}


/* =========================================================
   IMAGE SLIDESHOW
========================================================= */

function setupGameImageSlideshow(
    card
) {

    const imageContainer =
        card.querySelector(
            ".game-image"
        );


    if (!imageContainer) {
        return;
    }


    const images =
        Array.from(
            imageContainer.querySelectorAll(
                "img"
            )
        );


    if (images.length <= 1) {
        return;
    }


    let currentIndex =
        0;

    let slideshowTimer =
        null;


    function showImage(index) {

        images.forEach(
            (
                image,
                imageIndex
            ) => {

                image.classList.toggle(
                    "active",
                    imageIndex ===
                        index
                );
            }
        );


        currentIndex =
            index;
    }


    function startSlideshow() {

        if (
            slideshowTimer !== null
        ) {
            return;
        }


        showImage(0);


        slideshowTimer =
            window.setInterval(
                () => {

                    const nextIndex =
                        (
                            currentIndex +
                            1
                        ) %
                        images.length;


                    showImage(
                        nextIndex
                    );

                },
                2200
            );
    }


    function stopSlideshow() {

        if (
            slideshowTimer !== null
        ) {

            window.clearInterval(
                slideshowTimer
            );


            slideshowTimer =
                null;
        }


        showImage(0);
    }


    card.addEventListener(
        "mouseenter",
        startSlideshow
    );


    card.addEventListener(
        "mouseleave",
        stopSlideshow
    );
}


/* =========================================================
   GAME META
========================================================= */

function getGameMeta(game) {

    if (game.featured) {
        return "Featured";
    }


    if (

        game.category &&

        game.category !==
            "all"

    ) {

        return prettifyName(
            game.category
        );
    }


    return "Play now";
}


/* =========================================================
   SEARCH
========================================================= */

function searchGames(query) {

    const normalized =
        String(
            query || ""
        )
            .trim()
            .toLowerCase();


    filteredGames =

        games.filter(
            game => {

                const matchesSearch =

                    !normalized ||

                    game.title
                        .toLowerCase()
                        .includes(
                            normalized
                        ) ||

                    game.id
                        .toLowerCase()
                        .includes(
                            normalized
                        );


                const matchesCategory =
                    matchesCurrentCategory(
                        game
                    );


                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );


    renderGames();
}


/* =========================================================
   CATEGORY
========================================================= */

function matchesCurrentCategory(
    game
) {

    if (
        currentCategory ===
        "all"
    ) {

        return true;
    }


    if (
        currentCategory ===
        "featured"
    ) {

        return Boolean(
            game.featured
        );
    }


    if (
        currentCategory ===
        "new"
    ) {

        if (!game.created) {
            return false;
        }


        const created =
            new Date(
                game.created
            );


        const sevenDaysAgo =
            Date.now() -
            7 *
                24 *
                60 *
                60 *
                1000;


        return (

            !Number.isNaN(
                created.getTime()
            ) &&

            created.getTime() >=
                sevenDaysAgo
        );
    }


    return (
        game.category ===
        currentCategory
    );
}


/* =========================================================
   OPEN GAME
========================================================= */

function openGame(game) {

    if (
        !game ||
        !game.file
    ) {

        return;
    }


    currentGame =
        game;


    elements.playerTitle.textContent =
        game.title;


    elements.playerGameIcon.textContent =
        getInitial(
            game.title
        );


    elements.gameFrame.src =
        game.file;


    elements.gamePlayer.classList.add(
        "open"
    );


    elements.gamePlayer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "player-open"
    );


    history.pushState(
        {
            game: game.id
        },

        "",

        `#play=${encodeURIComponent(
            game.id
        )}`
    );
}


/* =========================================================
   OPEN FROM HASH
========================================================= */

function openGameFromHash() {

    const hash =
        window.location.hash;


    if (
        !hash.startsWith(
            "#play="
        )
    ) {

        return;
    }


    const id =
        decodeURIComponent(
            hash.substring(6)
        );


    const game =
        games.find(
            item =>
                item.id ===
                id
        );


    if (game) {

        openGameWithoutHistory(
            game
        );
    }
}


/* =========================================================
   OPEN WITHOUT HISTORY
========================================================= */

function openGameWithoutHistory(
    game
) {

    currentGame =
        game;


    elements.playerTitle.textContent =
        game.title;


    elements.playerGameIcon.textContent =
        getInitial(
            game.title
        );


    elements.gameFrame.src =
        game.file;


    elements.gamePlayer.classList.add(
        "open"
    );


    elements.gamePlayer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "player-open"
    );
}


/* =========================================================
   CLOSE GAME
========================================================= */

function closeGame(
    updateHistory = true
) {

    elements.gamePlayer.classList.remove(
        "open"
    );


    elements.gamePlayer.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "player-open"
    );


    elements.gameFrame.src =
        "about:blank";


    currentGame =
        null;


    if (
        updateHistory &&
        window.location.hash
    ) {

        history.pushState(
            {},

            "",

            window.location.pathname +
            window.location.search
        );
    }
}


/* =========================================================
   RELOAD GAME
========================================================= */

function reloadGame() {

    if (!currentGame) {
        return;
    }


    const file =
        currentGame.file;


    elements.gameFrame.src =
        "about:blank";


    window.setTimeout(
        () => {

            elements.gameFrame.src =
                file;

        },
        20
    );
}


/* =========================================================
   FULLSCREEN
========================================================= */

async function fullscreenGame() {

    try {

        if (
            document.fullscreenElement
        ) {

            await document.exitFullscreen();

            return;
        }


        if (
            elements.gameFrame
                .requestFullscreen
        ) {

            await elements.gameFrame
                .requestFullscreen();

            return;
        }


        if (
            elements.gamePlayer
                .requestFullscreen
        ) {

            await elements.gamePlayer
                .requestFullscreen();
        }


    } catch (error) {

        console.warn(
            "Fullscreen unavailable:",
            error
        );
    }
}


/* =========================================================
   RANDOM GAME
========================================================= */

function openRandomGame() {

    if (!games.length) {
        return;
    }


    const index =
        Math.floor(
            Math.random() *
            games.length
        );


    openGame(
        games[index]
    );
}


/* =========================================================
   COUNTERS
========================================================= */

function updateGameCounts() {

    if (
        elements.heroGameCount
    ) {

        elements.heroGameCount.textContent =
            games.length;
    }
}


function updateGameCount() {

    if (
        !elements.gameCount
    ) {

        return;
    }


    const amount =
        filteredGames.length;


    elements.gameCount.textContent =

        `${amount} ${
            amount === 1
                ? "game"
                : "games"
        }`;
}


/* =========================================================
   LOADING
========================================================= */

function showLoading(show) {

    if (
        elements.loadingState
    ) {

        elements.loadingState.hidden =
            !show;
    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            "gamevault-theme"
        );


    if (
        theme === "light"
    ) {

        document.body.classList.add(
            "light"
        );


        elements.themeButton.textContent =
            "☾";

    } else {

        elements.themeButton.textContent =
            "☼";
    }
}


function toggleTheme() {

    const light =
        document.body.classList.toggle(
            "light"
        );


    localStorage.setItem(
        "gamevault-theme",

        light
            ? "light"
            : "dark"
    );


    elements.themeButton.textContent =

        light
            ? "☾"
            : "☼";
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /*
     * Search.
     */

    elements.gameSearch.addEventListener(
        "input",
        event => {

            searchGames(
                event.target.value
            );
        }
    );


    /*
     * Clear search.
     */

    elements.clearSearchButton.addEventListener(
        "click",
        () => {

            elements.gameSearch.value =
                "";

            searchGames("");

            elements.gameSearch.focus();
        }
    );


    /*
     * Browse Games.
     */

    elements.browseButton.addEventListener(
        "click",
        () => {

            const gamesSection =
                document.getElementById(
                    "games"
                );


            if (!gamesSection) {
                return;
            }


            gamesSection.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start"
            });
        }
    );


    /*
     * Lucky.
     */

    elements.luckyButton.addEventListener(
        "click",
        openRandomGame
    );


    /*
     * Navbar Random.
     */

    elements.randomGameButton.addEventListener(
        "click",
        openRandomGame
    );


    /*
     * Close.
     */

    elements.closeGameButton.addEventListener(
        "click",
        () =>
            closeGame()
    );


    /*
     * Reload.
     */

    elements.reloadGameButton.addEventListener(
        "click",
        reloadGame
    );


    /*
     * Fullscreen.
     */

    elements.fullscreenButton.addEventListener(
        "click",
        fullscreenGame
    );


    /*
     * Theme.
     */

    elements.themeButton.addEventListener(
        "click",
        toggleTheme
    );


    /*
     * Categories.
     */

    document
        .querySelectorAll(
            ".category-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".category-button"
                            )
                            .forEach(
                                other => {

                                    other.classList.remove(
                                        "active"
                                    );
                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        currentCategory =
                            button.dataset.category ||
                            "all";


                        searchGames(
                            elements
                                .gameSearch
                                .value
                        );
                    }
                );
            }
        );


    /*
     * Keyboard controls.
     */

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Escape closes game.
             */

            if (

                event.key ===
                    "Escape" &&

                elements.gamePlayer
                    .classList
                    .contains(
                        "open"
                    )

            ) {

                closeGame();

                return;
            }


            /*
             * "/" focuses search.
             */

            const tag =
                document.activeElement
                    ?.tagName;


            if (

                event.key ===
                    "/" &&

                tag !== "INPUT" &&
                tag !== "TEXTAREA" &&
                tag !== "SELECT"

            ) {

                event.preventDefault();

                elements.gameSearch.focus();
            }
        }
    );


    /*
     * Browser back/forward.
     */

    window.addEventListener(
        "popstate",
        () => {

            const hash =
                window.location.hash;


            if (
                hash.startsWith(
                    "#play="
                )
            ) {

                const id =
                    decodeURIComponent(
                        hash.substring(6)
                    );


                const game =
                    games.find(
                        item =>
                            item.id ===
                            id
                    );


                if (game) {

                    openGameWithoutHistory(
                        game
                    );

                    return;
                }
            }


            if (
                elements.gamePlayer
                    .classList
                    .contains(
                        "open"
                    )
            ) {

                closeGame(false);
            }
        }
    );
}


/* =========================================================
   HELPERS
========================================================= */

function getInitial(text) {

    return (

        String(
            text || "G"
        )
            .trim()
            .charAt(0)
            .toUpperCase() ||

        "G"
    );
}


function escapeHTML(value) {

    return String(value)

        .replace(
            /[&<>"']/g,

            character => ({

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#039;"

            })[character]
        );
}


function escapeAttribute(value) {

    return escapeHTML(value);
}
