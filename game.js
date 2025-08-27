/* ======= Utilità e dati base ======= */
const SUITS = [
  { key: "♥", name: "Cuori", cls: "heart" },
  { key: "♦", name: "Quadri", cls: "diamond"},
  { key: "♣", name: "Fiori", cls: "club" },
  { key: "♠", name: "Picche", cls: "spade" },
];
const NUM_EVENTO = 7;
const NUM_AZIONE = 5;
const MAZZO_DIM = 52;

let deck = [];
let indiceMazzo = 0;

const el = (sel) => document.querySelector(sel);
const tplCarta = el("#tpl-carta");

/* ======= Stato di gioco ======= */
// La build iniziale viene generata SOLO al boot e rimane invariata tra le stanze
let player = { vita: 0, oro: 0, intelletto: 0, forza: 0 };
// Nuovo: traccia della vita massima (cuori iniziali)
let playerMax = { vita: 0 }; // solo max HP per ora

let turno = 1;
let evento = [];     // 7 carte evento in stanza
let azioni = [];     // 5 carte azione (mano)
let punteggio = 0;

// Stato modale combattimento
let combatStato = {
  attivo: false,
  mostro: null,     // {seme, valore}
  indexEvento: -1
};

/* ======= Helpers ======= */
function randomInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function valoreToLabel(v){ return v===1?"A":v===11?"J":v===12?"Q":v===13?"K":String(v); }
function suitMeta(seme){ return SUITS.find(s => s.key === seme); }

function creaMazzo(){
  deck = [];
  const semi = ["♥","♦","♣","♠"];
  for (let s=0; s<4; s++){
    for (let v=1; v<=13; v++){
      deck.push({ seme: semi[s], valore: v });
    }
  }
  indiceMazzo = MAZZO_DIM;
}
function pescaCarta(){
  if (indiceMazzo <= 0) throw new Error("Mazzo esaurito!");
  const r = Math.floor(Math.random()*indiceMazzo);
  const c = deck[r];
  deck[r] = deck[indiceMazzo-1];
  indiceMazzo--;
  return c;
}

/* ======= Log ======= */
function log(msg, tipo="info"){
  const box = el("#log");
  const p = document.createElement("p");
  p.className = tipo;
  p.textContent = msg;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}

/* ======= Render ======= */
function creaCartaHTML(carta){
  const node = tplCarta.content.firstElementChild.cloneNode(true);
  const cls = suitMeta(carta.seme)?.cls || "";
  node.classList.add(cls);
  node.querySelectorAll(".carta__valore").forEach(e => e.textContent = valoreToLabel(carta.valore));
  node.querySelector(".carta__seme").textContent = carta.seme;
  return node;
}

function renderBuild(){
  const cont = el("#build");
  // Vita mostrata come attuale/max
  cont.innerHTML = `
    <div class="stat heart"><span class="ico">♥</span><span>Vita</span><span class="val" id="val-vita">${player.vita}/${playerMax.vita}</span></div>
    <div class="stat diamond"><span class="ico">♦</span><span>Oro</span><span class="val" id="val-oro">${player.oro}</span></div>
    <div class="stat club"><span class="ico">♣</span><span>Intelletto</span><span class="val" id="val-int">${player.intelletto}</span></div>
    <div class="stat spade"><span class="ico">♠</span><span>Forza</span><span class="val" id="val-for">${player.forza}</span></div>
  `;
  el("#turno").textContent = turno;
  el("#mostri-rimasti").textContent = contaMostri();
}

function renderEventi(){
  const cont = el("#eventi");
  cont.innerHTML = "";
  evento.forEach((carta, i) => {
    const div = creaCartaHTML(carta);
    div.addEventListener("click", () => onCartaEventoClick(carta, i, div));
    cont.appendChild(div);
  });
}

function renderAzioni(){
  const cont = el("#azioni");
  cont.innerHTML = "";
  azioni.forEach((carta, i) => {
    const div = creaCartaHTML(carta);
    div.dataset.index = i;
    cont.appendChild(div);
  });
}

/* ======= Regole ======= */
function isMostro(c){ return c.seme === "♠" || c.seme === "♣"; }
function contaMostri(){ return evento.filter(isMostro).length; }
function stanzaCompletata(){ return contaMostri() === 0; }

