/** @typedef {import("../../src/types/typedef").Webpage} Webpage */
/** @typedef {import("../../src/types/typedef").Host} Host */

/** @type {Webpage[]} webpages - Array to store webpage objects from config.json, each containing details about a sporting event and its streaming options. */
const webpages = [];

/**
 * Immediately invoked asynchronous function to fetch and process the configuration data from `config.json`. It retrieves the data, checks for a successful response, and then populates the `webpages` array with the relevant information about sporting events, leagues, and streaming options. The function also includes error handling to catch and log any issues that arise during the fetching and processing of the configuration data, ensuring that any problems are clearly communicated in the console for debugging purposes.
 */
(async () => {
    try {
        const response = await fetch("assets/config.json");
        if (!response || !response.ok) {
            throw new Error(`Failed to get response from config.json with: ${response ? `${response.status} ${response.statusText}` : "No response"}`);
        }
        const data = await response.json();
        // console.log(data);

        data.webpages
            .filter(item => item.urls.length > 0)
            .forEach(({ league, sportingEvent, urls, ...rest }) => webpages.push({
                league: getSectionItemId(league),
                sportingEvent: getSectionItemId(sportingEvent),
                hostname: new URL(urls[urls.length - 1]).hostname,
                urls,
                ...rest
            }));
        // console.log(webpages);

        try {
            loadHTMLBySections();
            loadHostsInModalAbout(data.hosts);
        } catch (error) {
            console.error("Failed to load HTML content:");
            console.error(error);
        }
    } catch (error) {
        console.error("Failed to process the config.json file:");
        console.error(error);
    }
})();

/**
 * Loads the HTML content for the sporting events, leagues, and streams sections based on the data in the `webpages` array. It filters and sorts the data to create unique lists of sporting events, leagues, and streams, and then calls `loadHTMLBySectionItems` to generate the corresponding HTML elements for each section. The function also includes error handling to catch and log any issues that arise during the loading of HTML content.
 */
function loadHTMLBySections() {
    const sportingEvents = webpages
        .filter((item, index, array) => array.findIndex(webpage => webpage.sportingEvent === item.sportingEvent) === index)
        .sort((a, b) =>
            a.time.localeCompare(b.time) ||
            a.sportingEvent.localeCompare(b.sportingEvent))
        .map(item => item.sportingEvent);
    loadHTMLBySectionItems("sportingEvents", sportingEvents);

    const leagues = webpages
        .filter((item, index, array) => array.findIndex(webpage => webpage.league === item.league) === index)
        .sort((a, b) =>
            (webpages.filter(item => item.league === b.league).length - webpages.filter(item => item.league === a.league).length) ||
            a.league.localeCompare(b.league))
        .map(item => item.league);
    loadHTMLBySectionItems("leagues", leagues);

    const streams = webpages
        .filter((item, index, array) => array.findIndex(webpage => webpage.hostname === item.hostname) === index)
        .sort((a, b) =>
            (webpages.filter(item => item.hostname === b.hostname).length - webpages.filter(item => item.hostname === a.hostname).length) ||
            a.hostname.localeCompare(b.hostname))
        .map(item => item.hostname);
    loadHTMLBySectionItems("streams", streams);
}

/**
 * Generates and loads the HTML content for a specific section (sporting events, leagues, or streams) based on the unique items provided in the `sectionItems` array. It creates navigation links for each item in the section and corresponding content sections that display the relevant channels and options for each item. The function also includes event listeners for user interactions, such as clicking on navigation links or channel options, to dynamically update the displayed content. Error handling is included to catch and log any issues that arise during the generation and loading of HTML content.
 * @param {string} section - The section for which to load the HTML content (e.g., "sportingEvents", "leagues", "streams").
 * @param {string[]} sectionItems - An array of unique items corresponding to the specified section (e.g., unique sporting events, leagues, or streams) to generate the HTML content for each item in the section.
 */
