/* =========================================================
   GAMEVAULT
   Main application
========================================================= */


/* =========================================================
   STATE
========================================================= */

let games = [];

let filteredGames = [];

let currentGame = null;

let currentCategory = "all";


/* =========================================================
   ELEMENTS
========================================================= */

const elements = {

    gamesGrid:
        document.getElementById("gamesGrid"),

    gameSearch:
        document.getElementById("gameSearch"),

    gameCount:
        document.getElementById("gameCount"),

    heroGameCount:
        document.getElementById("heroGameCount"),

    loadingState:
        document.getElementById("loadingState"),

    emptyState:
        document.getElementById("emptyState"),

    clearSearchButton:
        document.getElementById("clearSearchButton"),

    gamePlayer:
        document.getElementById("gamePlayer"),

    gameFrame:
        document.getElementById("gameFrame"),

    playerTitle:
        document.getElementById("playerTitle"),

    playerGameIcon:
        document.getElementById("playerGameIcon"),

    browseButton:
        document.getElementById("browseButton"),

    luckyButton:
        document.getElementById("luckyButton"),

    randomGameButton:
        document.getElementById("randomGameButton"),

    closeGameButton:
        document.getElementById("closeGameButton"),

    fullscreenButton:
        document.getElementById("fullscreenButton"),

    reloadGameButton:
        document.getElementById("reloadGameButton"),

    themeButton:
        document.getElementById("themeButton")

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    setupEvents();

    loadTheme();

    await loadGames();

}


/* =========================================================
   LOAD GAMES
========================================================= */

async function loadGames() {

    showLoading(true);

    try {

        const response =
            await fetch(
                "games.json",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Could not load games.json"
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "games.json is not an array"
            );

        }


        games = data.map(
            normalizeGame
        );


        filteredGames =
            [...games];


        updateGameCounts();

        renderGames();


    } catch (error) {

        console.error(
            "GameVault:",
            error
        );

        games = [];

        filteredGames = [];

        renderGames();

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
        );


    const title =
        game.title ||
        prettifyName(id);


    return {

        id,

        title,

        file:
            game.file ||
            `games/${id}.html`,

        image:
            game.image ||
            null,

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
   PRETTY GAME NAME
========================================================= */

function prettifyName(name) {

    return name

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

    elements.gamesGrid.innerHTML = "";


    if (
        filteredGames.length === 0
    ) {

        elements.emptyState.hidden =
            false;

        elements.gamesGrid.style.display =
            "none";

        updateGameCount();

        return;

    }


    elements.emptyState.hidden =
        true;

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
   CREATE GAME CARD
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


    card.tabIndex = 0;


    card.style.animationDelay =
        `${Math.min(index * 35, 350)}ms`;


    const imageHTML =
        createGameImage(
            game
        );


    card.innerHTML = `

        <div class="game-image">

            ${imageHTML}

        </div>


        <div class="game-info">

            <div class="game-name-wrapper">

                <div
                    class="game-name"
                    title="${escapeHTML(game.title)}"
                >
                    ${escapeHTML(game.title)}
                </div>

                <div class="game-meta">
                    ${getGameMeta(game)}
                </div>

            </div>


            <button
                class="play-button"
                type="button"
                aria-label="Play ${escapeHTML(game.title)}"
            >
                ▶
            </button>

        </div>

    `;


    card.addEventListener(
        "click",
        () => openGame(game)
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openGame(game);

            }

        }
    );


    return card;

}


/* =========================================================
   GAME IMAGE
========================================================= */

function createGameImage(game) {

    if (!game.image) {

        return `

            <div
                class="game-placeholder"
                aria-label="No game image"
            >
                ✦
            </div>

        `;

    }


    return `

        <img
            src="${escapeAttribute(game.image)}"
            alt="${escapeAttribute(game.title)}"
            loading="lazy"
            onerror="this.parentElement.innerHTML =
                '<div class=&quot;game-placeholder&quot;>✦</div>'"
        >

    `;

}


/* =========================================================
   GAME META
========================================================= */

