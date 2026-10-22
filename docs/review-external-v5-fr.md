# Évaluation du conseil « running method » v5

Oct 22, 2026 · @Boss

## Verdict

**Note globale : environ 7,5/10.** La méthode est rigoureuse et les rapports d'une transparence rare. La faiblesse principale : la base de preuves et l'exécution restent théoriques, puisqu'aucune source primaire n'a été ouverte et que le générateur n'a jamais tourné.

## Ce qui a été vérifié

L'évaluation ne repose pas seulement sur la lecture des rapports :

- Exécution des outils fournis et reconstruction de `rules.json`.
- Recalcul d'une vingtaine de valeurs des exemples chiffrés.
- Comparaison de v5 avec v5-preaudit.
- Affichage des deux rapports HTML sur ordinateur et sur mobile.

## Points forts

- **Les rapports disent vrai sur l'état réel.** Le rapport annonce 290 règles, 206 valeurs par défaut non testées et 27 règles MVP encore en prose. Le vérificateur relancé donne exactement ces chiffres, y compris l'échec volontaire sur ces 27 règles. La reconstruction de `rules.json` donne un fichier identique au caractère près, et les messages passent les contrôles L1 à L8.
- **Les calculs tiennent.** Les plans d'Ana (marathon) et de Tom (10K), ainsi que les fourchettes de Karim et Lea, se recalculent correctement après les corrections post-audit (1,10 × 148 = 162 ; semaine 6 = 360 min ; fourchettes à ±7 % et 10,5 %).
- **Les corrections de l'audit ont bien été appliquées** : risques chiffrés (10 §0), section « quand un plan publié suffit » (00 §8b), formulation « build-ready une fois les blocages B-1 à B-5 levés ».
- **Les faits de fond contrôlés sont justes** : blessures à 7,7 et 17,8 pour 1 000 h, cohorte Frandsen 2025 sur les pics d'une seule sortie, Couch-to-5K, arrêt cardiaque en course à environ 0,6 pour 100 000 avec un tiers de cas mortels.
- **L'architecture est saine.** Un vérificateur séparé du générateur contrôle chaque plan et n'affiche aucun plan qui échoue. Jamais de rattrapage des séances manquées. Une réponse vide ne débloque jamais de charge. Les écoles d'entraînement sont des paramètres, et les désaccords restent consignés au lieu d'être moyennés.

## Faiblesses

1. **La base de preuves plafonne.** Tout repose sur des résumés de recherche web, les PDF ayant été bloqués. C'est bien signalé, mais cela affaiblit tout le critère 8 : 206 règles sur 290 sont des choix prudents non testés.
2. **Une erreur de notation visée par l'audit a survécu.** L'étude Machado (variabilité de 3,4 %) est remontée au niveau CORROBORATED parce qu'elle figure dans « deux notices » (RESOLUTIONS R2-9). Or la règle du projet dit qu'une étude reprise plusieurs fois ne dépasse jamais CREDIBLE. Dans 03 et 08, la même étude est notée ALLEGED. Même problème pour l'étude C25K : ALLEGED dans factdesk3, CORROBORATED dans factdesk5 à partir de deux liens vers le même article.
3. **Un problème statistique dans les allures.** Le seuil de 3,5 % qui déclenche un changement d'allure équivaut à peu près à une seule fois la variabilité d'un test. Entre deux tests, le bruit seul dépasse ce seuil environ une fois sur deux. La baisse étant immédiate, c'est sans danger, mais les plans seront instables.
4. **Une progression agressive pour un profil estimé.** Ana passe de 210 à 360 min par semaine en 5 semaines (+71 %), avec une sortie facile de 1 h 40 en semaine, alors que toutes ses données de départ sont déclarées de mémoire. C'est conforme aux règles, mais un coach tiquerait. La limite sur les pics d'une seule sortie ne remplace pas une limite hebdomadaire plus stricte pour ces profils.
5. **Une contradiction dans le rapport.** L'encadré du haut parle d'un « independent acceptance check », alors que la section 7 dit que tout est interne. C'est le même fichier, `audit-final.md`.
6. **Pas de nouvel audit après les 15 corrections.** Le « environ 8/10 après corrections » est une auto-estimation. Le balisage symétrique des sources (\[corp\], \[author\]…) n'apparaît qu'en 7 endroits environ : la correction 4 n'est appliquée qu'en partie.
7. **Le livrable est lourd.** Environ 5 600 lignes de spécification plus 395 Ko de règles ; le rapport HTML pèse 670 Ko parce qu'il embarque tous les brouillons. Sans le générateur ni l'oracle indépendant (B-5), « implementation-ready » reste une promesse.

## Notes par production

| Production | Note (/10) | En bref |
| --- | --- | --- |
| Rapport final | 8 | Clair, honnête, lisible sur mobile ; une contradiction, trop volumineux |
| Carte du processus | 8 | Propre et lisible |
| Audit interne | 7,5 | A trouvé de vraies erreurs (7 erreurs de calcul) ; pas de second passage |
| Spécification v5 | 7 | Cohérente, vérifiable, prudente ; jamais exécutée, beaucoup de valeurs par défaut |

## Priorités

- [ ] Coder l'oracle et les cas de test (B-5), puis faire tourner le générateur sur les 5 personas.
- [ ] Ramener les études Machado et C25K à CREDIBLE, de façon cohérente dans tous les modules.
- [ ] Revoir le seuil de changement d'allure de 3,5 % (environ 2,8 fois la variabilité serait plus défendable).
- [ ] Corriger la mention « independent acceptance check » dans l'encadré du rapport.
