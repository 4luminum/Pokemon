var navAll = document.getElementById("nav-all")
var navMine = document.getElementById("nav-mine")
var navAllMine = document.getElementById("nav-all-mine")
var navBreedables = document.getElementById("nav-breedables")
var navInventory = document.getElementById("nav-inventory")
var navLookingFor = document.getElementById("nav-looking-for")
var spreadsheetId = 0
if(window.location.search)
	spreadsheetId = window.location.search.substring(1)
var pokemonInventories = []
var pokemonLookingFor = []

var selectedTab

function getWorksheetUrl(spreadsheetId, worksheetId) {
    return "https://spreadsheets.google.com/feeds/list/" + spreadsheetId + "/" + worksheetId + "/public/values?alt=json";
}
function getSpreadsheetUrl(spreadsheetId) {
    return "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetId + "/public/basic?alt=json";
}
function getValue(field) {
    if (field) return field.$t;
    return undefined;
}
function tryValues(values, entry){
	for(var i in values)
		if(entry["gsx$"+values[i]] && entry["gsx$"+values[i]].$t)
			return entry["gsx$"+values[i]].$t
	return undefined
}

function parseSpreadsheet(response){
	for(var i in response.feed.entry){
		var entry = response.feed.entry[i]
		var title = getValue(entry.title).trim()
		if(title.toLowerCase().indexOf("item") > -1 ||
			title.toLowerCase().indexOf("template") > -1 ||
			title.toLowerCase().indexOf("config") > -1 ||
			title.toLowerCase().indexOf("database") > -1 ||
			title.toLowerCase().indexOf("resource") > -1 ||
			title.toLowerCase() == "db"
		){
			if(i=="0")
				requestJSON(getWorksheetUrl(spreadsheetId, 1), parseConfig)
			continue
		}
		addNewTab(title, i)
	}
	if(pokemonLookingFor.length || pokemonInventories.length){
		navAll.style.display = ""
		navAll.onclick = function(){
			deselectTabs()
			navAll.className = "active"
			infoMove()
			update()
		}
		navMine.style.display = ""
		navAllMine.onclick = function(){
			deselectTabs()
			navAllMine.className = "active"
			selectedTab = "mine"
			infoMove()
			update()
		}
		navBreedables.onclick = function(){
			deselectTabs()
			navBreedables.className = "active"
			selectedTab = "breedables"
			infoMove()
			update()
		}
	}
	tryLoad()
}

function addNewTab(title, index){
	var tab = {}
	tab.title = title
	tab.id = (+index) + 1
	tab.pokemons = []
	if(title.toLowerCase().startsWith("lf") ||
		title.toLowerCase().startsWith("looking for")
	){
		pokemonLookingFor.push(tab)
		tab.navEntry = newTag("li", navLookingFor)
		navLookingFor.style.display = ""
	} else {
		pokemonInventories.push(tab)
		tab.navEntry = newTag("li", navInventory)
		navInventory.style.display = ""
	}
	tab.navEntry.innerHTML = tab.title
	tab.navEntry.className = "inactive"
	tab.navEntry.onclick = function(){
		infoMove()
		selectTab(tab)
	}
	requestJSON(getWorksheetUrl(spreadsheetId, tab.id), parseSheet(tab))
}

function selectTab(tab){
	deselectTabs()
	tab.navEntry.className = "active"
	selectedTab = tab
	update()
}

function deselectTabs(){
	for(var i=0; i<navLookingFor.children.length; i++)
		navLookingFor.children[i].className = "inactive"
	for(var i=0; i<navInventory.children.length; i++)
		navInventory.children[i].className = "inactive"
	navAll.className = "inactive"
	navAllMine.className = "inactive"
	navBreedables.className = "inactive"
	selectedTab = undefined
}

function parseConfig(response){
	var entry = response.feed.entry[0]
	var name = tryValues(["ingamename"],entry)
	if(name)
		document.getElementById("nav-all-mine").innerHTML = name + "'s Pokémon"
	var friendcode = tryValues(["friendcode"],entry)
	var contactUrl = tryValues(["contacturl"],entry)
	var hideBreedables = tryValues(["showbreedables"],entry)
	if(contactUrl && name)
		name = "<a href=\"" + contactUrl + "\">" + name + "</a>'s <a href=\"https://docs.google.com/spreadsheets/d/" + spreadsheetId + "\">Pokémon</a>"
	if(name)
		document.getElementById("main-title").innerHTML = name
	if(friendcode){
		document.getElementById("sub-title").innerHTML = "FC: " + friendcode
		document.getElementById("sub-title").style.display = ""
	}
	if(hideBreedables)
		document.getElementById("nav-breedables").style.display = "none"
}

function parseSheet(tab){
	return function(response){
		for(var i in response.feed.entry){
			loadPokemon(response.feed.entry[i], tab)
		}
	}
}



