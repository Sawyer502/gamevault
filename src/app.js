```javascript
let games = [];
let filteredGames = [];
let currentGame = null;
let currentCategory = "all";

const elements = {
    gamesGrid: document.getElementById("gamesGrid"),
    gameSearch: document.getElementById("gameSearch"),
    gameCount: document.getElementById("gameCount"),
    heroGameCount: document.getElementById("heroGameCount"),
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    clearSearchButton: document.getElementById("clearSearchButton"),

    gamePlayer: document.getElementById("gamePlayer"),
    gameFrame: document.getElementById("gameFrame"),
    playerTitle: document.getElementById("playerTitle"),
    playerGameIcon: document.getElementById("playerGameIcon"),

    browseButton: document.getElementById("browseButton"),
    luckyButton: document.getElementById("luckyButton"),
    randomGameButton: document.getElementById("randomGameButton"),

    closeGameButton: document.getElementById("closeGameButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    reloadGameButton: document.getElementById("reloadGameButton"),

    themeButton: document.getElementById("themeButton")
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    loadTheme();

    await loadGames();

    setupEvents();

    openGameFromHash();
}

/* =========================================================
   GAME LOADING
========================================================= */

async function loadGames() {
    showLoading(true);

    try {
        const response = await fetch("/games.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `games.json could not be loaded. HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "games.json must contain an array."
            );
        }

        games = data
            .map(normalizeGame)
            .filter(Boolean);

        filteredGames = [...games];

        updateGameCounts();

        renderGames();

        console.log(
            `GameVault loaded ${games.length} game(s).`,
            games
        );

    } catch (error) {
        console.error("GameVault error:", error);

        games = [];
        filteredGames = [];

        updateGameCounts();
        renderGames();

    } finally {
        showLoading(false);
    }
}

/* =========================================================
   NORMALIZE GAME
========================================================= */