function loadHTMLBySectionItems(section, sectionItems) {
    const divNavSection = document.querySelector(`div#menu>a.w3-bar-item[href='#${section}']`).nextElementSibling;
    const divMainSection = document.getElementById(section).nextElementSibling;
    section = section.slice(0, -1);

    sectionItems.forEach(sectionItem => {
        const sectionItemDisplay = getSectionItemDisplayBySectionItem(section, sectionItem);
        const a = html_appendA(
            divNavSection,
            "w3-bar-item w3-button w3-hover-khaki w3-border-bottom w3-border-light-green w3-ripple",
            `#${section}_${sectionItem}`,
            sectionItemDisplay,
            null);
        a.addEventListener("click", () => onclickMenuItemBySectionItem(section, sectionItem));

        const div1 = html_appendDiv(divMainSection, "w3-container");
        div1.id = `${section}_${sectionItem}`;

        const webpagesBySectionItem = getWebpagesBySectionItem(section, sectionItem);

        const h3 = document.createElement("h3");
        h3.className = "w3-button w3-left-align w3-white w3-hover-khaki w3-block w3-border w3-border-light-green w3-round-large w3-ripple";
        appendSpansToH3BySectionItem(h3, section, sectionItem, webpagesBySectionItem.length.toString());
        h3.insertAdjacentHTML("beforeend", sectionItemDisplay);
        h3.addEventListener("click", () => displayChannelsBySectionItem(h3, section, sectionItem));
        div1.appendChild(h3);

        const div2 = html_appendDiv(divMainSection, "w3-channels-by-section-item w3-hide");

        let div3 = html_appendDiv(div2, "w3-row-padding");
        const aClassName = "w3-button w3-hover-lime w3-padding-small w3-ripple";
        if (webpagesBySectionItem.length > 1) {
            const div4 = html_appendDiv(div3, "w3-margin-bottom");
            if (webpagesBySectionItem.length > 2) {
                div4.classList.add("w3-rest");
            } else {
                div4.classList.add("w3-twothird");
            }
            const div5 = html_appendDiv(div4, "w3-card w3-center w3-border w3-round");
            const div6 = html_appendDiv(div5, "group-center");
            const span = html_appendSpan(div6, null, "Change options in all channels:", null);
            const div7 = html_appendDiv(div6, null);
            const aPrev = html_appendA(div7, aClassName, null, "\u00AB", "Previous Options"); // «
            aPrev.addEventListener("click", () => changeOptionsBySectionItem(aPrev, "prev"));
            for (let i = 0; i < Math.max(...webpagesBySectionItem.map(item => item.urls.length)); i++) {
                const indexDisplay = i + 1;
                const aURL = html_appendA(div7, aClassName, null, indexDisplay, `Options ${indexDisplay}s`);
                aURL.addEventListener("click", () => changeOptionsBySectionItem(aURL, i));
            }
            const aNext = html_appendA(div7, aClassName, null, "\u00BB", "Next Options"); // »
            aNext.addEventListener("click", () => changeOptionsBySectionItem(aNext, "next"));
            const div8 = html_appendDiv(div5, "group-right");
            const aLoad = html_appendA(div8, `${aClassName} w3-round`, null, "\u27F3", "Reload All Channels"); // ⟳
            aLoad.addEventListener("click", () => changeOptionsBySectionItem(aLoad, "load"));
            const aStop = html_appendA(div8, `${aClassName} w3-round`, null, "\u2715", "Stop All Channels"); // ✕
            aStop.addEventListener("click", () => changeOptionsBySectionItem(aStop, "stop"));
            const aMax = html_appendA(div8, `${aClassName} w3-round`, null, "\u{1F533}", "Maximize All Channels"); // 🔳
            aMax.addEventListener("click", () => w3_setDisplayModal("modalChannel", "block", aMax));
        }

        webpagesBySectionItem
            .sort((a, b) =>
                a.time.localeCompare(b.time) ||
                a.association.localeCompare(b.association) ||
                a.league.localeCompare(b.league) ||
                a.sportingEvent.localeCompare(b.sportingEvent))
            .forEach((webpage, index) => {
                if (index % 3 === 0) {
                    div3 = html_appendDiv(div2, "w3-row-padding");
                }

                const div4 = html_appendDiv(div3, "w3-third w3-margin-bottom");
                const div5 = html_appendDiv(div4, "w3-card w3-round");
                const div6 = html_appendDiv(div5, "w3-center w3-border w3-round");
                const div7 = html_appendDiv(div6, "group-center");
                const aPrev = html_appendA(div7, aClassName, null, "\u00AB", "Previous Option"); // «
                aPrev.addEventListener("click", () => changeOptionByChannel(aPrev, "prev"));
                webpage.urls.forEach((url, index) => {
                    const indexDisplay = index + 1;
                    const aURL = html_appendA(div7, aClassName, null, indexDisplay, `Option ${indexDisplay}: ${url}`);
                    aURL.addEventListener("click", () => changeOptionByChannel(aURL, index));
                });
                const aNext = html_appendA(div7, aClassName, null, "\u00BB", "Next Option"); // »
                aNext.addEventListener("click", () => changeOptionByChannel(aNext, "next"));
                const div8 = html_appendDiv(div6, "group-right");
                const aLoad = html_appendA(div8, `${aClassName} w3-round`, null, "\u27F3", "Reload Channel"); // ⟳
                aLoad.addEventListener("click", () => changeOptionByChannel(aLoad, "load"));
                const aStop = html_appendA(div8, `${aClassName} w3-round`, null, "\u2715", "Stop Channel"); // ✕
                aStop.addEventListener("click", () => changeOptionByChannel(aStop, "stop"));
                const aMax = html_appendA(div8, `${aClassName} w3-round`, null, "\u{1F533}", "Maximize Channel"); // 🔳
                aMax.addEventListener("click", () => w3_setDisplayModal("modalChannel", "block", aMax));

                const iframe = document.createElement("iframe");
                // iframe.src = webpage.urls[webpage.urls.length - 1];
                iframe.setAttribute("urls", JSON.stringify(webpage.urls));
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; muted; picture-in-picture";
                iframe.width = "100%";
                iframe.height = "100%";
                iframe.allowFullscreen = true;
                // iframe.scrolling = "auto"; // no
                div5.appendChild(iframe);

                const div9 = html_appendDiv(div5, "w3-container");
                const p1 = html_appendP(div9, `${webpage.time} - ${webpage.association} - ${getSectionItemDisplayBySectionItem("league", webpage.league)}`);
                const svg = html_appendSVG(p1, "w3-left", webpage.state.color, `${webpage.state.message} ${webpage.state.url}`);
                const p2 = html_appendP(div9, getSectionItemDisplayBySectionItem("sportingEvent", webpage.sportingEvent));

                const div10 = html_appendDiv(div5, "w3-center w3-border w3-round");
                const span = html_appendSpan(div10, null, "Go to:", null);
                webpage.urls.forEach((url, index) => {
                    const indexDisplay = index + 1;
                    const aURL = html_appendA(div10, aClassName, url, indexDisplay, `Option ${indexDisplay}: ${url}`);
                    aURL.target = "_blank";
                });
            });
    });
}

/**
 * Filters the global `webpages` array to return an array of webpage objects that match the specified section and section item. The function checks the section type (sporting event, league, or stream) and filters the webpages accordingly based on the relevant property (sportingEvent, league, or hostname). The resulting array contains only the webpage objects that correspond to the specified section item within the given section.
 * @param {string} section - The section for which to filter the webpages (e.g., "sportingEvent", "league", "stream").
 * @param {string} sectionItem - The specific item within the section to filter by (e.g., a specific sporting event, league, or stream hostname).
 * @returns {Webpage[]} An array of webpage objects that match the specified section and section item, filtered from the global `webpages` array.
 */
function getWebpagesBySectionItem(section, sectionItem) {
    let webpagesBySectionItem = webpages;
    if (section === "sportingEvent") {
        webpagesBySectionItem = webpages.filter(item => item.sportingEvent === sectionItem);
    } else if (section === "league") {
        webpagesBySectionItem = webpages.filter(item => item.league === sectionItem);
    } else if (section === "stream") {
        webpagesBySectionItem = webpages.filter(item => item.hostname === sectionItem);
    }
    return webpagesBySectionItem;
}

/**
 * Transforms a given `sectionItem` string into a valid HTML element ID by replacing spaces with underscores and converting single and double quotes to their corresponding HTML entities. This function is used to ensure that the resulting string can be safely used as an ID in HTML without causing issues with special characters or whitespace, which could lead to invalid HTML or unexpected behavior when trying to reference the element by its ID.
 * @param {string} sectionItem - The specific item within a section (e.g., a sporting event name, league name, or stream hostname) that needs to be transformed into a valid HTML element ID. The function replaces spaces with underscores and converts single and double quotes to their corresponding HTML entities to ensure that the resulting string can be safely used as an ID in HTML without causing issues with special characters or whitespace.
 * @returns {string} A transformed version of the input `sectionItem` string that is suitable for use as an HTML element ID, with spaces replaced by underscores and quotes replaced by their respective HTML entities.
 */
