/* ======= Utilità e dati base ======= */
const SUITS = [
  { key: "♥", name: "Cuori",  cls: "heart"  },
  { key: "♦", name: "Quadri", cls: "diamond"},
  { key: "♣", name: "Fiori",  cls: "club"   },
  { key: "♠", name: "Picche", cls: "spade"  },
];

const NUM_EVENTO = 7;
const NUM_AZIONE = 5;
const MAZZO_DIM  = 52;

let deck = [];
let indiceMazzo = 0;

const el = (sel) => document.querySelector(sel);
const tplCarta = el("#tpl-carta");

/* ======= Stato di gioco ======= */
let player = { vita: 0, oro: 0, intelletto: 0, forza: 0 };
let turno = 1;

let evento = [];
let azioni = [];

let dominante = { suit: "♥", somma: 0 };
let difficolta = 0;
let punteggio = 0;

function randomInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function valoreToLabel(v){ return v===11?"J":v===12?"Q":v===13?"K":String(v); }

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

function sommaSeme(arr, seme){
  return arr.filter(c => c.seme === seme).reduce((a,b)=>a+b.valore,0);
}

function suitMeta(seme){
  return SUITS.find(s => s.key === seme);
}

/* ======= Animazioni ======= */
// Funzione generica per animare un elemento con una classe temporanea
function animaElemento(element, animClass, durata = 650) {
  if (!element) return;
  element.classList.add(animClass);
  setTimeout(() => element.classList.remove(animClass), durata);
}

// Animazione carta: flip e highlight
function animaCartaFlip(cardElement) {
  animaElemento(cardElement, 'anim-flip', 600);
}
function animaCartaHighlight(cardElement) {
  animaElemento(cardElement, 'anim-highlight', 700);
}

// Animazione punteggio "bounce"
function animaPunteggio(scoreElement) {
  animaElemento(scoreElement, 'score-anim', 600);
}

/* ======= Render ======= */
function renderBuild(){
  const cont = el("#build");
  cont.innerHTML = `
    <div class="stat heart"><span class="ico">♥</span><span>Vita</span><span class="val">${player.vita}</span></div>
    <div class="stat diamond"><span class="ico">♦</span><span>Oro</span><span class="val">${player.oro}</span></div>
    <div class="stat club"><span class="ico">♣</span><span>Intelletto</span><span class="val">${player.intelletto}</span></div>
    <div class="stat spade"><span class="ico">♠</span><span>Forza</span><span class="val">${player.forza}</span></div>
  `;
  el("#turno-num").textContent = String(turno);
}

function makeCardElem(card){
  const node = tplCarta.content.firstElementChild.cloneNode(true);
  const meta = suitMeta(card.seme);
  node.classList.add(meta.cls);
  node.dataset.seme = card.seme;
  node.dataset.valore = card.valore;

  const vals = node.querySelectorAll(".carta__valore");
  vals.forEach(v => v.textContent = valoreToLabel(card.valore));
  node.querySelector(".carta__seme").textContent = card.seme;

  return node;
}

function renderCards(containerSel, cards, selectable=false){
  const cont = el(containerSel);
  cont.innerHTML = "";
  cards.forEach((c, idx) => {
    const node = makeCardElem(c);
    if (selectable){
      node.classList.add("selectable");
      node.addEventListener("click", () => toggleSelezione(idx));
    }
    cont.appendChild(node);
  });
}

function renderDominanteEDifficolta(){
  const meta = suitMeta(dominante.suit);
  el("#dominante").innerHTML = `${dominante.suit} <span style="opacity:.7">(${meta.name}, somma ${dominante.somma})</span>`;
  el("#difficolta").textContent = String(difficolta);
}

function setPunteggio(val){
  punteggio = val;
  el("#punteggio").textContent = String(punteggio);
}

function log(msg, cls="info"){
  const l = el("#log");
  const p = document.createElement("p");
  p.className = cls;
  p.innerHTML = msg;
  l.appendChild(p);
  l.scrollTop = l.scrollHeight;
}

