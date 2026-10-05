import {
  BotIcon,
  CalculatorIcon,
  CoffeeIcon,
  CrosshairIcon,
  FlagIcon,
  GraduationCapIcon,
  KeyboardIcon,
  RocketIcon,
  SwordsIcon,
  TractorIcon,
} from "lucide-react"

/**
 * The starting points offered under the home page composer.
 *
 * The label is what the button says; the prompt is what is actually built. They
 * are deliberately different lengths - a button has room for two words, and the
 * agent needs a brief. So each prompt says what the player does, what it looks
 * like, and how a round ends, because a first turn spent guessing at those is
 * a first turn that produces someone else's game.
 *
 * They stay in the player's voice rather than the agent's: nothing here names
 * a file, an engine primitive, or a three.js class. The system prompt in
 * `@/lib/games/instructions` already covers how a game is built - these only
 * have to settle what to build.
 *
 * Multiplayer here means local multiplayer - two players on one keyboard -
 * which the engine's input bindings genuinely support. Online multiplayer has
 * no place in this list: a game is static files behind a plain HTTP server, so
 * there is nothing for two browsers to talk through.
 */
export const suggestions = [
  {
    label: "Calcul mental",
    icon: CalculatorIcon,
    prompt:
      "Un jeu de calcul mental en 3D : je me déplace dans un labyrinthe de couloirs en pierre dont chaque porte " +
      "ne s'ouvre que si je réponds juste à une multiplication qui s'affiche. Une bonne réponse ouvre la porte, " +
      "une fausse me fait perdre cinq secondes et fait clignoter l'écran. Les tables se complètent au fil des " +
      "couloirs, un chrono tourne, et un petit HUD montre mon temps restant et mon score. Atteindre la sortie du " +
      "labyrinthe avant la fin du chrono ; trois mauvaises réponses d'affilée me renvoient au départ du couloir.",
  },
  {
    label: "Système solaire",
    icon: GraduationCapIcon,
    prompt:
      "Un jeu d'exploration du système solaire : je pilote une petite sonde spatiale entre les huit planètes, " +
      "avec des distances et tailles suggérées mais un système raccourci pour rester jouable. Approcher une " +
      "planète ouvre sa fiche (nom, taille, distance au Soleil, particularité) puis pose une question à " +
      "choix multiples ; répondre juste valide la visite sur une carte de mission. Le Soleil est une étoile " +
      "chaude qu'il ne faut pas survoler de trop près. Missions accomplies quand les huit planètes sont " +
      "validées ; le carburant de la sonde est la limite.",
  },
  {
    label: "Frappe rapide",
    icon: KeyboardIcon,
    prompt:
      "Un jeu de frappe chronométré : des mots français descendent lentement de haut en bas de l'écran, dans un " +
      "style néon sur fond sombre, et disparaissent dès que je les tape correctement au clavier. Les mots " +
      "touchent le sol si je suis trop lent, et trois mots perdus terminent la partie. La vitesse augmente par " +
      "paliers tous les dix mots, les mots gagnent une lettre bonus qui double les points, et le HUD montre " +
      "score, vies et niveau. Un combo monte tant qu'aucun mot n'est perdu et multiplie les points.",
  },
  {
    label: "Ma ferme",
    icon: TractorIcon,
    prompt:
      "Un jeu de gestion de ferme vu de dessus, en 3D douce et colorée : je sème, j'arrose et je récolte mes " +
      "parcelles, je m'occupe des poules et des vaches qui me suivent des yeux, et je vends ma production au " +
      "marché du village pour acheter graines, clôtures et animaux. Les saisons passent et changent ce qui " +
      "pousse, les poules pondent mieux quand elles sont heureuses, et la nuit tombe en cycle court. Objectif : " +
      "rembourser le prêt de la ferme en gérant bien ses parcelles, sans laisser les animaux affamés.",
  },
  {
    label: "Le snack du collège",
    icon: CoffeeIcon,
    prompt:
      "Un jeu de gestion : je tiens le snack du collège pendant la récréation. Les élèves débarquent par vagues " +
      "avec des commandes différentes (croissant, jus, sandwich) que je prépare sur des postes de travail, " +
      "sers et encaisse avant qu'ils ne s'impatientent et repartent. Une journée dure quelques minutes, " +
      "l'argent gagné débloque de nouvelles recettes et un deuxième poste de préparation, et la file " +
      "d'attente se lit d'un coup d'œil. Réussir la journée, c'est servir trente clients sans en faire fuir " +
      "plus de trois.",
  },
  {
    label: "Base spatiale",
    icon: RocketIcon,
    prompt:
      "Un jeu de gestion d'une base spatiale sur Mars : je construis des modules (serre, panneau solaire, " +
      "dortoir, extracteur d'eau) sur une grille de terrain martien, et je dois équilibrer énergie, oxygène " +
      "et nourriture de mes colons. Des incidents tombent régulièrement : tempête de sable qui masque les " +
      "panneaux, fuite dans une serre, et demandent une réparation rapide au risque d'un effet en cascade. La " +
      "base grandit module par module ; la partie est gagnée quand la base accueille cent colons, perdue si " +
      "l'oxygène tombe à zéro.",
  },
  {
    label: "FPS robots",
    icon: BotIcon,
    prompt:
      "Un FPS contre des vagues de robots : visée à la souris avec capture du pointeur, déplacement au clavier, " +
      "saut et sprint, dans une arène industrielle aux néons bleus et aux passerelles. Les robots arrivent par " +
      "vagues plus nombreuses et plus rapides, certains tirent à distance et d'autres foncent au corps à corps. " +
      "Le HUD montre santé, munitions et numéro de vague, les tirs font des étincelles et les robots explosent " +
      "en pièces détachées. Survivre à cinq vagues pour gagner ; perdre toute sa santé termine la partie avec " +
      "le score atteint.",
  },
  {
    label: "Arène Nerf",
    icon: CrosshairIcon,
    prompt:
      "Un FPS façon lanceurs Nerf, coloré et rapide : fléchettes en mousse, arène de jardin avec cachettes " +
      "rebondissantes et toboggans, style cartoon assumé aux couleurs vives. Des cibles robotisées surgissent " +
      "des buissons et me canardent de fléchettes molles qui me font reculer sans jamais saigner. Le " +
      "lanceur se recharge tout seul avec un bruit de ressort, et un tir en plein centre vaut double. Le HUD " +
      "montre le score et le temps restant. Éliminer vingt cibles le plus vite possible ; la partie se termine " +
      "au chrono ou après dix touches reçues.",
  },
  {
    label: "Course à deux",
    icon: FlagIcon,
    prompt:
      "Un jeu de course à deux joueurs sur le même clavier, en écran partagé vertical : joueur 1 en ZQSD, " +
      "joueur 2 aux flèches, sur un circuit de campagne aux virages serrés, avec des raccourcis boueux " +
      "risqués et des pneus qui rebondissent. Trois tours, un compte à rebours au départ, et la voiture " +
      "glisse sur l'herbe si je coupe trop. Le premier franchit la ligne et affiche son temps ; l'écran " +
      "montre les deux positions en direct.",
  },
  {
    label: "Duel de tanks",
    icon: SwordsIcon,
    prompt:
      "Un duel de tanks à deux joueurs sur le même clavier : joueur 1 en ZQSD avec tir sur E, joueur 2 aux " +
      "flèches avec tir sur Entrée, dans une arène vue de dessus aux murs de briques destructibles. Les obus " +
      "rebondissent sur les murs, ce qui permet des tirs en angle, et chaque touche enlève un point de vie " +
      "sur cinq. Le meilleur des cinq rounds gagne le match ; entre les rounds, l'arène se répare et de " +
      "nouveaux murs apparaissent pour changer les angles.",
  },
]