function getSectionItemId(sectionItem) {
    return sectionItem.replace(/\s/g, "_").replace(/'/g, "&apos;").replace(/"/g, "&quot;"); // ' "
}

/**
 * Transforms a given `sectionItem` string for display purposes based on the specified `section` type. The function applies different transformations to the `sectionItem` string depending on whether it belongs to a sporting event, league, or stream section. For sporting events, it replaces occurrences of "_vs_" with a more visually appealing format that includes a "vs" separator, and replaces underscores with spaces while adding word-break opportunities for better display of long strings. For leagues, it simply replaces underscores with spaces and adds word-break opportunities. For streams, it replaces periods with periods followed by word-break opportunities to enhance readability and presentation in the HTML content.
 * @param {string} section - The section type (e.g., "sportingEvent", "league", "stream") that indicates how the `sectionItem` should be processed for display purposes. Depending on the section type, the function applies different transformations to the `sectionItem` string to enhance its readability and presentation in the HTML content. For example, it may replace underscores with spaces and add word-break opportunities for better display of long strings.
 * @param {string} sectionItem - The specific item within a section (e.g., a sporting event name, league name, or stream hostname) that needs to be transformed for display purposes. The function processes this string based on the provided `section` type to improve its readability and presentation in the HTML content, such as replacing underscores with spaces and adding word-break opportunities for better display of long strings.
 * @returns {string} A transformed version of the input `sectionItem` string that is formatted for better display in the HTML content, with transformations applied based on the specified `section` type to enhance readability and presentation.
 */
function getSectionItemDisplayBySectionItem(section, sectionItem) {
    let sectionItemDisplay = sectionItem;
    if (section === "sportingEvent") {
        sectionItemDisplay = sectionItem.replace(/_vs_/g, "_<span class='w3-opacity'>vs</span>_").replace(/_/g, " <wbr>"); // word-break-opportunity
    } else if (section === "league") {
        sectionItemDisplay = sectionItem.replace(/_/g, " <wbr>"); // word-break-opportunity
    } else if (section === "stream") {
        sectionItemDisplay = sectionItem.replace(/\./g, ".<wbr>"); // word-break-opportunity
    }
    return sectionItemDisplay;
}

/**
 * Handles the click event when a user clicks on a menu item corresponding to a specific section and section item in the sidebar menu. The function first checks if the sidebar is currently displayed, and if so, it toggles its display to hide it. Then, it programmatically triggers a click event on the corresponding section item in the main content area based on the provided `section` and `sectionItem` parameters. This allows the application to display the relevant content for the selected section item while hiding the sidebar menu, providing a seamless user experience when navigating through different sections and items in the menu.
 * @param {string} section - The section type (e.g., "sportingEvent", "league", "stream") that indicates which section item was clicked in the menu. This parameter is used to identify the specific section and section item that the user interacted with, allowing the function to determine which content to display or hide based on the user's selection in the menu.
 * @param {string} sectionItem - The specific item within the section (e.g., a sporting event name, league name, or stream hostname) that was clicked in the menu. This parameter is used to identify the exact item that the user interacted with, enabling the function to display the corresponding content for that item while hiding other content as needed based on the user's selection in the menu.
 */
function onclickMenuItemBySectionItem(section, sectionItem) {
    const navSidebar = document.querySelector("body>nav.w3-sidebar");
    if (navSidebar.style.display === "block") {
        w3_toggleDisplaySideBar();
    }
    document.getElementById(`${section}_${sectionItem}`).querySelector("h3.w3-button").click();
}

/**
 * Handles the click event when a user clicks on an `<h3>` element corresponding to a specific section item in the main content area. The function toggles the display of the channels associated with the clicked section item, showing or hiding them based on the current state. It also updates the styling of the clicked `<h3>` element and its associated icon to indicate whether the channels are currently displayed or hidden. Additionally, it ensures that only one section item's channels are displayed at a time by hiding any other open channels when a new section item is clicked. Finally, it calls `loadIframesBySectionItem` to load the relevant iframes for the selected section item when its channels are displayed.
 * @param {HTMLHeadingElement} h3 - The `<h3>` element that was clicked to display the channels for a specific section item. This element is used to identify which section item the user wants to view the channels for, and it serves as a reference point for manipulating the DOM to show or hide the relevant content based on the user's interaction with the menu.
 * @param {string} section - The section type (e.g., "sportingEvent", "league", "stream") that indicates which section item is being interacted with. This parameter is used to determine the context of the user's interaction and to identify the specific content that should be displayed or hidden based on the selected section item.
 * @param {string} sectionItem - The specific item within the section (e.g., a sporting event name, league name, or stream hostname) that corresponds to the clicked `<h3>` element. This parameter is used to identify the exact content that should be displayed or hidden based on the user's interaction with the menu, allowing the function to manipulate the DOM accordingly to show the relevant channels for the selected section item.
 */
function displayChannelsBySectionItem(h3, section, sectionItem) {
    const icon = h3.firstElementChild;
    const divMainSectionItem = h3.parentElement;
    const divChannelsBySectionItem = divMainSectionItem.nextElementSibling;
    const divChannelsBySectionItemShow = divChannelsBySectionItem.classList.contains("w3-show");
    const divButtonsBySectionItem = divChannelsBySectionItem.firstElementChild.querySelector("div.w3-rest, div.w3-twothird");

    document.querySelectorAll("div.w3-channels-by-section-item").forEach(div => {
        const h3 = div.previousElementSibling.firstElementChild;
        const icon = h3.firstElementChild;
        const divButtonsBySectionItem = div.firstElementChild.querySelector("div.w3-rest, div.w3-twothird");
        h3.classList.remove("w3-lime");
        h3.classList.add("w3-white");
        icon.style.transform = "rotateX(0deg)";
        icon.title = icon.title.replace("Close", "Open");
        div.classList.remove("w3-show");
        div.classList.add("w3-hide");
        if (divButtonsBySectionItem) {
            divButtonsBySectionItem.querySelectorAll("a[title^='Options ']").forEach(item => item.classList.remove("w3-lime"));
        }
    });
    document.querySelectorAll("div#menu>div.w3-animate-left>a.w3-bar-item").forEach(item => item.classList.remove("w3-lime"));

    if (!divChannelsBySectionItemShow) {
        const aNavSectionItem = document.querySelector(`div#menu>div.w3-animate-left>a.w3-bar-item[href='#${section}_${sectionItem}']`);
        const divNavSection = aNavSectionItem.parentElement;
        if (divNavSection.classList.contains("w3-hide")) {
            w3_setDisplaySectionItems(divNavSection.previousElementSibling);
        }
        requestAnimationFrame(() => {
            aNavSectionItem.scrollIntoView({ block: "center" });
            aNavSectionItem.classList.add("w3-lime");
        });

        h3.classList.remove("w3-white");
        h3.classList.add("w3-lime");
        icon.style.transform = "rotateX(180deg)";
        icon.title = icon.title.replace("Open", "Close");
        divChannelsBySectionItem.classList.remove("w3-hide");
        divChannelsBySectionItem.classList.add("w3-show");
        requestAnimationFrame(() => {
            divMainSectionItem.scrollIntoView({ block: "start" });
        });
        if (divButtonsBySectionItem) {
            const buttons = divButtonsBySectionItem.querySelectorAll("a[title^='Options ']");
            buttons[buttons.length - 1].classList.add("w3-lime");
        }

        loadIframesBySectionItem(section, sectionItem);
    } else {
        loadIframesBySectionItem(null, null);
    }
}

/**
 * Loads the iframes for a specific section item based on the provided `section` and `sectionItem` parameters. The function first clears the `src` attribute of all iframes within the currently displayed channels to stop any ongoing streams. It also resets the styling of the option buttons and removes any titles from the associated div elements. Then, if a valid `section` and `sectionItem` are provided, it selects the relevant iframes for the specified section item and updates their `src` attributes with the corresponding URLs from their `urls` attribute. It also updates the styling of the option buttons to indicate which options are currently active and sets the title of the associated div elements to reflect the currently loaded URL for each iframe. This function ensures that only the relevant iframes for the selected section item are loaded while stopping any previously loaded streams, providing a seamless user experience when navigating through different sections and items in the menu.
 * @param {string} section - The section type (e.g., "sportingEvent", "league", "stream") for which to load the iframes based on the specified section item. This parameter is used to identify the context of the section item and to determine which iframes should be loaded or unloaded based on the user's interaction with the menu.
 * @param {string} sectionItem - The specific item within the section (e.g., a sporting event name, league name, or stream hostname) for which to load the iframes. This parameter is used to identify the exact content that should be displayed or hidden based on the user's interaction with the menu, allowing the function to manipulate the DOM accordingly to show or hide the relevant iframes for the selected section item.
 */
function loadIframesBySectionItem(section, sectionItem) {
    document.querySelectorAll("div.w3-channels-by-section-item>div.w3-row-padding>div.w3-third>div.w3-card>iframe").forEach(iframe => {
        const divButtons = iframe.previousElementSibling.firstElementChild;
        const divPs = iframe.nextElementSibling;
        divButtons.querySelectorAll("a[title^='Option ']").forEach(item => item.classList.remove("w3-lime"));
        iframe.src = "";
        divPs.removeAttribute("title");
    });
    if (section && sectionItem) {
        document.getElementById(`${section}_${sectionItem}`).nextElementSibling.querySelectorAll("iframe").forEach(iframe => {
            const divButtons = iframe.previousElementSibling.firstElementChild;
            const urls = JSON.parse(iframe.getAttribute("urls"));
            const divPs = iframe.nextElementSibling;
            divButtons.querySelector(`a[title^='Option ${urls.length}']`).classList.add("w3-lime");
            // iframe.src = urls[urls.length - 1];
            divPs.title = iframe.src;
        })
    }
}

/**
 * Handles the click event when a user clicks on an option button for a specific channel within a section item. The function determines which option index to switch to based on the user's interaction with the option buttons (e.g., previous, next, load, stop, or a specific index), and then updates the channel's iframe source accordingly. It also updates the styling of the option buttons to indicate which option is currently active and sets the title of the associated div element to reflect the currently loaded URL for the channel. This function allows users to easily switch between different streaming options for a specific channel while providing visual feedback on which option is currently active.
 * @param {HTMLAnchorElement} a - The anchor element that was clicked to change the option for a specific channel. This element is used to identify which channel's options are being modified and to determine the new option index based on the user's interaction with the option buttons.
 * @param {string} index - The index of the option to switch to, which can be a specific number (as a string) representing the option index, or special values like "prev", "next", "load", or "stop" to indicate navigating to the previous or next option, reloading the current option, or stopping the channel, respectively. This parameter is used to determine how to update the channel's iframe source and the styling of the option buttons based on the user's interaction with the option controls.
 */
function changeOptionByChannel(a, index) {
    const buttons = Array.from(a.parentElement.parentElement.querySelectorAll("a[title^='Option ']"));
    const indexCurrent = buttons.findIndex(item => item.classList.contains("w3-lime"));
    if (indexCurrent !== -1 || /^\d+$/.test(index)) {
        if (index === "prev") {
            index = indexCurrent - 1;
            if (index < 0) {
                index = buttons.length - 1;
            }
        } else if (index === "next") {
            index = indexCurrent + 1;
            if (index >= buttons.length) {
                index = 0;
            }
        } else if (index === "load") {
            index = indexCurrent;
        } else if (index === "stop") {
            index = -1;
        } else {
            index = parseInt(index);
        }

        if (indexCurrent !== -1) buttons[indexCurrent].classList.remove("w3-lime");
        const iframe = a.parentElement.parentElement.nextElementSibling;
        const divPs = iframe.nextElementSibling;

        if (index !== -1) {
            buttons[index].classList.add("w3-lime");
            iframe.src = JSON.parse(iframe.getAttribute("urls"))[index];
            divPs.title = iframe.src;
        } else {
            iframe.src = "";
            divPs.removeAttribute("title");
        }
    }
}

/**
 * Handles the click event when a user clicks on an option button to change the options for all channels within a specific section item. The function determines which option index to switch to for all channels based on the user's interaction with the option buttons (e.g., previous, next, load, stop, or a specific index), and then updates the iframes' sources accordingly for all channels within the section item. It also updates the styling of the option buttons for all channels to indicate which option is currently active and sets the title of the associated div elements to reflect the currently loaded URLs for each channel. This function allows users to easily switch between different streaming options for all channels within a specific section item while providing visual feedback on which option is currently active for each channel.
 * @param {HTMLAnchorElement} a - The anchor element that was clicked to change the options for all channels within a section item. This element is used to identify which section item's options are being modified and to determine the new option index based on the user's interaction with the option buttons.
 * @param {string} index - The index of the option to switch to for all channels, which can be a specific number (as a string) representing the option index, or special values like "prev", "next", "load", or "stop" to indicate navigating to the previous or next option, reloading the current option, or stopping all channels, respectively. This parameter is used to determine how to update the iframes' sources and the styling of the option buttons for all channels based on the user's interaction with the option controls.
 */
function changeOptionsBySectionItem(a, index) {
    const buttons = Array.from(a.parentElement.parentElement.querySelectorAll("a[title^='Options ']"));
    const indexCurrent = buttons.findIndex(item => item.classList.contains("w3-lime"));
    if (indexCurrent !== -1 || /^\d+$/.test(index)) {
        if (index === "prev") {
            index = indexCurrent - 1;
            if (index < 0) {
                index = buttons.length - 1;
            }
        } else if (index === "next") {
            index = indexCurrent + 1;
            if (index >= buttons.length) {
                index = 0;
            }
        } else if (index === "load") {
            index = indexCurrent;
        } else if (index === "stop") {
            index = -1;
        } else {
            index = parseInt(index);
        }

        if (indexCurrent !== -1) buttons[indexCurrent].classList.remove("w3-lime");
        if (index !== -1) buttons[index].classList.add("w3-lime");

        const divChannelsBySectionItem = a.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        divChannelsBySectionItem.querySelectorAll("iframe").forEach(iframe => {
            if (index !== -1) {
                const urls = JSON.parse(iframe.getAttribute("urls"));
                const indexAlternate = urls[index] ? index : urls.length - 1;
                const a = iframe.previousElementSibling.firstElementChild.querySelector(`a[title^='Option ${indexAlternate + 1}']`);
                changeOptionByChannel(a, indexAlternate);
            } else {
                const a = iframe.previousElementSibling.firstElementChild.querySelector("a[title^='Option '].w3-lime");
                if (a) changeOptionByChannel(a, "stop");
            }
        });
    }
}

/**
 * Handles the click event when a user clicks on the navigation buttons to switch between channels within a modal. The function determines which channel index to switch to based on the user's interaction with the navigation buttons (e.g., previous or next), and then updates the displayed iframe in the modal accordingly. It also updates the styling of the channel selection buttons to indicate which channel is currently selected. This function allows users to easily navigate between different channels within the modal while providing visual feedback on which channel is currently active.
 * @param {string} index - The index of the channel to switch to, which can be a specific number (as a string) representing the channel index, or special values like "prev" or "next" to indicate navigating to the previous or next channel, respectively. This parameter is used to determine which channel's iframe should be displayed in the modal when the user interacts with the channel navigation controls.
 */
function changeChannel(index) {
    const modal = document.getElementById("modalChannel");
    const channelsDivs = document.querySelector("div.w3-channels-by-section-item.w3-show").querySelectorAll("div.w3-row-padding>div.w3-third");
    const divButtonsCurrent = document.getElementById("channelSelected");
    const channelDivCurrent = divButtonsCurrent.parentElement.parentElement;
    const iframeCurrent = modal.querySelector("iframe");
    const indexCurrent = Array.from(channelsDivs).indexOf(channelDivCurrent);

    if (indexCurrent !== -1) {
        if (index === "prev") {
            index = indexCurrent - 1;
            if (index < 0) {
                index = channelsDivs.length - 1;
            }
        } else if (index === "next") {
            index = indexCurrent + 1;
            if (index >= channelsDivs.length) {
                index = 0;
            }
        }

        const channelDiv = channelsDivs[index];
        const divButtons = channelDiv.firstElementChild.firstElementChild;
        const iframe = divButtons.nextElementSibling;
        divButtonsCurrent.removeAttribute("id");
        divButtons.id = "channelSelected";
        divButtonsCurrent.parentElement.insertBefore(document.adoptNode(iframeCurrent), divButtonsCurrent.nextSibling);
        modal.appendChild(document.adoptNode(iframe));
    }
}

/**
 * Appends spans to a given `<h3>` element based on the specified section and section item. The function creates and appends different spans to the `<h3>` element to provide additional information and functionality related to the section item, such as displaying the number of available channels or the time of a sporting event. The content and styling of the appended spans are customized based on the type of section item being represented, allowing users to quickly understand the context and details of the section item at a glance.
 * @param {HTMLHeadingElement} h3 - The `<h3>` element to which the spans will be appended. This element serves as the container for the spans that provide additional information and functionality related to the section item, such as displaying the number of available channels or the time of a sporting event.
 * @param {string} section - The section type (e.g., "sportingEvent", "league", "stream") that indicates the context of the section item and determines the specific information that will be displayed in the appended spans. This parameter is used to customize the content and styling of the spans based on the type of section item being represented.
 * @param {string} sectionItem - The specific item within the section (e.g., a sporting event name, league name, or stream hostname) that corresponds to the `<h3>` element. This parameter is used to retrieve relevant information about the section item, such as the number of available channels or the time of a sporting event, which will be displayed in the appended spans to provide users with additional context and details about the section item.
 * @param {string} numWebpages - The number of webpages (as a string) associated with the section item, which is used to determine the content of the spans that will be appended to the `<h3>` element. This parameter helps to provide users with information about how many channels or options are available for the specific section item, enhancing the user experience by giving them a quick overview of the available content related to that item.
 */
function appendSpansToH3BySectionItem(h3, section, sectionItem, numWebpages) {
    const channels = numWebpages === "1" ? "channel" : "channels";
    const span1 = html_appendSpan(h3, "icon-triangle-down w3-right", "\u25BD", `Open ${channels}`); // ▽
    const span2 = html_appendSpan(h3, "w3-right", "\u00A0", null); // non-breaking space

    if (section === "sportingEvent") {
        const { league, time } = webpages.find(item => item.sportingEvent === sectionItem);
        const span3 = html_appendSpan(h3, "w3-badge w3-right w3-white w3-border w3-border-light-green w3-round-large", time, `The game is at ${time}`);
        const span4 = html_appendSpan(h3, "w3-opacity w3-hide-small", `${getSectionItemDisplayBySectionItem("league", league)}: `, null);
    } else if (section === "league" || section === "stream") {
        const numWebpagesDisplay = numWebpages.length < 2 ? `\u00A0${numWebpages}\u00A0` : numWebpages; // non-breaking space
        const spanTitleNumWebpages = `${numWebpages} available streaming ${channels}`;
        const span3 = html_appendSpan(h3, "w3-badge w3-right w3-white w3-border w3-border-light-green", numWebpagesDisplay, spanTitleNumWebpages);
    }
}

/**
 * Loads the host information into the "About" modal of the application by filtering the provided array of host objects to ensure that only unique hostnames are displayed. The function creates list items in the modal to present the host information in a user-friendly format, including the host's name and a link to their website. This allows users to see details about the streaming hosts that are being used to provide the streaming content, enhancing transparency and providing users with additional context about the sources of the streaming content available in the application.
 * @param {Host} hosts - An array of host objects that represent the streaming hosts available for the application. Each host object contains properties such as `name`, `origin`, and other relevant information about the streaming host. This function is responsible for loading the host information into the "About" modal of the application, allowing users to see details about the streaming hosts that are being used to provide the streaming content. The function filters the hosts to ensure that only unique hostnames are displayed, and it creates list items in the modal to present the host information in a user-friendly format.
 */
function loadHostsInModalAbout(hosts) {
    const ulHosts = document.querySelector("div#modalAbout>div.w3-modal-content>div.w3-container>ul.w3-ul");

    hosts
        // Filter hosts to only include those that are not substrings of other hosts' hostname or are equal to other hosts' hostname
        .filter((item, index, array) => array.every(host => {
            const hostHostname = new URL(host.origin).hostname;
            const itemHostname = new URL(item.origin).hostname;
            return hostHostname === itemHostname || !itemHostname.includes(hostHostname);
        }))
        .forEach(host => {
            const li = document.createElement("li");
            li.className = "w3-row w3-hover-khaki w3-padding-small";
            ulHosts.appendChild(li);
            const span1 = html_appendSpan(li, "w3-col s1 m1 l1 w3-large", "\u26BD", null); // ⚽
            const span2 = html_appendSpan(li, "w3-col s11 m7 l8", host.name, null);
            const span3 = html_appendSpan(li, "w3-col s12 m4 l3 w3-small", null, null);
            const a = html_appendA(
                span3,
                null,
                host.origin,
                getSectionItemDisplayBySectionItem("stream", host.origin),
                `Visit ${host.name} website`);
            a.target = "_blank";
        });
}

/**
 * Handles the form submission event when a user submits a message through the contact form in the "Contact" modal. The function prevents the default form submission behavior, extracts the form data, and sends it to the server using a POST request to the "/send/message" endpoint. It then processes the server's response and provides feedback to the user based on whether the message was sent successfully or if there was an error during the process. This allows users to easily contact the support team or provide feedback about the streaming service while ensuring that their messages are properly handled and responded to by the server.
 * @param {Event} event - The event object representing the form submission event when a user submits a message through the contact form in the "Contact" modal. This function handles the form submission by preventing the default behavior, extracting the form data, and sending it to the server using a POST request to the "/send/message" endpoint. It then processes the server's response and provides feedback to the user based on whether the message was sent successfully or if there was an error during the process.
 */
async function sendMessage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const button = form.querySelector("button[type='submit']");

    formData.append("FechaHora", new Date().toISOString().slice(0, 19));
    button.classList.add("w3-disabled");
    button.innerHTML = button.innerHTML.replace("Send Message", "Sending message...");

    try {
        const response = await fetch("/send/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
            // body: new URLSearchParams(formData)
        });
        if (!response || !response.ok) {
            const data = await response.json();
            // console.log(data);
            alert(`${data.result}: ${data.error}`);

            throw new Error(`Failed to get response from send/message with: ${response ? `${response.status} ${response.statusText}` : "No response"}`);
        }

        form.parentElement.parentElement.previousElementSibling.click();
        form.reset();
    } catch (error) {
        console.error("Failed to process the send/message endpoint:");
        console.error(error);
    } finally {
        button.classList.remove("w3-disabled");
        button.innerHTML = button.innerHTML.replace("Sending message...", "Send Message");
    }
}