function clearLog(){
  el("#log").innerHTML = "";
}

/* ======= Selezione carte azione ======= */
let selected = new Set();
function toggleSelezione(idx){
  const cardEl = el("#azioni").children[idx];
  if (selected.has(idx)){
    selected.delete(idx);
    cardEl.classList.remove("selezionata");
  } else {
    selected.add(idx);
    cardEl.classList.add("selezionata");
	animaCartaHighlight(cardEl);
  }
}

function calcolaTurnoEsito(){
  // Salviamo i valori prima del turno
  const vitaPrima = player.vita;
  const oroPrima = player.oro;

  let p = 0;
  let quadriTotale = 0;
  let cuoriNonUsati = 0;
  let quadriNonUsati = 0;
  let cuoriTemporanei = 0;

  for (let i=0; i<azioni.length; i++){
    const c = azioni[i];
    if (c.seme === "♦") quadriTotale += c.valore;

    if (selected.has(i)){
      let moltiplicatore = 0;
      if (dominante.suit === "♥"){
        if (c.seme === "♥") moltiplicatore = 2;
        else moltiplicatore = 1;
      } else if (dominante.suit === "♣"){
        if (c.seme === "♣") moltiplicatore = 2;
        else moltiplicatore = 1;
      } else if (dominante.suit === "♠"){
        if (c.seme === "♠") moltiplicatore = 2;
        else moltiplicatore = 1;
      } else if (dominante.suit === "♦"){
        if (c.seme === "♦") moltiplicatore = 2;
        else moltiplicatore = 1;
      }
      p += c.valore * moltiplicatore;
    } else {
      if (c.seme === "♥") cuoriNonUsati += c.valore;
      if (c.seme === "♦") quadriNonUsati += c.valore;
    }
  }

  if (dominante.suit === "♥") p += player.vita;
  if (dominante.suit === "♦") p += player.oro;
  if (dominante.suit === "♣") p += player.intelletto;
  if (dominante.suit === "♠") p += player.forza;

  setPunteggio(p);
  animaPunteggio(el("#punteggio"));
  const successo = p >= difficolta;

  let diff = Math.max(difficolta - p, 0);
  let msg = "";

  if (dominante.suit === "♠"){
    if (successo){
      player.vita += 2 * cuoriNonUsati;
      msg += `Vittoria Picche! `;
    } else {
      player.vita -= 2 * diff;
      player.vita = Math.max(player.vita, 0);
      msg += `Sconfitta Picche! `;
    }
  } else if (dominante.suit === "♣"){
    if (successo){
      //player.vita += cuoriNonUsati;
      msg += `Vittoria Fiori! `;
    } else {
      player.vita -= diff;
      player.vita = Math.max(player.vita, 0);
      msg += `Sconfitta Fiori! `;
    }
  } else if (dominante.suit === "♦"){
    if (successo){
      player.oro += 2 * diff;
      msg += `Vittoria Quadri! `;
    } else {
      player.oro -= diff * 2;
      player.oro = Math.max(player.oro, 0);
      msg += `Sconfitta Quadri! `;
    }
  } else if (dominante.suit === "♥"){
    if (successo){
      player.vita += diff;
      msg += `Vittoria Cuori! ` + diff;
    } else {
      player.vita -= diff;
      player.vita = Math.max(player.vita, 0);
      msg += `Sconfitta Cuori! `;
    }
  }

  if (diff > 0){
	msg += `Non hai raggiunto la difficoltà di <b>${difficolta}</b> (ti mancavano <b>${diff}</b> punti).`;
  } else {
	player.oro += quadriNonUsati;
	player.vita += cuoriNonUsati;
  }

  // Calcoliamo differenze
  const deltaVita = player.vita - vitaPrima;
  const deltaOro  = player.oro - oroPrima;

  // Mostriamo SUBITO i risultati nel log
  log(`Punteggio totale prova: <b>${p}</b>`, "info");
  log(`Esito: ${successo ? "<b class='ok'>Vittoria</b>" : "<b class='ko'>Sconfitta</b>"} — ${msg}`, successo ? "ok":"ko");

  if (deltaVita !== 0) {
    log(`♥ Vita: ${vitaPrima} → ${player.vita} (${deltaVita > 0 ? "+"+deltaVita : deltaVita})`, "info");
  }
  if (deltaOro !== 0) {
    log(`♦ Oro: ${oroPrima} → ${player.oro} (${deltaOro > 0 ? "+"+deltaOro : deltaOro})`, "info");
  }

	renderBuild();

	// Se il giocatore è morto → game over subito
	if (player.vita <= 0){
		setTimeout(()=> gameOver(), 400);
		return;
	}

	// Altrimenti mostriamo il bottone "Prossimo turno"
	el("#btn-gioca").disabled = true;
	el("#btn-salta").disabled = true;
	el("#btn-next").style.display = "inline-block";
}

