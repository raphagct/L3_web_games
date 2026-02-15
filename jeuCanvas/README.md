# Jeu de la Pastèque

## Composition de l'équipe
- **GUICHET Raphaël**  
- **LECHEVALIER Mathis**

## Le jeu

Le but de notre jeu est de faire fusionner des fruits pour en créer de plus gros. L’objectif est d’atteindre la pastèque avant que les fruits n’atteignent la limite rouge située en haut de l’écran.
Pour simuler la physique des fruits, nous avons utilisé la librairie **Matter.js**.

Dans le but de respecter au maximum la consigne initiale, nous n’avons pas utilisé `Render` ni `Runner` de Matter.js. Nous avons préféré développer notre propre moteur de rendu ainsi que notre propre boucle de jeu.

## Aide externe

Pour les images des fruits, nous avons demandé à un ami externe au projet de les dessiner.

## Ressources utilisées

Pour réaliser ce mini-jeu, nous avons utilisé les ressources suivantes :

- Les jeux canvas du cours (char qui tire, etc.)
- Le MOOC sur les canvas
- La documentation officielle de Matter.js :  
  https://www.brm.io/matter-js/
- La playlist YouTube de TheCodingTrain sur Matter.js :  
  https://www.youtube.com/watch?v=urR596FsU68&list=PLRqwX-V7Uu6bLh3T_4wtrmVHOrOEM1ig_

## Utilisation de l’IA générative

Nous nous sommes également aidés d’IA générative pour :

- **Comprendre Matter.js**  
  *Exemple de prompt* :  
  > « Fais une balle qui rebondit via Matter.js »

- **Améliorer le CSS**  
  *Exemple de prompt* :  
  > « Améliore l’UX de notre jeu (boutons, etc.) »

- **Réaliser des effets complexes**  
  *Exemple de prompt* :  
  > « Réalise un effet de particules quand les fruits fusionnent »

- **Résoudre des problèmes complexes dans le code**  
  *Exemple de prompt* :  
  > « Comment modifier le rayon de collision des fruits selon la position du fruit dans l’image ? »


## Parties du projet réussies

Nous sommes fiers de la logique de chute et de la fusion des fruits, qui nous a demandé de bien réfléchir et de bien comprendre le fonctionnement de Matter.js.  
L’`Engine`, qui joue le rôle du moteur physique, possède un monde (`World`) dans lequel on ajoute des corps (`Bodies`), qui sont ici des fruits. Ces corps ont des propriétés physiques comme la masse, la vélocité, etc.  
Les collisions sont directement gérées par **Matter.js** : il détecte quand deux corps entrent en collision et déclenche un événement (`Matter.Events.on`).

Nous sommes aussi fiers de notre logique de game over dans sa globalité.  
Nous avons, dans un premier temps, utilisé un attribut du body qui joue le rôle de capteur (`isSensor: true`), qui détecte les collisions mais ne réagit pas physiquement.  
Puis, nous avons vérifié si le fruit était au-dessus de la ligne rouge (donc en collision avec le capteur) et s’il était à l’arrêt.

## Difficultés rencontrées

Nous avons aussi rencontré quelques problèmes, notamment avec les images des fruits.  
Les fruits n’étaient pas toujours bien positionnés au centre de l’image, ils n’étaient pas parfaitement ronds et certains avaient en plus des "tiges" (ananas, cerise...).  
Pour résoudre ce problème, nous avons modifié les rayons de collision des fruits selon le type de fruit.  
Et mis à part l’ananas et sa couronne qui nous pose problème, les collisions des autres fruits fonctionnent correctement.

Nous avons aussi rencontré des problèmes avec la structure du code.  
Nous avons eu du mal à séparer la logique dans différents fichiers (collisions.js, ecouteurs.js...) de façon propre et sans tout casser...  
Mais nous sommes parvenus à un résultat plutôt satisfaisant.