////////////////////////////////////////////////////////////////
// Start scripts to events of HTML elements on tv-online.html //

document.getElementById("btnMenu").addEventListener("click", () => w3_toggleDisplaySideBar());
document.querySelector("div#menu>a.btn-menu-home").addEventListener("click", () => w3_toggleDisplaySideBar());
document.querySelectorAll("div#menu>a.btn-menu-section").forEach(item => item.addEventListener("click", () => w3_setDisplaySectionItems(item)));
document.querySelectorAll("div#menu>div>a.btn-menu-modal").forEach(item => item.addEventListener("click", () => w3_setDisplayModal(`modal${item.textContent.trim()}`, "block")));
document.querySelector("div.w3-overlay").addEventListener("click", () => w3_toggleDisplaySideBar());
document.querySelectorAll("div.w3-modal>a.w3-display-topright").forEach(item => item.addEventListener("click", () => w3_setDisplayModal(item.parentElement.id, "none")));
document.querySelector("div#modalContact>div.w3-modal-content>div.w3-container>form").addEventListener("submit", sendMessage);
document.querySelector("div#modalChannel>a.w3-display-left").addEventListener("click", () => changeChannel("prev"));
document.querySelector("div#modalChannel>a.w3-display-right").addEventListener("click", () => changeChannel("next"));