el("#btn-next").addEventListener("click", () => {
  turno++;
preparaTurno();
// Anima tutte le carte evento
// Anima tutte le carte evento (prima)
Array.from(el("#evento").children).forEach((c, i) => {
	setTimeout(() => animaCartaFlip(c), i * 100);
});
// Anima tutte le carte azione (dopo tutte le evento)
Array.from(el("#azioni").children).forEach((c, i) => {
	setTimeout(() => animaCartaFlip(c), (el("#evento").children.length * 100) + i * 100);
});
  // reset interfaccia
  el("#btn-gioca").disabled = false;
  el("#btn-salta").disabled = false;
  el("#btn-next").style.display = "none";
});



/* ======= Preparazione turno ======= */
function preparaTurno(){
  clearLog();
  creaMazzo();

  evento = Array.from({length: NUM_EVENTO}, () => pescaCarta());
  azioni = Array.from({length: NUM_AZIONE}, () => pescaCarta());

  const semi = ["♥","♦","♣","♠"];
  let dom = "♥";
  let maxSomma = 0;
  for (const s of semi){
    const som = sommaSeme(evento, s);
    if (som > maxSomma){ maxSomma = som; dom = s; }
  }
  dominante = { suit: dom, somma: maxSomma };
  difficolta = maxSomma + turno*2;

  renderBuild();
  renderCards("#evento", evento, false);
  renderCards("#azioni", azioni, true);
  renderDominanteEDifficolta();
  setPunteggio(0);

  selected.clear();
  Array.from(el("#azioni").children).forEach(c => c.classList.remove("selezionata"));

  log(`Seme dominante: <b>${dominante.suit}</b> (somma=${maxSomma})`, "info");
  log(`Difficoltà evento: <b>${difficolta}</b>`, "info");
  log(`Seleziona le carte che vuoi giocare, poi premi <b>Gioca selezionate</b>.`, "info");
}

/* ======= Avvio / Game Over ======= */
function nuovaPartita(){
  player = {
    vita: randomInt(1,13),
    oro: randomInt(1,13),
    intelletto: randomInt(1,13),
    forza: randomInt(1,13),
  };
  turno = 1;
  el("#overlay-gameover").classList.add("hidden");
  renderBuild();
  preparaTurno();
}

function gameOver(){
  el("#gameover-msg").textContent = `Sei morto al turno ${turno-1}.`;
  el("#overlay-gameover").classList.remove("hidden");
}

/* ======= Event Listeners ======= */
el("#btn-nuova-partita").addEventListener("click", nuovaPartita);
el("#btn-restart").addEventListener("click", nuovaPartita);

el("#btn-gioca").addEventListener("click", () => {
  calcolaTurnoEsito();
});

el("#btn-salta").addEventListener("click", () => {
  selected.clear();
  Array.from(el("#azioni").children).forEach(c => c.classList.remove("selezionata"));
  calcolaTurnoEsito();
});

/* ======= Autostart ======= */
window.addEventListener("load", () => {
  nuovaPartita();
});