// Solo carte dello stesso seme del mostro
function semeRichiestoPerMostro(mostro){ return mostro.seme; }
function carteAzioneValidePerMostro(mostro){
  const semeRichiesto = semeRichiestoPerMostro(mostro);
  return azioni
    .map((carta, i) => ({ carta, i }))
    .filter(({ carta }) => carta.seme === semeRichiesto);
}

/* ======= Build iniziale (una volta sola) ======= */
function generaBuildInizialeRandom(){
  // Generata una sola volta al boot; poi non si tocca tra le stanze
  const vita = randomInt(8, 14);
  const forza = randomInt(1, 5);       // usata vs ♠
  const intelletto = randomInt(1, 5);  // usata vs ♣
  const oro = randomInt(0, 5);
  player.vita = vita;
  player.forza = forza;
  player.intelletto = intelletto;
  player.oro = oro;
  playerMax.vita = vita; // imposta vita massima iniziale
}

/* ======= Flusso Stanza ======= */
function generaNuovaStanzaMantenendoBuild(){
  // NON tocca player.*; solo carte
  if (indiceMazzo < NUM_EVENTO + NUM_AZIONE) {
    creaMazzo();
  }
  evento = [];
  azioni = [];
  for (let i=0;i<NUM_EVENTO;i++) evento.push(pescaCarta());
  for (let i=0;i<NUM_AZIONE;i++) azioni.push(pescaCarta());

  log(`Nuova stanza generata: 7 eventi e 5 azioni. Build mantenuta.`, "info");
  renderEventi(); renderAzioni(); renderBuild();
}

function fineStanza(){
  log(`Stanza completata! Tutti i mostri sono stati sconfitti.`, "ok");
  turno++;
  // Avvia automaticamente la successiva stanza mantenendo la build
  generaNuovaStanzaMantenendoBuild();
}

/* ======= Interazioni Evento ======= */
function onCartaEventoClick(carta, index, elCard){
  if (combatStato.attivo) return;

  if (carta.seme === "♥"){
    // Cura con cap a vita massima
    const prima = player.vita;
    player.vita = Math.min(player.vita + carta.valore, playerMax.vita);
    const curato = player.vita - prima;
    log(`Pozione ♥${valoreToLabel(carta.valore)}: +${curato} vita (cap ${playerMax.vita}).`, curato > 0 ? "ok" : "info");
    evento.splice(index,1);
    animaCarta(elCard);
    postAzioneEvento();
    return;
  }
  if (carta.seme === "♦"){
    player.oro += carta.valore;
    log(`Tesoro ♦${valoreToLabel(carta.valore)}: +${carta.valore} oro.`, "ok");
    evento.splice(index,1);
    animaCarta(elCard);
    postAzioneEvento();
    return;
  }
  if (isMostro(carta)){
    apriModaleCombattimento(carta, index);
  }
}

function postAzioneEvento(){
  renderBuild();
  renderEventi();
  if (stanzaCompletata()){
    fineStanza();
  }
}

/* ======= Modale Combattimento (scelta manuale, vincolo seme) ======= */
function apriModaleCombattimento(mostro, idxEvento){
  combatStato.attivo = true;
  combatStato.mostro = mostro;
  combatStato.indexEvento = idxEvento;

  const tipo = mostro.seme === "♠" ? "Picche" : "Fiori";
  const semeRichiesto = semeRichiestoPerMostro(mostro);

  el("#combat-desc").textContent =
    `Mostro ${tipo} di valore ${valoreToLabel(mostro.valore)}.`;
  const vincolo = document.querySelector("#vincolo-seme");
  if (vincolo) {
    vincolo.textContent = `Puoi usare solo carte azione dello stesso seme: ${semeRichiesto}.`;
  }

  const grid = el("#azioni-per-combat");
  if (grid){
    grid.innerHTML = "";
    const valide = carteAzioneValidePerMostro(mostro);
    valide.forEach(({ carta, i }) => {
      const div = creaCartaHTML(carta);
      div.addEventListener("click", () => confermaCombattimento(i));
      grid.appendChild(div);
    });
  }

  el("#modal-combat").classList.remove("hidden");
}