// End scripts to events of HTML elements on tv-online.html //
//////////////////////////////////////////////////////////////

////////////////////////////
// Start scripts to W3CSS //

/**
 * Toggles the display of the sidebar navigation menu in the application. When the sidebar is displayed, it also shows an overlay to prevent interaction with the main content and rotates the menu icon to indicate that the sidebar is open. When the sidebar is hidden, it hides the overlay and resets the menu icon to its original state. Additionally, when the sidebar is opened, it checks if there is a currently active section item in the menu and scrolls it into view for better user experience.
 */
function w3_toggleDisplaySideBar() {
    const navSidebar = document.querySelector("body>nav.w3-sidebar");
    const divOverlay = navSidebar.nextElementSibling;
    const btnMenu = navSidebar.previousElementSibling;
    const icon1 = btnMenu.firstElementChild.firstElementChild;
    const icon2 = btnMenu.firstElementChild.lastElementChild;

    if (navSidebar.style.display === "block") {
        navSidebar.style.display = "none";
        divOverlay.style.display = "none";
        icon1.style.transform = "rotateX(0deg)";
        icon1.style.opacity = "1";
        icon2.style.transform = "translateX(-100%) rotateX(-180deg)";
        icon2.style.opacity = "0";
    } else {
        navSidebar.style.display = "block";
        divOverlay.style.display = "block";
        icon1.style.transform = "rotateX(180deg)";
        icon1.style.opacity = "0";
        icon2.style.transform = "translateX(-100%) rotateX(0deg)";
        icon2.style.opacity = "1";

        const arrayANavSectionItem = Array.from(document.querySelectorAll("div#menu>div.w3-animate-left>a.w3-bar-item"))
            .filter(item => item.classList.contains("w3-lime"));
        if (arrayANavSectionItem.length === 1) {
            arrayANavSectionItem[0].scrollIntoView({ block: "center" });
        }
    }
}