function normalizeGame(game) {
    if (!game || typeof game !== "object") {
        return null;
    }

    const id = String(
        game.id ||
        game.title ||
        "game"
    ).trim();

    const title =
        String(
            game.title ||
            prettifyName(id)
        ).trim();

    function normalizeImage(image) {
        if (!image) {
            return null;
        }

        const value = String(image).trim();

        if (!value) {
            return null;
        }

        /*
         * External images:
         * IGDB, HTTPS URLs, data URLs, etc.
         */
        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("//") ||
            value.startsWith("data:")
        ) {
            return value;
        }

        /*
         * Local images are always loaded from
         * the website root.
         */
        return value.startsWith("/")
            ? value
            : `/${value}`;
    }

    const image =
        normalizeImage(game.image);

    const hoverImages =
        Array.isArray(game.hoverImages)
            ? game.hoverImages
                .map(normalizeImage)
                .filter(Boolean)
            : [];

    let file = game.file;

    if (file) {
        file = String(file).trim();

        if (!file.startsWith("/")) {
            file = `/${file}`;
        }
    } else {
        file = `/games/${id}.html`;
    }

    return {
        ...game,

        id,

        title,

        file,

        image,

        hoverImages,

        category:
            game.category ||
            "all",

        featured:
            Boolean(game.featured),

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
        .replace(/\.html$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(
            /\b\w/g,
            character => character.toUpperCase()
        );
}

/* =========================================================
   RENDER
========================================================= */

function renderGames() {
    if (!elements.gamesGrid) {
        return;
    }

    elements.gamesGrid.innerHTML = "";

    if (!filteredGames.length) {
        if (elements.emptyState) {
            elements.emptyState.hidden = false;
        }

        elements.gamesGrid.style.display = "none";

        updateGameCount();

        return;
    }

    if (elements.emptyState) {
        elements.emptyState.hidden = true;
    }

    elements.gamesGrid.style.display = "grid";

    filteredGames.forEach((game, index) => {
        const card = createGameCard(game, index);

        if (card) {
            elements.gamesGrid.appendChild(card);
        }
    });

    updateGameCount();
}

/* =========================================================
   GAME CARD
========================================================= */

function createGameCard(game, index) {
    const card =
        document.createElement("article");

    card.className = "game-card";

    card.tabIndex = 0;

    card.style.animationDelay =
        `${Math.min(index * 35, 350)}ms`;

    card.innerHTML = `
        <div class="game-image">
            ${createGameImage(game)}
        </div>

        <div class="game-info">

            <div class="game-name-wrapper">

                <div
                    class="game-name"
                    title="${escapeAttribute(game.title)}"
                >
                    ${escapeHTML(game.title)}
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

    /*
     * Clicking anywhere on the card launches
     * the game.
     */
    card.addEventListener("click", event => {
        /*
         * Prevent the button click from causing
         * duplicate handling.
         */
        if (
            event.target.closest(".play-button")
        ) {
            openGame(game);
            return;
        }

        openGame(game);
    });

    /*
     * Image slideshow.
     */
    setupGameImageSlideshow(card);

    /*
     * Keyboard accessibility.
     */
    card.addEventListener("keydown", event => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();

            openGame(game);
        }
    });

    return card;
}

/* =========================================================
   IMAGE
========================================================= */

function createGameImage(game) {
    const images = [
        game.image,
        ...(Array.isArray(game.hoverImages)
            ? game.hoverImages
            : [])
    ].filter(Boolean);

    /*
     * Games without artwork still get
     * a proper placeholder.
     */
    if (!images.length) {
        return `
            <div class="game-placeholder">
                ✦
            </div>
        `;
    }

    return images
        .map(
            (image, index) => `
                <img
                    class="${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(game.title)}"
                    loading="${
                        index === 0
                            ? "eager"
                            : "lazy"
                    }"
                    data-image-index="${index}"
                >
            `
        )
        .join("");
}

/* =========================================================
   IMAGE SLIDESHOW
========================================================= */

function setupGameImageSlideshow(card) {
    const imageContainer =
        card.querySelector(".game-image");

    if (!imageContainer) {
        return;
    }

    const images =
        Array.from(
            imageContainer.querySelectorAll("img")
        );

    /*
     * No slideshow needed if there is
     * zero or one image.
     */
    if (images.length <= 1) {
        return;
    }

    let currentIndex = 0;
    let slideshowTimer = null;

    function showImage(index) {
        images.forEach(
            (image, imageIndex) => {
                image.classList.toggle(
                    "active",
                    imageIndex === index
                );
            }
        );

        currentIndex = index;
    }

    function startSlideshow() {
        if (slideshowTimer !== null) {
            return;
        }

        showImage(0);

        slideshowTimer =
            window.setInterval(() => {
                const nextIndex =
                    (
                        currentIndex + 1
                    ) %
                    images.length;

                showImage(nextIndex);
            }, 2200);
    }

    function stopSlideshow() {
        if (slideshowTimer !== null) {
            window.clearInterval(
                slideshowTimer
            );

            slideshowTimer = null;
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

    /*
     * Also allow keyboard users to see
     * the slideshow while focused.
     */
    card.addEventListener(
        "focus",
        startSlideshow
    );

    card.addEventListener(
        "blur",
        stopSlideshow
    );
}

/* =========================================================
   META
========================================================= */

function getGameMeta(game) {
    if (game.featured) {
        return "Featured";
    }

    if (
        game.category &&
        game.category !== "all"
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
        String(query || "")
            .trim()
            .toLowerCase();

    filteredGames =
        games.filter(game => {
            const matchesSearch =
                !normalized ||
                game.title
                    .toLowerCase()
                    .includes(normalized) ||
                game.id
                    .toLowerCase()
                    .includes(normalized);

            const matchesCategory =
                matchesCurrentCategory(game);

            return (
                matchesSearch &&
                matchesCategory
            );
        });

    renderGames();
}

/* =========================================================
   CATEGORY
========================================================= */

function matchesCurrentCategory(game) {
    if (currentCategory === "all") {
        return true;
    }

    if (currentCategory === "featured") {
        return Boolean(game.featured);
    }

    if (currentCategory === "new") {
        if (!game.created) {
            return false;
        }

        const created =
            new Date(game.created);

        const sevenDaysAgo =
            Date.now() -
            7 * 24 * 60 * 60 * 1000;

        return (
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
    if (!game || !game.file) {
        return;
    }

    currentGame = game;

    if (elements.playerTitle) {
        elements.playerTitle.textContent =
            game.title;
    }

    if (elements.playerGameIcon) {
        elements.playerGameIcon.textContent =
            getInitial(game.title);
    }

    if (elements.gameFrame) {
        elements.gameFrame.src =
            game.file;
    }

    if (elements.gamePlayer) {
        elements.gamePlayer.classList.add(
            "open"
        );

        elements.gamePlayer.setAttribute(
            "aria-hidden",
            "false"
        );
    }

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
   OPEN FROM URL
========================================================= */

function openGameFromHash() {
    const hash =
        window.location.hash;

    if (!hash.startsWith("#play=")) {
        return;
    }

    const id =
        decodeURIComponent(
            hash.substring(6)
        );

    const game =
        games.find(
            item =>
                item.id === id
        );

    if (game) {
        openGameWithoutHistory(game);
    }
}

function openGameWithoutHistory(game) {
    currentGame = game;

    if (elements.playerTitle) {
        elements.playerTitle.textContent =
            game.title;
    }

    if (elements.playerGameIcon) {
        elements.playerGameIcon.textContent =
            getInitial(game.title);
    }

    if (elements.gameFrame) {
        elements.gameFrame.src =
            game.file;
    }

    if (elements.gamePlayer) {
        elements.gamePlayer.classList.add(
            "open"
        );

        elements.gamePlayer.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    document.body.classList.add(
        "player-open"
    );
}

/* =========================================================
   CLOSE
========================================================= */

function closeGame(
    updateHistory = true
) {
    if (elements.gamePlayer) {
        elements.gamePlayer.classList.remove(
            "open"
        );

        elements.gamePlayer.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    document.body.classList.remove(
        "player-open"
    );

    if (elements.gameFrame) {
        elements.gameFrame.src =
            "about:blank";
    }

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
   RELOAD
========================================================= */

function reloadGame() {
    if (
        !currentGame ||
        !elements.gameFrame
    ) {
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
        if (document.fullscreenElement) {
            await document.exitFullscreen();

            return;
        }

        if (
            elements.gameFrame &&
            elements.gameFrame.requestFullscreen
        ) {
            await elements.gameFrame.requestFullscreen();

            return;
        }

        if (
            elements.gamePlayer &&
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

    const index =
        Math.floor(
            Math.random() *
            games.length
        );

    openGame(games[index]);
}

/* =========================================================
   COUNTERS
========================================================= */

function updateGameCounts() {
    if (elements.heroGameCount) {
        elements.heroGameCount.textContent =
            games.length;
    }
}

function updateGameCount() {
    const amount =
        filteredGames.length;

    if (elements.gameCount) {
        elements.gameCount.textContent =
            `${amount} ${
                amount === 1
                    ? "game"
                    : "games"
            }`;
    }
}

/* =========================================================
   LOADING
========================================================= */

function showLoading(show) {
    if (!elements.loadingState) {
        return;
    }

    elements.loadingState.hidden =
        !show;
}

/* =========================================================
   THEME
========================================================= */

function loadTheme() {
    const theme =
        localStorage.getItem(
            "gamevault-theme"
        );

    if (theme === "light") {
        document.body.classList.add(
            "light"
        );

        if (elements.themeButton) {
            elements.themeButton.textContent =
                "☾";
        }
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

    if (elements.themeButton) {
        elements.themeButton.textContent =
            light
                ? "☾"
                : "☼";
    }
}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {
    if (elements.gameSearch) {
        elements.gameSearch.addEventListener(
            "input",
            event => {
                searchGames(
                    event.target.value
                );
            }
        );
    }

    if (elements.clearSearchButton) {
        elements.clearSearchButton.addEventListener(
            "click",
            () => {
                if (elements.gameSearch) {
                    elements.gameSearch.value = "";
                    searchGames("");
                    elements.gameSearch.focus();
                }
            }
        );
    }

    if (elements.browseButton) {
        elements.browseButton.addEventListener(
            "click",
            () => {
                const gamesSection =
                    document.getElementById(
                        "games"
                    );

                if (gamesSection) {
                    gamesSection.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            }
        );
    }

    if (elements.luckyButton) {
        elements.luckyButton.addEventListener(
            "click",
            openRandomGame
        );
    }

    if (elements.randomGameButton) {
        elements.randomGameButton.addEventListener(
            "click",
            openRandomGame
        );
    }

    if (elements.closeGameButton) {
        elements.closeGameButton.addEventListener(
            "click",
            () => closeGame()
        );
    }

    if (elements.reloadGameButton) {
        elements.reloadGameButton.addEventListener(
            "click",
            reloadGame
        );
    }

    if (elements.fullscreenButton) {
        elements.fullscreenButton.addEventListener(
            "click",
            fullscreenGame
        );
    }

    if (elements.themeButton) {
        elements.themeButton.addEventListener(
            "click",
            toggleTheme
        );
    }

    document
        .querySelectorAll(".category-button")
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
                        elements.gameSearch
                            ? elements.gameSearch.value
                            : ""
                    );
                }
            );
        });

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                elements.gamePlayer &&
                elements.gamePlayer.classList.contains(
                    "open"
                )
            ) {
                closeGame();

                return;
            }

            if (
                event.key === "/" &&
                document.activeElement &&
                document.activeElement.tagName !== "INPUT" &&
                document.activeElement.tagName !== "TEXTAREA"
            ) {
                event.preventDefault();

                if (elements.gameSearch) {
                    elements.gameSearch.focus();
                }
            }
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            if (
                elements.gamePlayer &&
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
```