function chiudiModaleCombattimento(){
  el("#modal-combat").classList.add("hidden");
  combatStato.attivo = false;
  combatStato.mostro = null;
  combatStato.indexEvento = -1;
}

/* ======= Potenza per seme ======= */
function potenzaBasePerMostro(mostro){
  // Contro ♠ usa solo forza; contro ♣ usa solo intelletto
  if (mostro.seme === "♠") return player.forza;
  if (mostro.seme === "♣") return player.intelletto;
  return 0;
}

/* ======= Risoluzione Combattimento ======= */
function risolviCombattimento(indiceCartaAzione){ // indiceCartaAzione può essere null
  const mostro = combatStato.mostro;
  const idxEvento = combatStato.indexEvento;

  let bonus = 0;
  let descrUso = "senza carta";

  if (Number.isInteger(indiceCartaAzione)){
    // Validazione vincolo seme
    const cartaUso = azioni[indiceCartaAzione];
    const semeRichiesto = semeRichiestoPerMostro(mostro);
    if (!cartaUso || cartaUso.seme !== semeRichiesto){
      log(`Carta non valida: serve una carta ${semeRichiesto}.`, "ko");
      renderAzioni();
      return; // resta in modale
    }
    const rimossa = azioni.splice(indiceCartaAzione, 1)[0];
    bonus = rimossa.valore;
    descrUso = `usando ${rimossa.seme}${valoreToLabel(rimossa.valore)}`;
  }

  const base = potenzaBasePerMostro(mostro);
  const potenza = base + bonus;

  // Regola: bisogna superare (>). Se non si supera, si perde vita = differenza e il mostro scompare comunque.
  if (potenza > mostro.valore){
    log(`Vittoria contro il mostro ${mostro.seme}${valoreToLabel(mostro.valore)} ${descrUso}.`, "ok");
    evento.splice(idxEvento,1);
  } else {
    const danno = mostro.valore - potenza;
    player.vita -= danno;
    log(`Non superi il mostro ${mostro.seme}${valoreToLabel(mostro.valore)} (${descrUso}): -${danno} vita. Il mostro scompare.`, "ko");
    evento.splice(idxEvento,1);
  }

  renderAzioni();
  renderBuild();
  renderEventi();
  chiudiModaleCombattimento();

  if (player.vita <= 0){
    gameOver();
    return;
  }
  if (stanzaCompletata()){
    fineStanza();
  }
}

/* ======= Animazioni utili ======= */
function animaCarta(cardElement){
  if (!cardElement) return;
  cardElement.classList.add('anim-highlight');
  setTimeout(()=> cardElement.classList.remove('anim-highlight'), 700);
}

/* ======= Game Over ======= */
function gameOver(){
  log("Sei stato sconfitto. Game Over.", "ko");
  alert("Game Over. Ricarica per ricominciare.");
}

/* ======= Wiring ======= */
function bindUI(){
  el("#btn-nuova").addEventListener("click", () => {
    if (player.vita <= 0){
      log("Partita terminata. Non puoi creare una nuova stanza a vita zero.", "ko");
      return;
    }
    generaNuovaStanzaMantenendoBuild();
  });
  el("#btn-reshuffle").addEventListener("click", () => {
    creaMazzo();
    log("Mazzo rimescolato.", "info");
  });
  el("#btn-svuota-azione").addEventListener("click", () => {
    log("Nessuna azione automatica. Seleziona manualmente una carta in combattimento.", "info");
  });
  const btnAnnulla = el("#btn-combat-annulla");
  if (btnAnnulla) btnAnnulla.addEventListener("click", () => {
    chiudiModaleCombattimento();
  });
  const btnSenza = el("#btn-combat-senza");
  if (btnSenza) btnSenza.addEventListener("click", () => {
    risolviCombattimento(null);
  });
}

function confermaCombattimento(indiceCartaAzione){
  risolviCombattimento(indiceCartaAzione);
}

/* ======= Boot ======= */
function boot(){
  creaMazzo();
  generaBuildInizialeRandom();   // SOLO QUI si genera la build e il massimo vita
  generaNuovaStanzaMantenendoBuild();
  bindUI();
}
document.addEventListener("DOMContentLoaded", boot);