/**
 * Toggles the display of the section items in the sidebar menu when a user clicks on a section anchor element. The function checks the current display state of the section items associated with the clicked anchor element and either shows or hides them accordingly. It also updates the styling of the anchor element and its associated icon to indicate whether the section items are currently displayed or hidden. Additionally, it ensures that only one section's items are displayed at a time by hiding any other open sections when a new section is clicked, providing a clean and organized navigation experience for users interacting with the sidebar menu.
 * @param {HTMLAnchorElement} a - The anchor element that was clicked to toggle the display of the section items in the sidebar menu. This function is responsible for showing or hiding the section items associated with the clicked anchor element, as well as updating the styling of the anchor element and its associated icon to indicate whether the section items are currently displayed or hidden. Additionally, it ensures that only one section's items are displayed at a time by hiding any other open sections when a new section is clicked.
 */
function w3_setDisplaySectionItems(a) {
    const divNav = a.parentElement;
    const divNavSection = a.nextElementSibling;
    const divNavSectionShow = divNavSection.classList.contains("w3-show");
    const icon = a.lastElementChild;

    divNav.querySelectorAll("div#menu>a.btn-menu-section").forEach(item => {
        const divNavSection = item.nextElementSibling;
        const icon = item.lastElementChild;
        divNavSection.classList.remove("w3-show");
        divNavSection.classList.add("w3-hide");
        icon.style.transform = "rotateX(0deg)";
        icon.title = icon.title.replace("Close", "Open");
    });

    if (!divNavSectionShow) {
        divNavSection.classList.remove("w3-hide");
        divNavSection.classList.add("w3-show");
        icon.style.transform = "rotateX(180deg)";
        icon.title = icon.title.replace("Open", "Close");
    }
}