function getGameMeta(game) {

    if (game.featured) {

        return "Featured";

    }


    if (game.category &&
        game.category !== "all") {

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
        query
            .trim()
            .toLowerCase();


    filteredGames =
        games.filter(
            game => {

                const matchesSearch =
                    !normalized ||
                    game.title
                        .toLowerCase()
                        .includes(normalized) ||
                    game.id
                        .toLowerCase()
                        .includes(normalized);


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

function matchesCurrentCategory(game) {

    if (
        currentCategory === "all"
    ) {

        return true;

    }


    if (
        currentCategory === "featured"
    ) {

        return Boolean(
            game.featured
        );

    }


    if (
        currentCategory === "new"
    ) {

        return true;

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

    if (!game || !game.file) {

        return;

    }


    currentGame = game;


    elements.playerTitle.textContent =
        game.title;


    elements.playerGameIcon.textContent =
        getInitial(game.title);


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


    window.history.pushState(
        {
            game: game.id
        },
        "",
        `#play=${encodeURIComponent(game.id)}`
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


    currentGame = null;


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


    elements.gameFrame.src =
        currentGame.file;

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
            elements.gameFrame.requestFullscreen
        ) {

            await elements.gameFrame.requestFullscreen();

            return;

        }


        if (
            elements.gamePlayer.requestFullscreen
        ) {

            await elements.gamePlayer.requestFullscreen();

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


    const randomIndex =
        Math.floor(
            Math.random() *
            games.length
        );


    openGame(
        games[randomIndex]
    );

}


/* =========================================================
   COUNTS
========================================================= */

function updateGameCounts() {

    elements.heroGameCount.textContent =
        games.length;

}


function updateGameCount() {

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

    elements.loadingState.hidden =
        !show;

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "gamevault-theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light"
        );

        elements.themeButton.textContent =
            "☾";

    }

}


function toggleTheme() {

    const isLight =
        document.body.classList.toggle(
            "light"
        );


    localStorage.setItem(
        "gamevault-theme",
        isLight
            ? "light"
            : "dark"
    );


    elements.themeButton.textContent =
        isLight
            ? "☾"
            : "☼";

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    /* SEARCH */

    elements.gameSearch.addEventListener(
        "input",
        event => {

            searchGames(
                event.target.value
            );

        }
    );


    /* CLEAR SEARCH */

    elements.clearSearchButton.addEventListener(
        "click",
        () => {

            elements.gameSearch.value =
                "";

            searchGames("");

            elements.gameSearch.focus();

        }
    );


    /* BROWSE */

    elements.browseButton.addEventListener(
        "click",
        () => {

            document
                .getElementById("games")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    /* LUCKY */

    elements.luckyButton.addEventListener(
        "click",
        openRandomGame
    );


    /* NAV RANDOM */

    elements.randomGameButton.addEventListener(
        "click",
        openRandomGame
    );


    /* CLOSE */

    elements.closeGameButton.addEventListener(
        "click",
        () => closeGame()
    );


    /* RELOAD */

    elements.reloadGameButton.addEventListener(
        "click",
        reloadGame
    );


    /* FULLSCREEN */

    elements.fullscreenButton.addEventListener(
        "click",
        fullscreenGame
    );


    /* THEME */

    elements.themeButton.addEventListener(
        "click",
        toggleTheme
    );


    /* CATEGORY */

    document
        .querySelectorAll(
            ".category-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".category-button"
                        )
                        .forEach(
                            other =>
                                other.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category;


                    searchGames(
                        elements.gameSearch.value
                    );

                }
            );

        });


    /* ESCAPE */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                elements.gamePlayer.classList.contains(
                    "open"
                )
            ) {

                closeGame();

            }


            /* "/" focuses search */

            if (
                event.key === "/" &&
                document.activeElement.tagName !==
                    "INPUT" &&
                document.activeElement.tagName !==
                    "TEXTAREA"
            ) {

                event.preventDefault();

                elements.gameSearch.focus();

            }

        }
    );


    /* BACK BUTTON */

    window.addEventListener(
        "popstate",
        () => {

            if (
                elements.gamePlayer.classList.contains(
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
        String(text || "G")
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

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            })[character]
        );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}