function loadPokemon(entry, tab){
	var pokemon = {
		get forms() {return this.base.forms },
		get stats() {return this.base.stats },
		get abilities() {return this.base.abilities },
		get classification() {return this.base.classification },
		get eggGroups() {return this.base.eggGroups },
		get eggs() {return this.base.eggs },
		get height() {return this.base.height },
		get weight() {return this.base.weight },
		get moves() {return this.base.moves },
		get ratio() {return this.base.ratio },
		get types() {return this.base.types }
	}
	if(!identifyPokemon(entry, pokemon))
		return
	pokemon.nature = getValue(entry.gsx$nature)
	pokemon.ability = getValue(entry.gsx$ability)
	pokemon.ivs = {}
	pokemon.ivs.hp = tryValues(["hpiv", "ivhp", "hp"], entry) || "x"
	pokemon.ivs.atk = tryValues(["atkiv", "attackiv", "attack", "ivattack", "ivatk", "atk"], entry) || "x"
	pokemon.ivs.def = tryValues(["defiv", "defenseiv", "defense", "ivdefense", "ivdef", "def"], entry) || "x"
	pokemon.ivs.spa = tryValues(["spaiv", "spatkiv", "spatk", "ivspatk", "ivspa", "spa"], entry) || "x"
	pokemon.ivs.spd = tryValues(["spdiv", "spdefiv", "spdef", "ivspdef", "ivspd", "spd"], entry) || "x"
	pokemon.ivs.spe = tryValues(["speiv", "speediv", "speed", "ivspeed", "ivspe", "spe"], entry) || "x"
	pokemon.evs = {}
	pokemon.evs.hp = tryValues(["hpev", "evhp"], entry) || "x"
	pokemon.evs.atk = tryValues(["atkev", "attackev", "evattack", "evatk"], entry) || "x"
	pokemon.evs.def = tryValues(["defev", "defenseev", "evdefense", "evdef"], entry) || "x"
	pokemon.evs.spa = tryValues(["spaev", "spatkev", "evspatk", "evspa"], entry) || "x"
	pokemon.evs.spd = tryValues(["spdev", "spdefev", "evspdef", "evspd"], entry) || "x"
	pokemon.evs.spe = tryValues(["speev", "speedev", "evspeed", "evspe"], entry) || "x"
	pokemon.hiddenPower = tryValues(["hiddenpower", "hidden"], entry)
	pokemon.learntMoves = [
		tryValues(["move1", "eggmove1"], entry),
		tryValues(["move2", "eggmove2"], entry),
		tryValues(["move3", "eggmove3"], entry),
		tryValues(["move4", "eggmove4"], entry)
		].filter(e => e)
	pokemon.gender = tryValues(["gender", "sex"], entry)
	switch (pokemon.base.ratio) {
	case "1:0":
		pokemon.gender = '♂'
		break;
	case "0:1":
		pokemon.gender = '♀'
		break;
	case "—":
		pokemon.gender = '—'
		break;
	}
	pokemon.amount = tryValues(["amount", "count"], entry)
	pokemon.shiny = tryValues(["shiny"], entry)
	pokemon.nickname = tryValues(["nickname"], entry)
	pokemon.ot = tryValues(["ot"], entry)
	pokemon.tid = tryValues(["tid"], entry)
	pokemon.level = tryValues(["level","lvl","lv"], entry)
	pokemon.language = tryValues(["language","lang"], entry)
	pokemon.notes = tryValues(["notes","note","comments","comment"], entry)
	pokemon.balls = [tryValues(["pokeball","ball"], entry)].filter(e=>e)
	if(pokemon.balls.length == 0){
		if (getValue(entry.gsx$poke)) pokemon.balls.push("Poké Ball")
		if (getValue(entry.gsx$great)) pokemon.balls.push("Great Ball")
		if (getValue(entry.gsx$Ultra)) pokemon.balls.push("Ultra Ball")
		if (getValue(entry.gsx$master)) pokemon.balls.push("Master Ball")
		if (getValue(entry.gsx$safari)) pokemon.balls.push("Safari Ball")
		if (getValue(entry.gsx$level)) pokemon.balls.push("Level Ball")
		if (getValue(entry.gsx$lure)) pokemon.balls.push("Lure Ball")
		if (getValue(entry.gsx$moon)) pokemon.balls.push("Moon Ball")
		if (getValue(entry.gsx$friend)) pokemon.balls.push("Friend Ball")
		if (getValue(entry.gsx$love)) pokemon.balls.push("Love Ball")
		if (getValue(entry.gsx$heavy)) pokemon.balls.push("Heavy Ball")
		if (getValue(entry.gsx$fast)) pokemon.balls.push("Fast Ball")
		if (getValue(entry.gsx$sport)) pokemon.balls.push("Sport Ball")
		if (getValue(entry.gsx$premier)) pokemon.balls.push("Premier Ball")
		if (getValue(entry.gsx$repeat)) pokemon.balls.push("Repeat Ball")
		if (getValue(entry.gsx$timer)) pokemon.balls.push("Timer Ball")
		if (getValue(entry.gsx$nest)) pokemon.balls.push("Nest Ball")
		if (getValue(entry.gsx$net)) pokemon.balls.push("Net Ball")
		if (getValue(entry.gsx$dive)) pokemon.balls.push("Dive Ball")
		if (getValue(entry.gsx$luxury)) pokemon.balls.push("Luxury Ball")
		if (getValue(entry.gsx$heal)) pokemon.balls.push("Heal Ball")
		if (getValue(entry.gsx$quick)) pokemon.balls.push("Quick Ball")
		if (getValue(entry.gsx$dusk)) pokemon.balls.push("Dusk Ball")
		if (getValue(entry.gsx$cherish)) pokemon.balls.push("Cherish Ball")
		if (getValue(entry.gsx$dream)) pokemon.balls.push("Dream Ball")
		if (getValue(entry.gsx$beast)) pokemon.balls.push("Beast Ball")
	}
	if(pokemon.balls.length == 0) { // compatibility with richi3f's sheet
		if (entry.gsx$_dcgjs) pokemon.balls.push("Poké Ball")
		if (entry.gsx$_ddv49) pokemon.balls.push("Great Ball")
		if (entry.gsx$_d415a) pokemon.balls.push("Ultra Ball")
		if (entry.gsx$_d5fpr) pokemon.balls.push("Master Ball")
		if (entry.gsx$_d6ua4) pokemon.balls.push("Safari Ball")
		if (entry.gsx$_d88ul) pokemon.balls.push("Level Ball")
		if (entry.gsx$_dkvya) pokemon.balls.push("Lure Ball")
		if (entry.gsx$_dmair) pokemon.balls.push("Moon Ball")
		if (entry.gsx$_dnp34) pokemon.balls.push("Friend Ball")
		if (entry.gsx$_dp3nl) pokemon.balls.push("Love Ball")
		if (entry.gsx$_df9om) pokemon.balls.push("Heavy Ball")
		if (entry.gsx$_dgo93) pokemon.balls.push("Fast Ball")
		if (entry.gsx$_di2tg) pokemon.balls.push("Sport Ball")
		if (entry.gsx$_djhdx) pokemon.balls.push("Premier Ball")
		if (entry.gsx$_dw4je) pokemon.balls.push("Repeat Ball")
		if (entry.gsx$_dxj3v) pokemon.balls.push("Timer Ball")
		if (entry.gsx$_dyxo8) pokemon.balls.push("Nest Ball")
		if (entry.gsx$_e0c8p) pokemon.balls.push("Net Ball")
		if (entry.gsx$_dqi9q) pokemon.balls.push("Dive Ball")
		if (entry.gsx$_drwu7) pokemon.balls.push("Luxury Ball")
		if (entry.gsx$_dtbek) pokemon.balls.push("Heal Ball")
		if (entry.gsx$_dupz1) pokemon.balls.push("Quick Ball")
		if (entry.gsx$_e7d2q) pokemon.balls.push("Dusk Ball")
		if (entry.gsx$_e8rn7) pokemon.balls.push("Cherish Ball")
		if (entry.gsx$_ea67k) pokemon.balls.push("Dream Ball")
		if (entry.gsx$_ebks1) pokemon.balls.push("Beast Ball")
	}
	tab.pokemons.push(pokemon)
}

function identifyPokemon(entry, pokemon){
	pokemon.id = Number(getValue(entry.gsx$dexno) || getValue(entry.gsx$no) || getValue(entry.gsx$number) || getValue(entry.gsx$id))
	pokemon.name = getValue(entry.gsx$name) || getValue(entry.gsx$pokemon)
	pokemon.form = getValue(entry.gsx$form)
	if(!pokemon.id && !pokemon.name)
		return false
	var possiblePokes = pokemons.filter(e => pokemon.id == e.id || pokemon.name.toLowerCase() == e.name.toLowerCase())
	if(possiblePokes.length == 1){
		pokemon.base = possiblePokes[0]
	} else if (possiblePokes.length > 0) {
		var possibleForms = possiblePokes.filter(e => e.form.toLowerCase().indexOf(pokemon.form.toLowerCase()) > -1)
		if(possibleForms.length == 1)
			pokemon.base = possibleForms[0]
		else
			pokemon.base = possiblePokes[0]
	} else return false
	return true
}

if(spreadsheetId)
	requestJSON(getSpreadsheetUrl(spreadsheetId), parseSpreadsheet)