/**
 * Toggles the display of a modal element based on the provided ID and display value. The function also handles specific logic for the "Channel" modal, where it moves the selected channel's iframe into the modal when it is displayed and moves it back to its original position when the modal is hidden. Additionally, if the sidebar menu is currently displayed when a modal is being shown, the function will toggle the sidebar to hide it, ensuring that the modal is displayed without any obstruction from the sidebar. This function allows for seamless display and hiding of modals while managing the associated content and ensuring a smooth user experience.
 * @param {string} id - The ID of the modal element that should be displayed or hidden. This parameter is used to identify the specific modal that needs to be shown or hidden based on user interaction, allowing the function to manipulate the DOM accordingly to control the visibility of the modal.
 * @param {string} display - The display value that determines whether the modal should be shown or hidden. This parameter is typically set to "block" to show the modal and "none" to hide it, allowing the function to control the visibility of the modal based on user interaction.
 * @param {HTMLAnchorElement} [a] - An optional anchor element that may be associated with the modal being displayed. This parameter is used to determine if there is a specific channel selection associated with the modal (e.g., when displaying a channel in the "Channel" modal) and to manipulate the DOM accordingly to show the relevant content within the modal based on the user's interaction with the associated anchor element.
 */
function w3_setDisplayModal(id, display, a) {
    const modal = document.getElementById(id);
    const navSidebar = document.querySelector("body>nav.w3-sidebar");
    if (navSidebar.style.display === "block") {
        w3_toggleDisplaySideBar();
    }
    if (id === "modalChannel") {
        if (a) {
            let divButtons = a.parentElement.parentElement;
            if (divButtons.classList.contains("w3-card")) {
                divButtons = divButtons.parentElement.parentElement.nextElementSibling.firstElementChild.firstElementChild.firstElementChild;
            }
            const iframe = divButtons.nextElementSibling;
            divButtons.id = "channelSelected";
            modal.appendChild(document.adoptNode(iframe));
        } else {
            const divButtons = document.getElementById("channelSelected");
            const iframe = modal.querySelector("iframe");
            divButtons.removeAttribute("id");
            divButtons.parentElement.insertBefore(document.adoptNode(iframe), divButtons.nextElementSibling);
        }
    }
    modal.style.display = display;
}

/**
 * Handles the scroll event on the window to show or hide the "Go to top" and "Go to bottom" buttons based on the user's scroll position. The function checks if the user has scrolled down more than one viewport height from the top of the document, and if so, it shows the "Go to top" button. If the user is near the bottom of the document (within one viewport height), it hides the "Go to bottom" button. This provides users with convenient navigation options to quickly jump to the top or bottom of the page based on their current scroll position.
 */
const btnGoToTop = document.getElementById("btnGoToTop");
const btnGoToBottom = document.getElementById("btnGoToBottom");
window.onscroll = () => {
    requestAnimationFrame(() => {
        // Hide and show the "Go to top" button on scroll
        if(document.documentElement.scrollTop > window.innerHeight || document.body.scrollTop > window.innerHeight) {
            // document.documentElement.scrollTop for Chrome, Firefox, IE and Opera and document.body.scrollTop for Safari
            if (btnGoToTop.classList.contains("w3-hide")) {
                btnGoToTop.classList.remove("w3-hide");
                btnGoToTop.classList.add("w3-show");
            }
        } else {
            if (!btnGoToTop.classList.contains("w3-hide")) {
                btnGoToTop.classList.remove("w3-show");
                btnGoToTop.classList.add("w3-hide");
            }
        }
        // Hide and show the "Go to bottom" button on scroll
        if (document.documentElement.scrollTop + window.innerHeight > document.documentElement.scrollHeight - window.innerHeight
            || document.body.scrollTop + window.innerHeight > document.body.scrollHeight - window.innerHeight) {
            // document.documentElement.scrollTop for Chrome, Firefox, IE and Opera and document.body.scrollTop for Safari
            if (btnGoToBottom.classList.contains("w3-show")) {
                btnGoToBottom.classList.remove("w3-show");
                btnGoToBottom.classList.add("w3-hide");
            }
        } else {
            if (!btnGoToBottom.classList.contains("w3-show")) {
                btnGoToBottom.classList.remove("w3-hide");
                btnGoToBottom.classList.add("w3-show");
            }
        }
    });
}

// End scripts to W3CSS //
//////////////////////////

///////////////////////////
// Start scripts to HTML //

/**
 * Creates a new `<div>` element, assigns it an optional class name, appends it to a specified parent element in the DOM, and returns the newly created `<div>` element. This function is useful for dynamically creating and adding new content to a webpage while allowing for styling and identification of the new element through the optional class name parameter.
 * @param {HTMLElement} parent - The parent element to which the new `<div>` element will be appended. This parameter is used to specify the location in the DOM where the new `<div>` element should be added, allowing for dynamic content creation and manipulation within the specified parent element.
 * @param {string} [className] - An optional string representing the class name(s) to be assigned to the newly created `<div>` element. This parameter allows for styling and identification of the new `<div>` element by applying the specified class name(s), enabling developers to easily target and manipulate the element using CSS or JavaScript based on its assigned class.
 * @returns {HTMLDivElement} The newly created and appended `<div>` element. This return value allows developers to further manipulate or reference the newly created `<div>` element after it has been appended to the specified parent element, providing flexibility in how the new element can be used within the application.
 */
function html_appendDiv(parent, className) {
    const div = document.createElement("div");
    if (className) {
        div.className = className;
    }
    parent.appendChild(div);
    return div;
}

