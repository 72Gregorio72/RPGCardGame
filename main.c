#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <locale.h>
#include <string.h>

#define NUM_EVENTO 7
#define NUM_AZIONE 5
#define MAZZO_DIM 52

typedef struct {
    char *seme;
    int valore;
} Carta; 

typedef struct {
    int vita;
    int oro;
    int intelletto;
    int forza;
} Build;

Carta mazzo[MAZZO_DIM];
int indice_mazzo = 0;

// Colori ANSI
#define RED    "\x1b[31m"
#define YELLOW "\x1b[33m"
#define GREEN  "\x1b[32m"
#define BLUE   "\x1b[34m"
#define RESET  "\x1b[0m"

// dimensioni carte
#define LARGHEZZA_CARTA 11
#define ALTEZZA_CARTA   7

void gotoxy(int x, int y) { printf("\033[%d;%dH", y, x); }
void clearScreen() { printf("\033[2J\033[H"); }

void crea_mazzo() {
    char *semi[4] = {"♥", "♦", "♣", "♠"};
    int idx = 0;
    for (int s = 0; s < 4; s++)
        for (int v = 1; v <= 13; v++) {
            mazzo[idx].seme = semi[s];
            mazzo[idx].valore = v;
            idx++;
        }
    indice_mazzo = MAZZO_DIM;
}

Carta pesca_carta_dal_mazzo() {
    if (indice_mazzo <= 0) {
        printf("Errore: mazzo esaurito!\n");
        exit(1);
    }
    int r = rand() % indice_mazzo;
    Carta c = mazzo[r];
    mazzo[r] = mazzo[indice_mazzo - 1];
    indice_mazzo--;
    return c;
}

char* colore_seme(char *seme) {
    if (strcmp(seme,"♥")==0) return RED;
    if (strcmp(seme,"♦")==0) return YELLOW;
    if (strcmp(seme,"♣")==0) return GREEN;
    if (strcmp(seme,"♠")==0) return BLUE;
    return RESET;
}

void stampa_carta_in_pos(Carta c, int x, int y) {
	const char *col = colore_seme(c.seme);
	char val_str[4];
	if (c.valore == 11)
		strcpy(val_str, "J");
	else if (c.valore == 12)
		strcpy(val_str, "Q");
	else if (c.valore == 13)
		strcpy(val_str, "K");
	else
		sprintf(val_str, "%d", c.valore);

	int spazio_sx = 1; // spazio a sinistra
	int spazio_dx = LARGHEZZA_CARTA - 2 - strlen(val_str) + 1; // 2 bordi

	gotoxy(x, y);     printf("%s┌───────────┐", col);
	gotoxy(x, y+1);   printf("│%*s%s%*s│", spazio_sx, "", val_str, spazio_dx, "");
	gotoxy(x, y+2);   printf("│           │");
	gotoxy(x, y+3);   printf("│     %s     │", c.seme);
	gotoxy(x, y+4);   printf("│           │");
	gotoxy(x, y+5);   printf("│%*s%s%*s│", spazio_dx, "", val_str, spazio_sx, "");
	gotoxy(x, y+6);   printf("└───────────┘%s", RESET);
}

void stampa_carte_grafiche_in_linea(Carta carte[], int n, int startX, int startY) {
    for (int i = 0; i < n; i++)
        stampa_carta_in_pos(carte[i], startX + i * (LARGHEZZA_CARTA + 2), startY);
}

int somma_seme(Carta carte[], int n, char *seme) {
    int somma = 0;
    for (int i = 0; i < n; i++)
        if (strcmp(carte[i].seme, seme)==0) somma += carte[i].valore;
    return somma;
}

void stampa_turno(int turno, Build player) {
    printf("\x1b[1m\n╔══════════════════════════════════════╗\n");
    printf("║           TURNO %2d                   ║\n", turno);
    printf("╠══════════════════════════════════════╣\n");
	printf("║ Build: %s%2d♥%s | %s%2d♦%s | %s%2d♣%s | %s%2d♠%s         ║\n",
		   RED, player.vita, RESET, YELLOW, player.oro, RESET,
		   GREEN, player.intelletto, RESET, BLUE, player.forza, RESET);
    printf("╚══════════════════════════════════════╝\x1b[0m\n");
}

