# ☀️ Comparateur Photovoltaïque

Application locale (un seul dossier, sans installation, sans serveur) pour analyser et comparer les propositions d'installateurs photovoltaïques.

## Utilisation

1. Ouvrir `index.html` dans un navigateur (double-clic suffit).
2. Les données sont enregistrées automatiquement dans le navigateur (localStorage).
3. Onglets :
   - **Mon profil** : votre maison (pré-remplie) et le dimensionnement recommandé.
   - **Propositions** : un formulaire par installateur. Les champs vides avec question associée génèrent automatiquement la liste des informations manquantes + un mail de demande copiable.
   - **Comparatif & scores** : classement pondéré (prix 30, matériel 25, garanties 20, évolutivité 15, installation 10), €/Wc, production estimée, retour sur investissement, drapeaux rouges (sous-traitance, garanties faibles, batterie chère, onduleur sous-dimensionné…).
   - **Questions à poser** : grille identique de 29 questions à cocher pour chaque installateur.
   - **Stratégie batterie** : règles pour un ajout dans 2-3 ans sans payer deux fois.
   - **Paramètres** : hypothèses (productivité, tarifs, prime, pondérations) + export/import JSON, impression PDF.

## Hypothèses par défaut (à ajuster)

| Paramètre | Valeur | Commentaire |
|---|---|---|
| Productivité | 1 300 kWh/kWc/an | Plein sud, pente 40°, à affiner selon la région |
| Prix électricité | 0,2516 €/kWh TTC | Tarif BLEU moyen |
| Rachat du surplus | 0,04 €/kWh | Tarif EDF OA S21, révisé chaque trimestre |
| Prime autoconsommation | 80 €/kWc | ≤ 9 kWc, révisée chaque trimestre |
| Autoconsommation sans batterie | 30 % | 2 personnes + PAC (à recaler sur les relevés Linky) |
| Autoconsommation avec batterie | 60 % | Batterie ~5 kWh |

## Conçu pour

- Maison 2022 · 140 m² · plein sud · pente 40°
- Pompe à chaleur (chauffage + eau chaude) · 2 occupants · sans VE ni piscine
- Batterie prévue plus tard → système évolutif exigé, pose sans sous-traitance
- Devis comparés : Adekwatt, Artyseo, Sunology, Hellio, EDF (en attente)
