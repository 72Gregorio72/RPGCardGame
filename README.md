# RPGCardGame
# Card Adventure Game 🎴🃏

Un gioco di carte ispirato ai giochi da tavolo, trasformato in versione web interattiva.  
Combina strategia, fortuna e scelta delle carte giuste per superare eventi e migliorare la tua build.

---

## Descrizione

Il giocatore ha una **build** composta da quattro statistiche:  

- **♥ Vita** – la salute del personaggio  
- **♦ Oro** – la valuta utilizzata per bonus e acquisti  
- **♣ Intelletto** – abilità mentale, influisce sul punteggio  
- **♠ Forza** – forza fisica, utile in eventi specifici  

Ogni turno genera un **evento casuale** rappresentato da 7 carte, con un seme dominante.  
Il giocatore pesca 5 carte azione e deve **scegliere quali giocare** per superare l'evento.  
Il punteggio ottenuto dipende dal valore delle carte, dal seme dominante e dalla build del giocatore.

---

## Regole del gioco

1. All’inizio di ogni turno vengono mostrate 7 carte evento.  
2. Il seme dominante viene determinato dalla somma dei valori delle carte di ogni seme.  
3. Viene calcolata la **difficoltà dell’evento** in base al seme dominante e al turno corrente.  
4. Il giocatore sceglie le carte azione da giocare cliccandole (non serve specificare quante).  
5. Il punteggio finale del turno si calcola così:
   - Carte dello stesso seme del dominante: punteggio raddoppiato  
   - Carte di altri semi: punteggio base o bonus parziale  
   - Viene aggiunto un punteggio extra dalla build in base al seme dominante  
6. In base al risultato:
   - **Vittoria** → la build guadagna vita, oro o altri bonus  
   - **Sconfitta** → la build perde vita, oro o altre risorse  
7. Il giocatore può vedere il dettaglio di quanto ha guadagnato o perso dopo ogni turno.  
8. La partita continua finché **la vita del giocatore non arriva a 0**.  

---

## Come giocare
1. Visualizzare le carte evento e il seme dominante.  
2. Cliccare sulle carte azione che si vogliono giocare.  
3. Premere il pulsante **“Gioca selezionate”**.  
4. Leggere il log dei risultati e guadagni/perdite.  
5. Premere **“Prossimo turno”** per iniziare il turno successivo.  
6. Ripetere fino alla **fine della partita**.

---

## Tecnologie utilizzate

- **HTML5** per la struttura  
- **CSS3** con variabili e animazioni per grafica e sfondo  
- **JavaScript** per logica di gioco, gestione carte e interazione  

---

<img width="1919" height="863" alt="image" src="https://github.com/user-attachments/assets/e952db25-1708-403d-bf3e-ab91158695f7" />

---