int main() {
    setlocale(LC_ALL,"");
    srand(time(NULL));

	Build player = {rand() % 13 + 1, rand() % 13 + 1, rand() % 13 + 1, rand() % 13 + 1};
    int turno = 1;

    while (player.vita > 0) {
        clearScreen();
        stampa_turno(turno, player);

        crea_mazzo();

        Carta evento[NUM_EVENTO];
        for(int i=0;i<NUM_EVENTO;i++) evento[i]=pesca_carta_dal_mazzo();
        stampa_carte_grafiche_in_linea(evento, NUM_EVENTO, 5, 8);

        // Dominante
        char *semi[4]={"♥","♦","♣","♠"};
        char *dominante = "♥";
        int max_somma = 0;
        for(int i=0;i<4;i++){
            int s = somma_seme(evento, NUM_EVENTO, semi[i]);
            if(s>max_somma){ max_somma=s; dominante=semi[i]; }
        }
        gotoxy(1,18);
        printf("Seme dominante: %s%s%s (somma=%d)\n", colore_seme(dominante), dominante, RESET, max_somma);

        int difficolta = max_somma + turno*2;
        printf("Difficoltà evento: %d\n", difficolta);

        // Carte azione
        Carta azione[NUM_AZIONE];
        for(int i=0;i<NUM_AZIONE;i++) azione[i]=pesca_carta_dal_mazzo();
        printf("\nCarte azione disponibili:\n");
        stampa_carte_grafiche_in_linea(azione, NUM_AZIONE, 5, 22);

        int scelta[NUM_AZIONE]={0};
        int n_scelte;
        gotoxy(1,32);
        printf("Quante carte vuoi giocare? ");
        scanf("%d",&n_scelte);
        for(int i=0;i<n_scelte;i++){
            int idx;
            printf("Seleziona la carta #%d da giocare (1-%d): ", i+1, NUM_AZIONE);
            scanf("%d",&idx);
            if(idx>=1 && idx<=NUM_AZIONE) scelta[idx-1]=1;
        }

        // Calcolo punteggio e aggiornamento build
        int punteggio=0, bonus_oro=0, cuori_temporanei=0, quadri_totale=0;
        int cuori_non_usati=0, quadri_non_usati=0;

        for(int i=0;i<NUM_AZIONE;i++){
            Carta c=azione[i];

            if(scelta[i]){
                int moltiplicatore = 0;
				if(strcmp(dominante,"♥")==0){
					if(strcmp(c.seme,"♥")==0) moltiplicatore=2;
					else if(strcmp(c.seme,"♠")==0) moltiplicatore=1;
					else moltiplicatore=0; // fiori e quadri
				}
				else if(strcmp(dominante,"♣")==0){
					if(strcmp(c.seme,"♣")==0) moltiplicatore=2;
					else if(strcmp(c.seme,"♥")==0 || strcmp(c.seme,"♠")==0) moltiplicatore=1;
					else moltiplicatore=0; // quadri
				}
				else if(strcmp(dominante,"♠")==0){
					if(strcmp(c.seme,"♠")==0) moltiplicatore=2;
					else if(strcmp(c.seme,"♥")==0) moltiplicatore=1;
					else moltiplicatore=0; // fiori e quadri
				}
				else if(strcmp(dominante,"♦")==0){
					if(strcmp(c.seme,"♦")==0) moltiplicatore=2;
					else moltiplicatore=1; // tutti gli altri semi x1
				}

				punteggio += c.valore * moltiplicatore;
            } else {
                // Carte non giocate
				if(strcmp(c.seme,"♥")==0) cuori_non_usati += c.valore;
				if(strcmp(c.seme,"♦")==0) {
					quadri_non_usati += c.valore; // somma per usare a fine turno
				}
            }
            if(strcmp(c.seme,"♦")==0) quadri_totale += c.valore;
        }

        // aggiungi punteggio base della build
        if(strcmp(dominante,"♥")==0) punteggio += player.vita;
        if(strcmp(dominante,"♦")==0) punteggio += player.oro;
        if(strcmp(dominante,"♣")==0) punteggio += player.intelletto;
        if(strcmp(dominante,"♠")==0) punteggio += player.forza;

        printf("\nPunteggio totale prova: %d\n", punteggio);
        int successo = punteggio >= difficolta;

        printf("\n--- Risultato turno ---\n");
        if(strcmp(dominante,"♠")==0){
            int diff = difficolta - punteggio;
            if(diff<0) diff=0;
            if(successo){
                player.vita += 2 * cuori_non_usati;
                printf("Vittoria Picche! Vita +%d\n", 2*cuori_non_usati);
            } else {
                player.vita -= 2 * cuori_non_usati + diff;
                if(player.vita<0) player.vita=0;
                printf("Sconfitta Picche! Vita -%d\n", 2*cuori_non_usati + diff);
            }
        } else if(strcmp(dominante,"♣")==0){
            if(successo){
                player.vita += cuori_non_usati;
                printf("Vittoria Fiori! Vita +%d\n", cuori_non_usati);
            } else {
                player.vita -= cuori_temporanei;
                if(player.vita<0) player.vita=0;
                printf("Sconfitta Fiori! Vita -%d\n", cuori_temporanei);
            }
        } else if(strcmp(dominante,"♦")==0){
            if(successo){
                player.oro += 2*quadri_totale + quadri_non_usati;
                printf("Vittoria Quadri! Oro +%d\n", 2*quadri_totale + quadri_non_usati);
            } else {
                player.oro -= quadri_non_usati;
                if(player.oro<0) player.oro=0;
                printf("Sconfitta Quadri! Oro -%d\n", quadri_non_usati);
            }
        } else if(strcmp(dominante,"♥")==0){
            if(successo){
                player.vita += cuori_non_usati;
                printf("Vittoria Cuori! Vita +%d\n", cuori_non_usati);
            } else {
                int diff = difficolta - punteggio; if(diff<0) diff=0;
                player.vita -= diff;
                if(player.vita<0) player.vita=0;
                printf("Sconfitta Cuori! Vita -%d\n", diff);
            }
        }
		player.oro += quadri_non_usati;
        printf("Oro guadagnato dal turno: %d♦\n", bonus_oro);
        printf("\nBuild aggiornata: %s%d♥%s %s%d♦%s %s%d♣%s %s%d♠%s\n",
               RED,player.vita,RESET,YELLOW,player.oro,RESET,
               GREEN,player.intelletto,RESET,BLUE,player.forza,RESET);

        turno++;
        getchar(); getchar();
    }

    printf("\n\x1b[1m╭────────────────────────────╮\n");
    printf("│        GAME OVER!          │\n");
    printf("╰────────────────────────────╯\x1b[0m\n");
    printf("Sei morto al turno %d\n", turno-1);
    return 0;
}
