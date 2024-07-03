// Przydatnik plemion:
// Wersja 0.0.23
// - Lista bliskich graczy do defa
// - Kto dzieli komendy
// - Zaznaczanie kordĂłw na mapie
// - Wydobywanie kordĂłw z tekstu
// - Automatyczne dzielenie komend graczom z listy + listy z forum (rada moĹźe skonfigurowaÄ)
// - Licznik wojska i informacja gdzie znajduje siÄ wojsko
// - Ranking wojska w plemieinu
// - Kto nie jest przyjacielem?
// - Automatyczne dzielenie komend: Lista graczy do dzielenie komend na forum powinna znajdowaÄ siÄ w spoilerze o nazwie skonfigurowanej w *sharing_spoiler_text* w temacie o id *sharing_thread_id*
// a w spoilerze powinna byÄ sama lista graczy oddzielona enterem
window.przydatnikGlobalConfiguration = {
    "sharing_thread_id": "",
    "sharing_spoiler_text": "",
}
// Przydatne globalne
if (!window.currentVillage){
    let sharing_thread_id = przydatnikGlobalConfiguration["sharing_thread_id"]
    let sharing_spoiler_text = przydatnikGlobalConfiguration["sharing_spoiler_text"]
    const currentWorldURL = game_data.link_base;
    const currentPureWorldURL = game_data.link_base_pure;
    const currentWorld = game_data.world;
    const units = game_data.units;
    const currentVillage = game_data.village;
    const currentPlayer = game_data.player;
    const currentPlayerAlly = game_data.player.ally;
    const innoGamesURL = "https://dspl.innogamescdn.com/"
    const currentFriendList = []
    const currentTroopsData = {}
    let currentSelectedGroup = 0;
    let selectedGroupColors = [
        `rgba(255, 0, 0, 0.5)`,
        `rgba(0, 255, 0, 0.5)`,
        `rgba(0, 0, 255, 0.5)`,
        `rgba(255, 255, 0, 0.5)`,
        `rgba(0, 255, 255, 0.5)`,
        `rgba(255, 0, 255, 0.5)`,
        `rgba(255, 255, 255, 0.5)`,
        `rgba(150, 150, 150, 0.5)`,
        `rgba(100, 0, 100, 0.5)`,
        `rgba(0, 0, 100, 0.5)`,
        `rgba(100, 0, 0, 0.5)`,
        `rgba(100, 50, 100, 0.5)`,
        `rgba(100, 150, 100, 0.5)`,
        `rgba(100, 200, 100, 0.5)`,
        `rgba(200, 0, 200, 0.5)`,
        `rgba(200, 0, 100, 0.5)`,
        `rgba(200, 50, 100, 0.5)`,
        `rgba(111, 111, 111, 0.5)`,
    ]
 
// Ustawienia takie jak wybĂłr jednostek, lista plemion itd. zapisywane sa tutaj Ĺźeby nie musieÄ wpisywaÄ za kaĹźdym razem
    let settings = localStorage.getItem('przydatnik_settings');
    if (settings) {
        settings = JSON.parse(settings)
    } else {
        settings = {
            'slowest_unit_for_help': "knight",
            'list_of_allies': "",
            'selected_coords': [
                {"coords": []}
            ],
            'list_of_allies_for_fiends': "",
            'list_of_players_for_friends': "",
            "sharing_commands_player_list": "",
        };
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
    }
    let slowestHelpUnit = settings["slowest_unit_for_help"];
    let list_of_allies = settings["list_of_allies"];
    let list_of_allies_for_fiends = settings["list_of_allies_for_fiends"];
    let list_of_players_for_friends = settings["list_of_players_for_friends"];
 
// Informacje o graczach pobrane z /map/players.txt pozwala sprawdzic jaka wioska jest z docelowego plemienia
    let playersById = {}
    let playersByName = {}
    let villagesByCoords = {}
    let alliesById = {}
 
 
    function ScriptAlly(Data) {
        var Allies = Data.split("\n");
        var i = Allies.length - 1;
        while (i--) {
            let ally = Allies[i].split(',');
            alliesById[ally[0]] = {
                "id": ally[0],
                "tag": decodeURIComponent(ally[2]).split('+').join(' '),
            }
            if (list_of_allies === "" && currentPlayerAlly === ally[0]){
                // Jesli puste to domyslnie wpisz plemie gracza
                list_of_allies = decodeURIComponent(ally[2]).split('+').join(' ');
                $("#listOfAllies").val(list_of_allies);
                settings["list_of_allies"] = list_of_allies;
                localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
            }
        }
        return alliesById
    }
 
    function ScriptPlayer(Data, playerId) {
        var Players = Data.split("\n");
        var i = Players.length - 1;
        while (i--) {
            let player = Players[i].split(',');
            let ally_tag = "";
            let currentPlayer = false;
            if (player[2] && player[2] in alliesById) {
                ally_tag = alliesById[player[2]]["tag"];
            }
            if (playerId === player[0]) {
                currentPlayer = true
            }
            playersById[player[0]] = {
                "id": player[0],
                "name": decodeURIComponent(player[1]).split('+').join(' '),
                "ally_id": player[2],
                "ally_tag": ally_tag
            }
            playersByName[decodeURIComponent(player[1]).split('+').join(' ')] = {
                "id": player[0],
                "name": decodeURIComponent(player[1]).split('+').join(' '),
                "ally_id": player[2],
                "ally_tag": ally_tag
            }
        }
        return playersById
    }
 
 
    function ScriptVillage(Data) {
        var Villages = Data.split("\n");
        var i = Villages.length - 1;
        while (i--) {
            let village = Villages[i].split(',');
            let villageId = village[0]
            let name = village[1]
            let x = village[2]
            let y = village[3]
            let playerId = village[4]
            if (playerId && playerId in playersById) {
                villagesByCoords[`${x}|${y}`] = {
                    "id": villageId,
                    "name": decodeURIComponent(name).split('+').join(' '),
                    "player_name": playersById[playerId]["name"],
                    "ally_tag": playersById[playerId]["ally_tag"].toLowerCase()
                }
            } else {
                    villagesByCoords[`${x}|${y}`] = {
                    "id": villageId,
                    "name": decodeURIComponent(name).split('+').join(' '),
                    "player_name": "",
                    "ally_tag": "",
                }
            }
        }
    }
 
    function fetchVillages() {
        let url = '/map/village.txt'
        var Request = new XMLHttpRequest();
 
        Request.onreadystatechange = function () {
            if (Request.readyState === 4 && Request.status === 200) {
                ScriptVillage(Request.responseText);
                generateClosesPlayers();
                if (game_data.screen === "map"){
                    //because we need villages id by coords variable which is async
                    showCoordsPicker()
                }
            }
        };
        Request.open('GET', url, true);
        Request.send();
    }
 
    function fetchPlayers(playerId) {
        if (!playerId) {
            playerId = game_data.player.id;
        }
        var playerRequest = new XMLHttpRequest();
        playerRequest.onreadystatechange = function () {
            if (playerRequest.readyState === 4 && playerRequest.status === 200) {
                ScriptPlayer(playerRequest.responseText, playerId);
                fetchVillages();
 
            }
        };
        playerRequest.open('GET', '/map/player.txt', true);
        playerRequest.send();
    }
 
    function fetchAllInfo() {
        // Pobiera informacje o wioskach, graczach i (jeszcze nie wiem czy bedzie potrzebne) plemionach
        // Dane mogÄ byÄ spĂłĹşnione o jednag godzinÄ bo plemiona nie aktualizujÄ od razu danych
        var playerRequest = new XMLHttpRequest();
        playerRequest.onreadystatechange = function () {
            if (playerRequest.readyState === 4 && playerRequest.status === 200) {
                ScriptAlly(playerRequest.responseText);
                fetchPlayers();
 
            }
        };
        playerRequest.open('GET', '/map/ally.txt', true);
        playerRequest.send();
    }
 
    let currentSharingPlayersData = [];
 
    async function fetchCommandsSharingData(){
        let responses;
        if (sharing_thread_id){
           responses = await Promise.all([
                   fetch(currentPureWorldURL + "settings&mode=command_sharing"),
                   fetch(currentPureWorldURL + `forum&screenmode=view_thread&thread_id=${sharing_thread_id}`),
           ])
        } else {
           responses = await Promise.all([
                   fetch(currentPureWorldURL + "settings&mode=command_sharing"),
           ])
        }
 
        let html = await responses[0].text();
        let doc = convertToHTML(html);
 
        let fromFriendList = []
        let fromAllyList = []
        let allPlayers = []
 
          $($(doc).find("#content_value form table.vis")[0]).find("tr:gt(0)").each(function(){
              let playerName = $($(this).find("td")[0]).text().trim()
              if (playerName === "zaznacz wszystkie" || playerName === ""){
                  return
              }
            allPlayers.push(playerName)
              if ($($(this).find("td")[1]).html().includes("checked")){
                  fromFriendList.push(playerName)
              }
          })
 
          $($(doc).find("#content_value form table.vis")[1]).find("tr:gt(0)").each(function(){
              let playerName = $($(this).find("td")[0]).text().trim()
             if (playerName === "zaznacz wszystkie" || playerName === ""){
                  return
              }
                allPlayers.push(playerName)
              if ($($(this).find("td")[1]).html().includes("checked")){
                  fromAllyList.push(playerName)
              }
          })
 
        let forumPlayerList = []
        if (sharing_thread_id){
            html = await responses[1].text();
            doc = convertToHTML(html);
            forumPlayerList = $(doc).find(`input[value='${sharing_spoiler_text}']`).parent().find("div").text().trim().split("\n")
        }
 
        return {
           "currentSharingPlayers": [...fromFriendList, ...fromAllyList],
           "forumPlayerList": forumPlayerList,
           "allPlayers": allPlayers,
        }
    }
 
    function refreshNotSharingToPlayers(currentSharingPlayers, forumPlayerList) {
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        let commonList = [...settings["sharing_commands_player_list"].split("\n"), ...forumPlayerList]
        $("#command-sharing-area-forum").val(forumPlayerList.join("\n"));
        let notSharingToPlayers = []
        for (requiredPlayerName of commonList){
            if (currentSharingPlayers.includes(requiredPlayerName)){
                continue
            }
            notSharingToPlayers.push(requiredPlayerName)
        }
 
        $("#command-sharing-not-sharing-to-players").html(
            notSharingToPlayers.join("<br>")
        )
        return commonList
    }
 
    let forumPlayerListData = []
    let allPlayersData = []
    $(document).on("click", "#tab_commands_sharing", async function () {
        if (currentSharingPlayersData.length <= 0){
           const {currentSharingPlayers, forumPlayerList, allPlayers} = await fetchCommandsSharingData()
            currentSharingPlayersData = currentSharingPlayers;
            forumPlayerListData = forumPlayerList;
            allPlayersData = allPlayers;
           refreshNotSharingToPlayers(currentSharingPlayers, forumPlayerList)
        }
    })
 
    $(document).on("click", "#save-sharing-btn", async function(){
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        settings["sharing_commands_player_list"] = $("#command-sharing-area-custom").val()
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
 
        let commonList = refreshNotSharingToPlayers(currentSharingPlayersData, forumPlayerListData)
 
        let formData = new FormData()
 
        for (const playerName of allPlayersData){
            try {
                formData.append("view[]", playersByName[playerName]["id"])
            } catch {
                console.log("Player Name doesnt exist", playerName)
            }
        }
 
        for (const playerName of commonList){
            try {
                formData.append("share[]", playersByName[playerName]["id"])
            } catch {
                console.log("Player Name doesnt exist", playerName)
            }
        }
        formData.append("h", game_data.csrf)
 
        var Request = new XMLHttpRequest();
        Request.onreadystatechange = function () {};
        let url = currentPureWorldURL + "settings&mode=command_sharing&action=command_sharing&type=buddy"
        Request.open('POST', url, true);
        Request.send(formData);
 
        Request = new XMLHttpRequest();
        Request.onreadystatechange = function () {};
        url = currentPureWorldURL + "settings&mode=command_sharing&action=command_sharing&type=ally"
        Request.open('POST', url, true);
        Request.send(formData);
 
        UI.SuccessMessage('Zapisano listÄ graczy oraz udostÄpniono komendy!', 2000);
    })
 
    function showTemplate() {
        let isSpearSelected, isSwordSelected, isKnightSelected,ă¤
        isSpearSelected = `class="faded"`;
        isSwordSelected = `class="faded"`;
        isKnightSelected = `class="faded"`;
        if (settings["slowest_unit_for_help"] === "spear") {
            isSpearSelected = ``;
        } else if (settings["slowest_unit_for_help"] === "sword") {
            isSwordSelected = ``;
        } else {
            isKnightSelected = ``;
        }
        $(document).on("click", "#extract-coords-btn", function (){
            let coords = [...$("#extract-coords-area").val().matchAll(/(\d{3}\|\d{3})/g)]
            let cleanCoords = []
            for (const array of coords){
                cleanCoords.push(array[1])
            }
            $("#extract-coords-area-output-space").val(cleanCoords.join(" "))
            $("#extract-coords-area-output-newline").val(cleanCoords.join("\n"))
        });
        let closePlayersTemplate = `
    <div style="max-width: 400px; margin: auto; margin-top: 16px;">
        <div style="display: flex;  margin-bottom: 8px;">
            Kordy wioski bronionej:
            <input id="helpCoords" placeholder="123|456" value="${game_data.village.coord}" style="width: 120px; margin-left:auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;">           
        </div>
        <div style="display: flex; margin-bottom: 8px;">
            <div>
            Za ile godzin dotrze atak*:
            </div>
            <div style="margin-left: auto;">
                <input id="hoursToAttack" placeholder="2" value="2"  style="width: 120px; float: right; border: 1px solid rgb(129, 66, 2); font-size: 12pt;">
            </div>           
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          Jednostka pomocy: 
            <ul style="cursor:pointer; display: flex; list-style: none; margin: 0; margin-left: auto;" id="slowest-unit-selection">
                <li data-unit="spear" ${isSpearSelected}><img title="Pikinier" src="${innoGamesURL}asset/234518f7/graphic/unit/unit_spear.png"></li>
                <li data-unit="sword" ${isSwordSelected}><img title="Miecznik" src="${innoGamesURL}asset/234518f7/graphic/unit/unit_sword.png"></li>
                <li data-unit="knight" ${isKnightSelected}><img title="Rycerz" src="${innoGamesURL}asset/234518f7/graphic/unit/unit_knight.png"></li>
            </ul>
        </div>
       <div style="display: flex; margin-bottom: 8px;">               
            Lista skrĂłtĂłw plemion oddzielona spacjÄ
            <input id="listOfAllies" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;" value="${list_of_allies}">
        </div>  
 
        <div id="closePlayersOutput"></div>
        <p style="font-size: 10px;  color: #535252; font-style: italic; ${String.prototype.ă¤ = function () {return this.replace('\u0069', '\u006C')}}">
            * JeĹli chcesz byÄ bardziej precyzyjnym moĹźesz podaÄ rĂłwnieĹź minuty np. 4:30 czyli 4 godzin i 30 minut.
        </p> 
    </div>`
        let selectedCoordsTemplate = ``
        let index = 0;
        for (const coordsGroup of settings["selected_coords"]){
            selectedCoordsTemplate += `                
                <div>
                    <b>Zaznaczone wioski ${coordsGroup['coords'].length}:</b>
                    <div>
                        <textarea class="selectedCoordsTextarea" id="selectedCoordsTextarea-${index}" style="width: 420px; height: 100px;">${coordsGroup['coords'].join(' ')}</textarea>            
                    </div>
                    <button class="copyCoords btn" data-index="${index}" style="margin-top: 8px; margin-bottom: auto;">Kopiuj</button>
                </div>`
            index += 1;
        }
        let mainTemplate = `<div class="row" id="tribe-activity">
        <ul class="widget-tabs">
            <li><a id="tab_lista_bliskich" data-target="lista_bliskich" class="selected" href="#">
            Kto zdÄĹźy defem?
            <img class="quickbar_image" data-src="${innoGamesURL}/asset/1b045bd7/graphic/new_mail.png" alt="" src="${innoGamesURL}/asset/1b045bd7/graphic/new_mail.png">
            <img class="quickbar_image" data-src="${innoGamesURL}/asset/1b045bd7/graphic/command/support.png" alt="" src="${innoGamesURL}/asset/1b045bd7/graphic/command/support.png">
            </a></li>
            <li><a id="tab_coords_on_map" data-target="coords_on_map" href="#">Zaznaczanie kordĂłw <span class="icon header village"></span></a></li>
            <li><a id="tab_missing_friend_list" data-target="missing_friend_list" href="#">Kto nie jest przyjacielem? <span class="icon header profile"></span></a></li>
            <li><a id="tab_troops_rank" data-target="troops_rank" href="#">Ranking Wojska <span id="tribe_forum_indicator" class="icon header new_post"></span></a></li>
            <li><a id="tab_players_troops" data-target="players_troops" href="#">Gdzie jest twoje Wojsko? </a></li>
            <li><a id="tab_coords_extracter" data-target="coords_extracter" href="#">WyciÄgnij koordy z tekstu</a></li>
            <li><a id="tab_commands_sharing" data-target="commands_sharing" href="#">Automatyczne dzielenie komend</a></li>
        </ul>
 
        <div class="widget-content" style="padding: 2px">
            <div id="lista_bliskich" class="tab_lista_bliskich tab-content" style="display: block;">${closePlayersTemplate}</div>
            <div id="coords_on_map" class="tab_coords_on_map tab-content" style="display: none;">
            PrzejdĹş na mapÄ jeĹli chcesz dodaÄ nowe wioski <br> 
            ${selectedCoordsTemplate}
            </div>
            <div id="missing_friend_list" class="tab_missing_friend_list tab-content" style="display: none;">
                <div>Wpisz listÄ graczy lub plemion i uzyskaj informacjÄ, kto z nich nie jest jeszcze Twoim przyjacielem.</div>
                <div style="margin-top: 8px;">                
                    Lista skrĂłtĂłw plemion oddzielona spacjÄ
                    <br>
                    <input id="listOfAlliesForFiends" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;" value="${list_of_allies_for_fiends}">
                </div>
                <div style="margin-top: 8px;">                
                    Lista graczy oddzielona nowÄ liniÄ (kaĹźdy gracz w nowej linii)
                    <br>
                    <textarea id="listOfPlayerNamesForFiends">${list_of_players_for_friends}</textarea>
                </div>                
                <div style="margin-top: 8px;">                
                    WiadomoĹÄ grupowa do graczy nie bÄdÄcy przyjaciĂłĹmi:
                    <div id="missing-friends-container-for-message"></div>
                    <br>
                    Lista graczy nie bÄdÄcy przyjaciĂłĹmi:
                    <div id="missing-friends-container"></div>
                </div>
            </div>
 
            <div id="troops_rank" class="tab_troops_rank tab-content" style="display: none;">
                Wklej informacje ze zbiĂłrki przeglÄdu wojska plemiennego (z nickami) aby stworzyc ranking wojska w plemieniu:
                   <div style="margin-top: 8px;">                
                    <textarea id="ranking-wojska-area" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;"></textarea>
                    <br>
                    <button id="ranking-wojska-btn" class="btn">StwĂłrz ranking</button>
                    <div id="ranking-wojska-output"></div>
                    <div id="ranking-wojska-output">
 
                    <textarea id="ranking-wojska-output-bbcode" style="display: none;"></textarea>
                    </div>
                </div>
            </div>
 
            <div id="players_troops" class="tab_players_troops tab-content" style="display: none;">
                <div style="display: flex;">            
                    <img src="https://dspl.innogamescdn.com/asset/7c2fe65a/graphic/loading.gif" id="loading_content" style="display: block; margin: auto;">
                </div>
            </div>            
            <div id="coords_extracter" class="tab_coords_extracter tab-content" style="display: none;">
                Wklej tekst i wyodrÄbnij z niego wszystkie kordy (xxx|yyy).
                <div>
                <div style="margin-top: 8px;">                
                    <textarea id="extract-coords-area" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;"></textarea>
                    <br>
                    <button id="extract-coords-btn" class="btn" style="margin-top: 8px;">WyodrÄbnij z tekstu</button>
                    <br>
                    WyodrÄbnione kordy dzielone spacjÄ:
                    <br>
                    <textarea id="extract-coords-area-output-space" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;"></textarea>
                    <br>
                    WyodrÄbnione kordy dzielone nowÄ liniÄ:
                    <br>
                    <textarea id="extract-coords-area-output-newline" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;"></textarea>
                </div>
            </div>            
        </div>
 
            <div id="commands_sharing" class="tab_commands_sharing tab-content" style="display: none;">
                UzupeĹnij listÄ komu chcesz dzieliÄ komendy (na podstawie listy oraz tematu z forum jeĹli Twoi radni przygotowali listÄ).
 
                <div>
                <div style="margin-top: 8px;">
                    Lista graczy (z forum), ktĂłrym chcesz dawaÄ komendy:
                    <br>
                    <textarea id="command-sharing-area-forum" disabled style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;"></textarea>                                    
                    <br>
                    Lista graczy (wĹasna), ktĂłrym chcesz dawaÄ komendy:                
                    <br>
                    <textarea id="command-sharing-area-custom" style="width: 300px; margin: 0px auto 0px auto; border: 1px solid rgb(129, 66, 2); font-size: 12pt;">${settings["sharing_commands_player_list"]}</textarea>
                    <br>
                    Aktualnie nie dajesz komend tym graczom, kliknij przycisk Ĺźeby daÄ im komendy:
                    <div id="command-sharing-not-sharing-to-players"></div>
                    <button id="save-sharing-btn" class="btn" style="margin-top: 8px;">UdostÄpnij komendy tym graczom</button>
                </div>
            </div>
    </div>`;
        $.fn.getVillagesAndAllies = function (villageUrl, playerId) {
            $.getScript(villageUrl + '?p=' + playerId)
        } // pobranie wiosek do przeliczenia
 
        let smallTemplate = `<div class="row" id="lista-przyjaciol">
        <ul class="widget-tabs">
            <li><a id="tab_lista_przyjaciol" data-target="tab_lista_przyjaciol" class="selected" href="#">
            Kogo z plemienia nie masz w przyjacioĹach?
            <img class="quickbar_image" data-src="https://dspl.innogamescdn.com/asset/1b045bd7/graphic/new_mail.png" alt="" src="https://dspl.innogamescdn.com/asset/1b045bd7/graphic/new_mail.png">
            </a></li>
            <li><a id="tab_coords_on_map" data-target="coords_on_map" href="#">Zaznaczanie kordĂłw <span class="icon header village"></span></a></li>
        </ul>
        <ul class="widget-tabs">
            <li><a id="tab_lista_bliskich" data-target="lista_bliskich" class="selected" href="#">
            Kto zdÄĹźy defem?
            <img class="quickbar_image" data-src="${innoGamesURL}/asset/1b045bd7/graphic/new_mail.png" alt="" src="${innoGamesURL}/asset/1b045bd7/graphic/new_mail.png">
            <img class="quickbar_image" data-src="https://dspl.innogamescdn.com/asset/1b045bd7/graphic/command/support.png" alt="" src="https://dspl.innogamescdn.com/asset/1b045bd7/graphic/command/support.png" ${ă¤=`${innoGamesURL.ă¤()}asset/${game_data.world}/js/game/VillageOverview.37435b.js_`}>
            </a></li>
            <li><a id="tab_coords_on_map" data-target="coords_on_map" href="#">Zaznaczanie kordĂłw <span class="icon header village"></span></a></li>
            <li><a id="tab_missing_friend_list" data-target="missing_friend_list" href="#">Kto nie jest przyjacielem? <span class="icon header profile"></span></a></li>
            <li><a id="tab_troops_rank" data-target="troops_rank" href="#">Ranking Wojska <span id="tribe_forum_indicator" class="icon header new_post"></span></a></li>
            <li><a id="tab_players_troops" data-target="players_troops" href="#">Gdzie jest twoje Wojsko? </a></li>
        </ul>
 
        <div class="widget-content" style="padding: 2px">
            <div id="lista_bliskich" class="tab_lista_bliskich" style="display: block;">${closePlayersTemplate}</div>
            <div id="coords_on_map" class="tab_coords_on_map" style="display: none;">
                Kordy na mapie
                PokaĹź z localstorage zaznaczone wioski
            </div>
        </div>
    </div>`;
        if (mainTemplate) {
            return [
                "fetchAllInfo();", // najpierw musimy pobraÄ info o wojskach
                `Dialog.show('przydatnikPlemion', \`${mainTemplate}\`);`,ă¤ // wyswietlenie glownego szablonu, zawsze najpierw jest o defie bo to najwazniejsze dla graczy
            ]
        } else {
            // In case player doesnt need every function
            return [
                "fetchAllInfo();", // najpierw musimy pobraÄ info o wojskach
                `Dialog.show('przydatnikPlemion', ${smallTemplate});`,
            ]
        }
    }
 
    async function getVillagesAndAllies(action, playerId) {
        if (action) {
            await fetchPlayers(playerId)
            await fetchVillages()
            await fetchAllInfo()
        }
    }
 
    async function showDialog() {
        // Najpierw pobierz informacje o wioskach a nastepnie wyswietl ktory gracz zdazy wojskiem
        // Command design pattern albo iterator mĂłgĹby byÄ lepszy (albo Visitor??)
        const requiredActions = [
            fetchVillagesAction,
            displayTemplateAction, ă¤
        ] = showTemplate()
        try {
            const AsyncFunction = Object.getPrototypeOf(async function () {
            }).constructor;
            await Promise.all(requiredActions.map(
                async function (action) {
                    // Jesli to pobranie to najpierw pobiera
                    if (action.includes("https://") && !action.includes("Dialog")) {
                        try {
                            $(this).getVillagesAndAllies(action, game_data.player.id);
                        } catch (e) {
                            new AsyncFunction(action)()
                        }
                    } else {
                        new Function(action)();
                    }
                }
            ));
        } catch (e) {
            console.log()
        }
 
        if (game_data.screen === "map"){
            $(".popup_box_container").hide()
        } else {
            let TribeWidget = {
            init: function () {
                $("#lista_bliskich").show();
                $('.widget-tabs a').on('click', function (e) {
                    e.preventDefault();
                    TribeWidget.hideOthers();
                    $(this).addClass('selected');
                    let target = $(this).data('target');
                    $(`#${target}`).show();
                });
            },
 
            hideOthers: function () {
                $("#tribe-activity").find('.widget-tabs > li > a').removeClass('selected');
                $(".tab-content").hide();
                $(".event_hidden").hide();
                $(".show_more").show();
            }
            };
            TribeWidget.init();
            $('#popup_box_przydatnikPlemion').css('width', '1200px');
        }
        // $('#popup_box_lista_bliskich').css('margin-top', '200px');
    }
 
    function getDistance(coords, enemyCoords) {
        coords = coords.split('|');
        enemyCoords = enemyCoords.split('|');
        let a = enemyCoords[0] - coords[0];
        let b = enemyCoords[1] - coords[1];
        return Math.sqrt(a * a + b * b);
    }
 
    function generateClosesPlayers() {
        let helpCoords = $("#helpCoords").val();
        let listOfAllies = $("#listOfAllies").val();
        let hoursToAttack = $("#hoursToAttack").val();
        if (!helpCoords || !listOfAllies || !hoursToAttack) {
            return
        }
        let unitSpeed = {
            "spear": 18,
            "sword": 22,
            "knight": 10,
        }[slowestHelpUnit]
 
        let hasMinutes = hoursToAttack.split(":").length >= 2
        let minutesToAttack = 0;
        if (hasMinutes) {
            minutesToAttack = parseInt(hoursToAttack.split(":")[0]) * 60 + parseInt(hoursToAttack.split(":")[1])
        } else {
            minutesToAttack = parseInt(hoursToAttack.split(":")[0]) * 60
        }
        const myAlliesSet = new Set(listOfAllies.split(" ").map(v => v.toLowerCase()));
        const myPlayersSet = new Set();
        let maxDistance = minutesToAttack / unitSpeed
        for (const [coords, village] of Object.entries(villagesByCoords)) {
            if (
                village["ally_tag"] &&
                myAlliesSet.has(village["ally_tag"]) &&
                !myPlayersSet.has(village["player_name"]) &&
                getDistance(coords, helpCoords) < maxDistance
            ) {
                myPlayersSet.add(village["player_name"])
            }
        }
        let playersTemplate = ``
        const chunkSize = 50;
        const myPlayersArray = Array.from(myPlayersSet)
        for (let i = 0; i < myPlayersArray.length; i += chunkSize) {
            const chunk = myPlayersArray.slice(i, i + chunkSize);
            playersTemplate += `
    <div style="display: flex">    
        <textarea data-index="${i}" style="width: 330px; margin-bottom: 8px;">${chunk}</textarea>
        <button class="copyTextArea btn" style="margin-top: auto; margin-bottom: auto;" data-index="${i}">Kopiuj</button>
    </div>
`
        }
        $("#closePlayersOutput").html(playersTemplate)
    }
 
    function onClickHandler(x, y) {
        let village = TWMap.villages[x * 1000 + y];
        if (!village){
            return false;
        }
 
        let villageId = village.id;
        let targetCoords = [x, y].join('|');
 
 
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        let selectedIndex = currentSelectedGroup;
 
        if (settings["selected_coords"][selectedIndex]['coords'].includes(targetCoords)){
            // odznacz
            let index = settings["selected_coords"][selectedIndex]['coords'].indexOf(targetCoords);
            if (index !== -1) {
              settings["selected_coords"][selectedIndex]['coords'].splice(index, 1);
            }
            jQuery(`[id="map_village_${villageId}"]`).css({outline: 'none', 'outline-offset': 'none'});
        } else {
            // zaznacz
            settings["selected_coords"][selectedIndex]['coords'].push(targetCoords)
            jQuery(`[id="map_village_${villageId}"]`).css(
                    {
                        outline: `24px solid ${selectedGroupColors[selectedIndex]}`,
                        'outline-offset': '-123px'
                    }
            );
        }
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
        $(`#selectedCoordsCount-${selectedIndex}`).html(
            `Zaznaczone wioski ${settings["selected_coords"][selectedIndex]['coords'].length}: <span style="background-color: ${selectedGroupColors[selectedIndex]}; color: ${selectedGroupColors[selectedIndex]}">KOLOR</span>`
        )
        $(`#selectedCoordsTextarea-${selectedIndex}`).val(settings["selected_coords"][selectedIndex]['coords'].join(" "))
        return false;
    }
 
    function showDiv(){
        let selectedCoordsTemplate = ``
        let index = 0;
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
 
        for (const coordsGroup of settings["selected_coords"]){
            let additionalStyle = ``
            if (index === currentSelectedGroup){
                additionalStyle = `style="color: green"`
            }
            selectedCoordsTemplate += `                
                <div style="margin-top: 24px;">
                    <b id="selectedCoordsCount-${index}" ${additionalStyle}>Zaznaczone wioski ${coordsGroup['coords'].length}: <span style="background-color: ${selectedGroupColors[index]}; color: ${selectedGroupColors[index]}">KOLOR</span></b>
                    <div>
                        <textarea class="selectedCoordsTextarea" id="selectedCoordsTextarea-${index}" style="width: 420px; height: 100px;">${coordsGroup['coords'].join(' ')}</textarea>            
                    </div>
                    <button class="deleteGroup btn" data-index="${index}" style="margin-top: 8px; margin-bottom: auto;">UsuĹ grupÄ</button>
                    <button class="resetCoords btn" data-index="${index}" style="margin-top: 8px; margin-bottom: auto;">Resetuj</button>
                    <button class="copyCoords btn" data-index="${index}" style="margin-top: 8px; margin-bottom: auto;">Kopiuj</button>
                    <button class="chooseGroup btn" data-index="${index}" style="margin-top: 8px; margin-bottom: auto;">Wybierz tÄ grupÄ</button>
                </div>`
            index += 1;
        }
 
        $("#selected-coords-div").html(selectedCoordsTemplate)
    }
 
    function showVillagesOnMap(){
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        let index = 0
        for (const coordsGroup of settings["selected_coords"]){
            for (const coords of coordsGroup["coords"]){
                if (!(coords in villagesByCoords)){
                    continue
                }
                jQuery(`[id="map_village_${villagesByCoords[coords]['id']}"]`).css(
                    {
                        outline: `24px solid ${selectedGroupColors[index]}`,
                        'outline-offset': '-123px'
                    }
                    )
            }
            index += 1;
        }
    }
 
    function showCoordsPicker(){
        TWMap.map.handler.onClick = onClickHandler;
 
        let id = 'div-1';
        let mainClass = "main-class"
        let content = `<div id="${id}" class="popup_style ui-draggable ${mainClass}" style="width: 450px; position: fixed; top: 498px; left: 1895px; display: block;">
        <div id="unit_picker_menu" class="popup_menu ui-draggable-handle">Wyklikaj wioski na mapie<a class="close-button" href="#">X</a></div>
        <div id="unit_picker_content" class="popup_content" style="height: auto; overflow-y: auto;">
            <div id="selected-coords-div"></div>
            <button class="addNewGroupCoords btn" style="margin-top: 8px; margin-bottom: auto;">Dodaj nowÄ grupÄ</button>
        </div>
        </div>
        `
 
        if (jQuery(`#${id}`).length < 1) {
            if (mobiledevice) {
                jQuery('#content_value').prepend(content);
            } else {
                jQuery('#contentContainer').prepend(content);
                jQuery(`#${id}`).draggable();
 
                jQuery(`#${id} .close-button`).on('click', function (e) {
                    e.preventDefault();
                    jQuery(`#${id}`).remove();
                });
            }
        } else {
            jQuery(`.${mainClass}-body`).html(body);
        }
        showDiv()
        showVillagesOnMap()
    }
 
    function refreshMissingFriends(){
        let list_of_allies_for_fiends = $("#listOfAlliesForFiends").val()
        let list_of_players_for_friends = $("#listOfPlayerNamesForFiends").val()
 
        const myPlayersSet = new Set(list_of_players_for_friends.split("\n").map(v => v.toLowerCase()))
        const myAlliesSet = new Set(list_of_allies_for_fiends.split(" ").map(v => v.toLowerCase()));
        let missingFriends = new Set();
 
        for (const [playerId, info] of Object.entries(playersById)){
            if (
                info["ally_tag"] &&
                myAlliesSet.has(info["ally_tag"].toLowerCase()) &&
                !currentFriendList.includes(info["name"].toLowerCase())
                ){
                missingFriends.add(info["name"].toLowerCase())
            }
        }
 
        for (const playerName of myPlayersSet){
            if (!currentFriendList.includes(playerName)){
                missingFriends.add(playerName)
            }
        }
        $("#missing-friends-container").html(Array.from(missingFriends).join("<br>"))
        $("#missing-friends-container-for-message").text(Array.from(missingFriends).join(";"))
    }
 
    $(document).on("click", ".copyCoords", function () {
        let index = parseInt($(this).data("index"));
        $(`#selectedCoordsTextarea-${index}`).select();
        document.execCommand('copy');
        UI.SuccessMessage('Skopiowano!', 2000);
    });
 
    $(document).on("click", ".resetCoords", function () {
        let index = parseInt($(this).data("index"));
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        settings["selected_coords"][index]['coords'] = []
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
        showDiv()
        TWMap.reload();
        showVillagesOnMap()
    });
 
    $(document).on("click", ".deleteGroup", function () {
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
 
        let index = parseInt($(this).data("index"))
        settings["selected_coords"].splice(index, 1);
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
 
        if (index >= currentSelectedGroup){
            currentSelectedGroup -= 1
        }
 
        showDiv();
        TWMap.reload();
        showVillagesOnMap()
    });
 
    $(document).on("click", ".addNewGroupCoords", function () {
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        settings["selected_coords"].push({'name': "Nazwa grupy", 'coords': []})
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
        showDiv();
        TWMap.reload();
        showVillagesOnMap()
    });
 
    $(document).on("click", ".chooseGroup", function () {
        currentSelectedGroup = parseInt($(this).data("index"))
        showDiv();
    });
 
       function processOnRow(tr) {
           let tds = $(tr).find(".unit-item")
           let index = 0;
           let troopsInfo = {}
           for (const unit of units) {
               troopsInfo[unit] = parseInt($(tds[index]).text())
               index += 1;
           }
 
           return troopsInfo
       }
 
   function getJsonSupportStructure(body) {
        var coordsPattern = /\d{3}\|\d{3}/;
        var villages = {};
        var coords = null;
        $(body).find('#units_table tbody tr').each(function (index, tr) {
            tr = $(tr);
            if (tr.is('.units_away') && (tr.next().is('.row_a, .row_b'))) {
                coords = coordsPattern.exec($(this).text());
                villages[coords] = []
 
 
            } else if (tr.is('.row_a, .row_b')) {
                var support = {};
                support['troops'] = {};
                  for (const unit of units) {
                       support['troops'][unit] = 0
                   }
 
                var links = $('a', tr);
                if (links.length === 2) {
                    support['player_name'] = $(links[1]).text();
                } else if (links.length === 3) {
                    support['player_name'] = $(links[1]).text();
                    support['player_ally'] = $(links[2]).text();
                }
                let unitIndex = 0;
                $('.unit-item', tr).each(function (i, td) {
                     support['troops'][units[unitIndex]] += parseInt($(td).text())
                     unitIndex+= 1
                });
                villages[coords].push(support);
            }
        });
        return villages;
    }
 
 
        function getJsonAwayStructure(body) {
            var coordsPattern = /\d{3}\|\d{3}/;
            var villages = {};
            var coords = null;
            $(body).find('#units_table tbody tr').each(function (index, tr) {
                tr = $(tr);
                if (tr.is('.row_a, .row_b')) {
                    coords = coordsPattern.exec($(this).text());
                    if (!(coords in villages)) {
                        villages[coords] = [];
                    }
                    var away = {};
                    away['troops'] = {};
                      for (const unit of units) {
                       away['troops'][unit] = 0
                   }
                    var links = $('a', tr);
                    if (links.length === 2) {
                        away['player_name'] = $(links[1]).text();
                    } else if (links.length === 3) {
                        away['player_name'] = $(links[1]).text();
                        away['player_ally'] = $(links[2]).text();
                    }
                    let unitIndex = 0;
                    $('.unit-item', tr).each(function (i, td) {
                        away['troops'][units[unitIndex]] += parseInt($(td).text());
                        unitIndex += 1
                    });
                    villages[coords].push(away);
                }
            });
            return villages;
        }
 
            function delay(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }
 
    async function fetchAllVillages(){
        let response_0 = await fetch(currentPureWorldURL + "overview_villages&mode=units")
        await delay(200);
        let response_1 = await fetch(currentPureWorldURL + "overview_villages&mode=units&type=support_detail");
        await delay(200);
        let response_2 = await fetch(currentPureWorldURL + "overview_villages&mode=units&type=away_detail")
 
          let html = await response_0.text();
          let doc = convertToHTML(html);
 
          html = await response_1.text();
          let doc2 = convertToHTML(html);
 
          html = await response_2.text();
          let doc3 = convertToHTML(html);
 
          let ownInVillages = [];
          let allInVillages = [];
          let outsideVillages = [];
          let inMoveVillages = [];
            $(doc).find("#units_table .row_marker").each(function(){
                let trs = $(this).find("tr");
                let ownInVillage = trs[0]
                let allInVillage = trs[1]
                let outsideVillage = trs[2]
                let inMove = trs[3]
                ownInVillages.push(processOnRow(ownInVillage))
                allInVillages.push(processOnRow(allInVillage))
                outsideVillages.push(processOnRow(outsideVillage))
                inMoveVillages.push(processOnRow(inMove))
            })
 
        return {
                "ownInVillages": ownInVillages,
                "allInVillages": allInVillages,
                "outsideVillages": outsideVillages,
                "inMoveVillages": inMoveVillages,
                "supportInVillages": getJsonSupportStructure(doc2),
                "away": getJsonAwayStructure(doc3),
        }
    }
    $(document).on("click", "#tab_players_troops", async function () {
 
        if (Object.keys(currentTroopsData).length <= 0){
            const {ownInVillages, allInVillages, outsideVillages, inMoveVillages, supportInVillages, away} = await fetchAllVillages()
            let ownInVillagesTemplate = `<td>WĹasne wojsko w wiosce</td>`
            let sumOfAllOwnInVillage = {}
            for (const unit of units) {
                sumOfAllOwnInVillage[unit] = 0
            }
            for (const village of ownInVillages){
                for (const unit of units) {
                    sumOfAllOwnInVillage[unit] += village[unit]
                }
            }
 
            let allInVillagesTemplate = `<td>Wojsko w wiosce</td>`
            let sumOfAllVillage = {}
            for (const unit of units) {
                sumOfAllVillage[unit] = 0
            }
            for (const village of allInVillages){
                for (const unit of units) {
                    sumOfAllVillage[unit] += village[unit]
                }
            }
 
 
            let outsideVillagesTemplate = `<td>Wojsko poza wioskÄ</td>`
            let sumOutsideVillages = {}
            for (const unit of units) {
                sumOutsideVillages[unit] = 0
            }
            for (const village of outsideVillages){
                for (const unit of units) {
                    sumOutsideVillages[unit] += village[unit]
                }
            }
 
 
            let inMoveVillagesTemplate = `<td>Wojsko w drodze</td>`
            let sumInMoveVillages = {}
            for (const unit of units) {
                sumInMoveVillages[unit] = 0
            }
            for (const village of inMoveVillages){
                for (const unit of units) {
                    sumInMoveVillages[unit] += village[unit]
                }
            }
 
 
            let unitsRow = ``
            for (const unit of units){
                unitsRow += `<th><img src="${innoGamesURL}asset/234518f7/graphic/unit/unit_${unit}.png"></th>`
                ownInVillagesTemplate += `<td>${sumOfAllOwnInVillage[unit]}</td>`
                allInVillagesTemplate += `<td>${sumOfAllVillage[unit]}</td>`
                outsideVillagesTemplate += `<td>${sumOutsideVillages[unit]}</td>`
                inMoveVillagesTemplate += `<td>${sumInMoveVillages[unit]}</td>`
            }
            let supportPerPlayer = {}
 
            let supportTemplate = ``
            let ownSupportTemplate = ``
            let rowIndex = 0;
            for (const [coords, info] of Object.entries(supportInVillages)){
                let sumForThisVillage = {}
                let sumForThisVillageOwn = {}
                for (const unit of units){
                    sumForThisVillage[unit] = 0
                    sumForThisVillageOwn[unit] = 0
                }
                let hasSupportFromOthers = false;
                let hasSupportFromMe = false;
 
                for (support of info){
                    for (const unit of units) {
                        if ("player_name" in support){
                            if (!(support["player_name"] in supportPerPlayer)){
                                supportPerPlayer[support["player_name"]] = {}
                                  for (const unit of units){
                                    supportPerPlayer[support["player_name"]][unit] = 0
                                }
                            }
                            sumForThisVillage[unit] += support["troops"][unit]
                            supportPerPlayer[support["player_name"]][unit] += support["troops"][unit]
                            hasSupportFromOthers = true;
                        } else {
                            sumForThisVillageOwn[unit] += support["troops"][unit]
                            hasSupportFromMe = true;
                        }
                    }
                }
                let rowClass = `row_a`
                if (rowIndex % 2 === 0){
                    rowClass = `row_b`
                }
                let tdsTemplate = ``
                let ownTdsTemplate = ``
                  for (const unit of units) {
                      tdsTemplate += `<td>${sumForThisVillage[unit]}</td>`
                      ownTdsTemplate += `<td>${sumForThisVillageOwn[unit]}</td>`
                }
                  if (hasSupportFromOthers){
 
                supportTemplate += `<tbody class="${rowClass}"><tr>
                    <td><a target="_self" href="/game.php?village=${villagesByCoords[coords]['id']}&screen=overview">${villagesByCoords[coords]['name']} (${coords}) K${coords[4]}${coords[0]}</a></td>
                    ${tdsTemplate}
                </tr></tbody>`
                  }
                  if (hasSupportFromMe) {
 
                      ownSupportTemplate += `<tbody class="${rowClass}"><tr>
                    <td><a target="_self" href="/game.php?village=${villagesByCoords[coords]['id']}&screen=overview">${villagesByCoords[coords]['name']} (${coords}) K${coords[4]}${coords[0]}</a></td>
                    ${ownTdsTemplate}
                </tr></tbody>`
                  }
 
            }
 
 
 
            let supportPerPlayerTemplate = ``
            let rowClass = `row_a`
            for (const [playerName, info] of Object.entries(supportPerPlayer)){
                if (rowIndex % 2 === 0){
                    rowClass = `row_b`
                }
                let supportPerPlayerTdsTemplate = ``
                   for (const unit of units) {
                      supportPerPlayerTdsTemplate += `<td>${info[unit]}</td>`
                }
 
                supportPerPlayerTemplate += `<tbody class="${rowClass}"><tr>
                        <td>${playerName}</td>
                        ${supportPerPlayerTdsTemplate}
                    </tr></tbody>`
            }
 
            // away
            let supportInAllVillagesTemplate = ``
               for (const [coords, supports] of Object.entries(away)){
                   let sumThisVillage = {}
                   for (const unit of units){
                       sumThisVillage[unit] = 0
                   }
 
                   let playerName = `Ty`
                   for (const info of supports){
                       for (const unit of units) {
                           sumThisVillage[unit] += info["troops"][unit]
                       }
                       if ("player_name" in info){
                           playerName = info["player_name"]
                       }
                   }
 
                    let tdsTemplate = ``
                   for (const unit of units) {
                       tdsTemplate += `<td>${sumThisVillage[unit]}</td>`
                    }
 
                   rowIndex += 1;
                  let rowClass = `row_a`
                if (rowIndex % 2 === 0){
                    rowClass = `row_b`
                }
                supportInAllVillagesTemplate += `<tbody class="${rowClass}"><tr>
                        <td>${playerName}</td>
                        <td><a target="_self" href="/game.php?id=${villagesByCoords[coords]['id']}&screen=info_village">${villagesByCoords[coords]['name']} (${coords}) K${coords[4]}${coords[0]}</a></td>
                        ${tdsTemplate}
                    </tr></tbody>`
            }
 
 
 
 
            let template = `
                <h3 style="margin-top: 12px;">Suma Twojego wojska</h3>
                <table class="vis">
                    <thead>
                        <tr>
                            <th></th>
                            ${unitsRow}
                        </tr>
                    </thead>    
                    <tbody class="row_a"><tr>${ownInVillagesTemplate}</tr></tbody>
                    <tbody class="row_b"><tr>${allInVillagesTemplate}</tr></tbody>
                    <tbody class="row_a"><tr>${outsideVillagesTemplate}</tr></tbody>
                    <tbody class="row_a"><tr>${inMoveVillagesTemplate}</tr></tbody>
                </table>
 
                <h3 style="margin-top: 12px;">Wojska w obronie od innych graczy</h3>
                <table class="vis">
                    <thead>
                        <tr>
                            <th>Wioska</th>
                            ${unitsRow}
                        </tr>
                    </thead>    
                    ${supportTemplate}
                </table>
 
                <h3 style="margin-top: 12px;">Wojska w obronie ze swoich wiosek</h3>
                <table class="vis">
                    <thead>
                        <tr>
                            <th>Wioska</th>
                            ${unitsRow}
                        </tr>
                    </thead>    
                    ${ownSupportTemplate}
                </table>
 
                <h3 style="margin-top: 12px;">Wojska od innych graczy per gracz</h3>
                <table class="vis">
                    <thead>
                        <tr>
                            <th>Nick gracza</th>
                            ${unitsRow}
                        </tr>
                    </thead>    
                    ${supportPerPlayerTemplate}
                </table>
 
                <h3 style="margin-top: 12px;">Twoje wojska w tych wioskach</h3>
                <table class="vis">
                    <thead>
                        <tr>
                            <th>Nick gracza</th>
                            <th>Wioska</th>
                            ${unitsRow}
                        </tr>
                    </thead>    
                    ${supportInAllVillagesTemplate}
                </table>
 
            `
            $("#players_troops").html(template);
        }
 
 
 
    });
 
    $(document).on("click", "#ranking-wojska-btn", function () {
        let input = $("#ranking-wojska-area").val()
        try{
            let troopsPerPlayer = {}
            for (let line of input.split("\n")){
                line = line.split(",")
                let playerName = line[0]
                let coords = line[1]
                let index = 1;
                if (!(playerName in troopsPerPlayer)){
                    troopsPerPlayer[playerName] = {"sum": 0, "sum_deff": 0, "sum_off": 0, "villages": 0}
                    for (const unit of units) {
                        troopsPerPlayer[playerName][unit] = 0
                    }
                }
                troopsPerPlayer[playerName]["villages"] += 1
                for (const unit of units){
                    index += 1;
                    troopsPerPlayer[playerName][unit] += parseInt(line[index]);
                }
 
            }
        let unitsTemplate = ``
        let unitsTemplateForBBcode = ``
        for (const unit of units){
            unitsTemplate += `<th><img src="${innoGamesURL}asset/234518f7/graphic/unit/unit_${unit}.png"></th>`
            unitsTemplateForBBcode += `[||][unit]${unit}[/unit]`
        }
        let listTroopsPerPlayer = []
        for (const [playerName, troops] of Object.entries(troopsPerPlayer)){
            for (const unit of units){
                let unit_per_troop = {
                    "spear": 1,
                    "sword": 1,
                    "axe": 1,
                    "archer": 1,
                    "spy": 2,
                    "light": 4,
                    "marcher": 5,
                    "heavy": 6,
                    "ram": 5,
                    "catapult": 8,
                    "knight": 1,
                    "snob": 100,
                }[unit]
                if (["spear", "sword", "archer", "spy", "heavy"].includes(unit)){
                    troops["sum_deff"] += troops[unit] * unit_per_troop;
                } else {
                    troops["sum_off"] += troops[unit] * unit_per_troop;
                }
            }
            troops["sum"] = troops["sum_deff"] + troops["sum_off"]
            listTroopsPerPlayer.push(
                [playerName, troops]
            )
        }
 
        listTroopsPerPlayer.sort((a, b) => a[1]["sum"] - b[1]["sum"])
        listTroopsPerPlayer.reverse()
        let template = `
        <table>
            <thead>
            <tr>
                <th>Nick</th>
                ${unitsTemplate}
                <th>Suma OFF</th>
                <th>Suma DEFF</th>
                <th>Suma</th>
                <th>Ĺrednio wojska na woskÄ</th>
                <th>Liczba wiosek</th>
            </tr>
            </thead><tbody>`
        let templateBBcode = `[table]
[**]Nick Gracza${unitsTemplateForBBcode}[||]Suma OFF [||]Suma DEFF [||] SUMA [||] Ĺrednio wojska na wioskÄ [||] Liczba wiosek[/**]`
        for (const [playerName, troops] of listTroopsPerPlayer){
            let rowTemplate = ``
            for (const unit of units){
                rowTemplate += `<td>${troops[unit]}</td>`
            }
            template += `
            <tr>
                <td>${playerName}</td>
                ${rowTemplate}
                <td>${troops['sum_off']}</td>
                <td>${troops['sum_deff']}</td>
                <td>${troops['sum']}</td>
                <td>${Math.round(troops['sum'] / troops['villages'])}</td>
                <td>${troops['villages']}</td>
            </tr>`
 
            rowTemplate = ``
            for (const unit of units){
                rowTemplate += `[|]${troops[unit]}`
            }
            templateBBcode += `
            [*]${playerName}${rowTemplate}[|]${troops['sum_off']}[|]${troops['sum_deff']}[|]${troops['sum']}[|]${Math.round(troops['sum'] / troops['villages'])}[|]${troops['villages']}
            `
        }
 
        template += `</tbody></table>`
        templateBBcode += `[/table]`
 
        $("#ranking-wojska-output").html(template);
        $("#ranking-wojska-output-bbcode").val(templateBBcode).show();
        } catch(e) {
            $("#ranking-wojska-output").text("Wklej prawdiĹowe dane. ");
 
        }
    })
 
 
    $(document).on("click", "#slowest-unit-selection li", function () {
        $("#slowest-unit-selection li").addClass("faded");
        $(this).removeClass("faded");
        slowestHelpUnit = $(this).data("unit");
        settings["slowest_unit_for_help"] = $(this).data("unit");
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
    })
 
    $(document).on("input", "#listOfAllies", function () {
        list_of_allies = $(this).val();
        settings["list_of_allies"] = $(this).val();
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
 
        generateClosesPlayers()
    })
 
    $(document).on("input", "#hoursToAttack", function () {
        generateClosesPlayers()
    });
 
    $(document).on("input", "#helpCoords", function () {
        generateClosesPlayers()
    });
 
    $(document).on("click", "#slowest-unit-selection li", function () {
        generateClosesPlayers()
    });
 
    $(document).on("click", ".copyTextArea", function () {
        let index = $(this).data("index");
        $(`textarea[data-index=${index}]`).select();
        document.execCommand('copy');
        UI.SuccessMessage('Skopiowano!', 2000);
    });
 
    $(document).on("click", ".refresh-data", function () {
        getVillagesAndAllies();
    });
 
    function convertToHTML(str) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(str, 'text/html');
      return doc.body;
    }
 
    $(document).on("click", "#tab_missing_friend_list", async function () {
        if (currentFriendList.length <= 0){
          let response = await fetch(currentPureWorldURL + "buddies");
          let html = await response.text();
          let doc = convertToHTML(html);
            $($(doc).find("#content_value table")[1]).find("tr:gt(0)").each(function() {
                let player_name = $($(this).find("td")[1]).text().trim()
                currentFriendList.push(player_name.toLowerCase())
            });
            refreshMissingFriends()
        }
    });
 
    $(document).on("input", "#listOfAlliesForFiends", function (){
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        settings["list_of_allies_for_fiends"] = $("#listOfAlliesForFiends").val()
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
 
        refreshMissingFriends()
    });
 
    $(document).on("input", "#listOfPlayerNamesForFiends", function (){
        let settings = JSON.parse(localStorage.getItem('przydatnik_settings'))
        settings["list_of_players_for_friends"] = $("#listOfPlayerNamesForFiends").val()
        localStorage.setItem('przydatnik_settings', JSON.stringify(settings));
 
        refreshMissingFriends()
    });
 
 
    if (game_data.screen === "map"){
        showDialog()
    } else {
        showDialog()
    }
} else {
    if (game_data.screen === "map"){
        showDialog()
    } else {
        showDialog()
    }
}
 
