# Mises à jour d'une application hors ligne

## Objectif

Faire arriver les nouvelles versions sur des postes rarement connectés, parfois par une connexion payée au méga-octet ou par un simple fichier, **sans jamais installer quelque chose de faux, ni interrompre le travail, ni laisser un poste inutilisable**.

## La carte

![L'éditeur signe hors ligne ; la mise à jour arrive par téléchargement partiel ou par fichier transmis ; la signature est vérifiée, et une mise à jour non signée est refusée ; on attend un moment sûr, jamais pendant une vente, on fait une copie de sauvegarde, puis on installe ; si la version démarre, on la garde, sinon on revient à la précédente](/diagrams/archi-mises-a-jour-hors-ligne.svg)

## Décisions

- **Tout fichier signé, sinon refusé.**
  - Une mise à jour qui arrive par messagerie ou par clé USB peut venir de n'importe qui : seule la signature de l'éditeur prouve son origine.
  - La clé de signature des mises à jour reste hors du serveur.
- **Téléchargement partiel** (seulement ce qui a changé), en arrière-plan quand une connexion existe.
- **Connexion facturée à l'usage :**
  - rien de gros sans demander, avec la taille affichée avant ;
  - les frais sont payés par l'utilisateur, pas par l'éditeur.
- **Sans internet :** le même fichier, transmis autrement (messagerie, clé USB), avec la même vérification.
- **Jamais forcée, jamais au mauvais moment :**
  - l'utilisateur choisit « maintenant » ou « à la fermeture » ;
  - jamais pendant une opération en cours ;
  - les corrections de sécurité insistent davantage.
- **Filet de sécurité :**
  - copie de sauvegarde avant d'installer ;
  - contrôle que la nouvelle version démarre ;
  - sinon, retour automatique à la précédente.
- **Qui y a droit ?**
  - comprises dans l'abonnement et dans l'essai ;
  - en lecture seule, seules les corrections de sécurité : on ne laisse pas un client exposé parce qu'il n'a pas renouvelé.

## Pièges connus

- **Retour arrière impossible après une migration :** si la nouvelle version a déjà transformé les données ou écrit des événements d'un nouveau format, l'ancienne ne sait pas les lire. Il faut prévoir la compatibilité, ou revenir aussi à la copie.
- **Fichier verrouillé sous Windows :** on ne remplace pas un programme qui tourne. Installer à la fermeture, ou par un programme d'installation séparé.
- **Clé des mises à jour sans réserve :** si elle fuit ou se perd, plus aucune mise à jour ne peut annoncer la nouvelle clé.
- **Signature des mises à jour et signature de code Windows (SmartScreen) :** ce sont deux sujets différents ; l'une ne remplace pas l'autre.
- **Mise à jour construite par la CI, clé hors du serveur :** la signature se fait sur l'ordinateur de l'éditeur, après la CI. Il faut une étape de publication claire.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 28 septembre 2026).

- **Les décisions :** dans `docs/licence.md` (section « Mises à jour »). Sans internet, le fichier arrive par WhatsApp ; la clé des mises à jour reste uniquement sur l'ordinateur de Drissa.
- **Ce qui existe déjà :**
  - l'installateur Windows, construit par la CI ;
  - `npm run test:e2e:mise-a-jour`, qui rouvre une base créée par la version précédente ;
  - la sauvegarde, qui fournit la copie avant installation ;
  - la détection d'un ticket en cours (`travauxEnCours()`), qui donne le « moment sûr ».

## Termes liés

[Mise à jour de l'application](/devops/#mise-a-jour-de-l-application-application-update-distribution-des-versions) · [Mise à jour différentielle](/devops/#mise-a-jour-differentielle-differential-update-delta) · [Connexion facturée à l'usage](/devops/#connexion-facturee-a-l-usage-metered-connection) · [Retour à la version précédente](/devops/#retour-a-la-version-precedente-rollback) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Signature de code](/devops/#signature-de-code-code-signing-smartscreen) · [Verrouillage de fichier sous Windows](/devops/#verrouillage-de-fichier-sous-windows-file-locking) · [Installateur](/devops/#installateur-installer)
