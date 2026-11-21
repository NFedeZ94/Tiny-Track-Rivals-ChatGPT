TINY TRACK RIVALS — v0.13.6.60 — PREVIEW SOLO MENU/GARAGE
BASE: v0.13.6.59 MENU_GARAGE_LAMPO_PREVIEW (backup non modificato).
MODIFICHE:
- Eliminati i doppi ovali/gradienti/ombre artificiali sotto le auto in menu e garage.
- Garage: sola rotazione 360° a 26,4 frame/s, senza bob, salto, fluttuazione o trasformazioni CSS del canvas.
- Menu: inquadratura fissa a 3/4, breve accelerazione orizzontale di 8px e piccolo salto massimo 4px; tutto animato dentro il canvas.
- Unico renderer Canvas 2D e unico atlas 192 frame per auto, in menu e garage; dimensione visiva determinata dai bounds opachi, stessa luce CSS, nessun filtro speciale per Lampo.
- Scatto GT è il riferimento di presentazione, e la sua immagine sorgente resta intatta.
NON CAMBIATI: geometria, texture e sprite gara, gameplay, fisica, collisioni, IA, audio, online, PWA, icone.
NOTA: la luce già impressa nei fogli di immagini raster non può essere eliminata dal solo sistema Canvas; una piena unificazione dei materiali 3D richiede rigenerare con un renderer 3D comune tutte le sequenze, inclusa Scatto GT.
STATO: versione di ANTEPRIMA, non pubblicata. Eseguire test manuale Safari iPhone prima di sostituire la build online. Per pubblicare conservare backup e sostituire index.html e version.txt; lasciare manifest e icone invariati.