/**
 * Creates a new `<a>` element, assigns it an optional class name, href attribute, inner HTML content, and title attribute, appends it to a specified parent element in the DOM, and returns the newly created `<a>` element. This function is useful for dynamically creating and adding new hyperlinks to a webpage while allowing for styling, navigation, and additional information through the optional parameters.
 * @param {HTMLElement} parent - The parent element to which the new `<a>` element will be appended. This parameter is used to specify the location in the DOM where the new `<a>` element should be added, allowing for dynamic content creation and manipulation within the specified parent element.
 * @param {string} className - The class name(s) to be assigned to the newly created `<a>` element. This parameter allows for styling and identification of the new `<a>` element by applying the specified class name(s), enabling developers to easily target and manipulate the element using CSS or JavaScript based on its assigned class.
 * @param {string} [href] - An optional string representing the URL that the new `<a>` element should link to. This parameter allows for the creation of hyperlinks within the webpage, enabling users to navigate to different pages or resources when they click on the newly created `<a>` element.
 * @param {string} innerHTML - The HTML content to be set as the inner HTML of the newly created `<a>` element. This parameter allows for the customization of the content displayed within the hyperlink, enabling developers to include text, icons, or other HTML elements to enhance the visual appeal and functionality of the link.
 * @param {string} [title] - An optional string representing the title attribute for the new `<a>` element. This parameter allows for the addition of tooltip text that appears when users hover over the link, providing additional information or context about the link's destination or purpose, enhancing the user experience by offering helpful hints or descriptions when interacting with the link.
 * @returns {HTMLAnchorElement} The newly created and appended `<a>` element. This return value allows developers to further manipulate or reference the newly created `<a>` element after it has been appended to the specified parent element, providing flexibility in how the new element can be used within the application, such as adding event listeners or modifying its attributes dynamically.
 */
function html_appendA(parent, className, href, innerHTML, title) {
    const a = document.createElement("a");
    a.className = className;
    if (href) {
        a.href = href;
    }
    a.innerHTML = innerHTML;
    if (title) {
        a.title = title;
    }
    parent.appendChild(a);
    return a;
}

/**
 * Creates a new `<span>` element, assigns it an optional class name, inner HTML content, and title attribute, appends it to a specified parent element in the DOM, and returns the newly created `<span>` element. This function is useful for dynamically creating and adding new inline elements to a webpage while allowing for styling and additional information through the optional parameters.
 * @param {HTMLElement} parent - The parent element to which the new `<span>` element will be appended. This parameter is used to specify the location in the DOM where the new `<span>` element should be added, allowing for dynamic content creation and manipulation within the specified parent element.
 * @param {string} [className] - An optional string representing the class name(s) to be assigned to the newly created `<span>` element. This parameter allows for styling and identification of the new `<span>` element by applying the specified class name(s), enabling developers to easily target and manipulate the element using CSS or JavaScript based on its assigned class.
 * @param {string} [innerHTML] - An optional string representing the HTML content to be set as the inner HTML of the newly created `<span>` element. This parameter allows for the customization of the content displayed within the `<span>`, enabling developers to include text, icons, or other HTML elements to enhance the visual appeal and functionality of the span.
 * @param {string} [title] - An optional string representing the title attribute for the new `<span>` element. This parameter allows for the addition of tooltip text that appears when users hover over the span, providing additional information or context about the span's content or purpose, enhancing the user experience by offering helpful hints or descriptions when interacting with the span.
 * @returns {HTMLSpanElement} The newly created and appended `<span>` element. This return value allows developers to further manipulate or reference the newly created `<span>` element after it has been appended to the specified parent element, providing flexibility in how the new element can be used within the application, such as adding event listeners or modifying its attributes dynamically.
 */
function html_appendSpan(parent, className, innerHTML, title) {
    const span = document.createElement("span");
    if (className) {
        span.className = className;
    }
    if (innerHTML) {
        span.innerHTML = innerHTML;
    }
    if (title) {
        span.title = title;
    }
    parent.appendChild(span);
    return span;
}

/**
 * Creates a new `<p>` element, assigns it inner HTML content, appends it to a specified parent element in the DOM, and returns the newly created `<p>` element. This function is useful for dynamically creating and adding new paragraph elements to a webpage while allowing for customization of the content displayed within the paragraph through the innerHTML parameter.
 * @param {HTMLElement} parent - The parent element to which the new `<p>` element will be appended. This parameter is used to specify the location in the DOM where the new `<p>` element should be added, allowing for dynamic content creation and manipulation within the specified parent element.
 * @param {string} innerHTML - The HTML content to be set as the inner HTML of the newly created `<p>` element. This parameter allows for the customization of the content displayed within the paragraph, enabling developers to include text, icons, or other HTML elements to enhance the visual appeal and functionality of the paragraph.
 * @returns {HTMLParagraphElement} The newly created and appended `<p>` element. This return value allows developers to further manipulate or reference the newly created `<p>` element after it has been appended to the specified parent element, providing flexibility in how the new element can be used within the application, such as adding event listeners or modifying its attributes dynamically.
 */
function html_appendP(parent, innerHTML) {
    const p = document.createElement("p");
    p.innerHTML = innerHTML;
    parent.appendChild(p);
    return p;
}

/**
 * Creates a new `<svg>` element with a circle inside it, assigns it an optional class name, sets the stroke color of the circle, adds a title for tooltip functionality, appends it to a specified parent element in the DOM, and returns the newly created `<svg>` element. This function is useful for dynamically creating and adding new SVG graphics to a webpage while allowing for styling, customization of the circle's appearance, and additional information through the title attribute.
 * @param {HTMLElement} parent - The parent element to which the new `<svg>` element will be appended. This parameter is used to specify the location in the DOM where the new `<svg>` element should be added, allowing for dynamic content creation and manipulation within the specified parent element.
 * @param {string} [className] - An optional string representing the class name(s) to be assigned to the newly created `<svg>` element. This parameter allows for styling and identification of the new `<svg>` element by applying the specified class name(s), enabling developers to easily target and manipulate the element using CSS or JavaScript based on its assigned class.
 * @param {string} color - A string representing the color to be used for the stroke of the circle element within the SVG. This parameter allows for customization of the visual appearance of the SVG by specifying the color that will be applied to the stroke of the circle, enhancing the visual appeal and differentiation of the SVG element within the webpage.
 * @param {string} title - A string representing the title attribute for the new `<svg>` element. This parameter allows for the addition of tooltip text that appears when users hover over the SVG, providing additional information or context about the SVG's content or purpose, enhancing the user experience by offering helpful hints or descriptions when interacting with the SVG.
 * @returns {SVGElement} The newly created and appended `<svg>` element. This return value allows developers to further manipulate or reference the newly created `<svg>` element after it has been appended to the specified parent element, providing flexibility in how the new element can be used within the application, such as adding event listeners or modifying its attributes dynamically.
 */
function html_appendSVG(parent, className, color, title) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (className) {
        svg.setAttribute("class", className);
    }
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    parent.prepend(svg);
    const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "title");
    tooltip.textContent = title;
    svg.appendChild(tooltip);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "11");
    circle.setAttribute("cy", "11");
    circle.setAttribute("r", "3");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", "6");
    svg.appendChild(circle);
    return svg;
}

// End scripts to HTML //
/////////////////////////
