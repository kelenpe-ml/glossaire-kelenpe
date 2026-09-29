# Mises à jour d'une application hors ligne

## Objectif

Faire arriver les nouvelles versions sur des postes rarement connectés, parfois par une connexion payée au méga-octet ou par un simple fichier, **sans jamais installer quelque chose de faux, ni interrompre le travail, ni laisser un poste inutilisable**.

## La carte

![L'éditeur signe hors ligne ; la mise à jour arrive par téléchargement partiel ou par fichier transmis ; la signature est vérifiée, et une mise à jour non signée est refusée ; on attend un moment sûr, jamais pendant une vente, on fait une copie de sauvegarde, puis on installe ; si la version démarre, on la garde, sinon on revient à la précédente](/diagrams/archi-mises-a-jour-hors-ligne.svg)

## Décisions

- **Tout fichier signé, sinon refusé.** Une mise à jour qui arrive par messagerie ou par câble peut venir de n'importe qui : seule la signature de l'éditeur prouve son origine.
- **Signature hors de la CI :**
  1. la CI construit l'installateur sans le signer ;
  2. sur l'ordinateur de l'éditeur, une seule commande le récupère, vérifie qu'il vient bien de ce run de CI, le signe et le publie.

  La clé ne quitte jamais cet ordinateur, et seul un installateur construit par la CI peut être signé.
- **Une clé de réserve aussi pour les mises à jour** (voir [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle)). Sans elle, une clé perdue ou volée ne pourrait plus jamais être remplacée.
- **[Téléchargement partiel](/devops/#mise-a-jour-differentielle-differential-update-delta),** en arrière-plan.
  - Sur une [connexion facturée à l'usage](/devops/#connexion-facturee-a-l-usage-metered-connection) : taille annoncée, et accord demandé.
  - Sans internet : le même fichier, transmis puis récupéré par câble.
- **Jamais forcée, jamais au mauvais moment :** « maintenant » ou « à la fermeture », jamais pendant une opération en cours ; copie de sauvegarde avant.
- **[Numérotation des versions](/devops/#numerotation-des-versions-release-and-patch-numbering) :**
  - des versions pour les nouveautés, des correctifs pour les corrections seules : on corrige sans publier le travail en cours ;
  - chaque publication porte ou non l'étiquette « correction de sécurité » ;
  - un poste en lecture seule ne se voit proposer que les publications étiquetées. Pas de branche spéciale pour lui.
- **Retour automatique à la version précédente, seulement si la nouvelle ne démarre pas,** donc avant toute écriture.
  - Si elle a fonctionné puis pose problème : [correction en avant](/devops/#correction-en-avant-fix-forward), par une nouvelle publication.
  - La copie d'avant installation reste un dernier recours, accompagné par l'éditeur.
- **Qui y a droit ?** Les mises à jour sont comprises dans l'abonnement et dans l'essai. En lecture seule, seules les corrections de sécurité sont proposées : on ne laisse pas un client exposé parce qu'il n'a pas renouvelé.

## Pièges connus

- **Revenir en arrière après une écriture :** l'ancienne version ne sait pas lire les données écrites par la nouvelle. D'où la règle « retour seulement si elle ne démarre pas ».
- **Fichier verrouillé sous Windows :** on ne remplace pas un programme qui tourne. Installer à la fermeture, ou par un programme d'installation séparé.
- **Clé des mises à jour sans réserve :** une fuite ou une perte est sans issue.
- **Signer à la main un fichier venu d'ailleurs :** la commande de publication vérifie d'abord la provenance.
- **Signature des mises à jour et signature de code Windows (SmartScreen) :** ce sont deux sujets différents ; l'une ne remplace pas l'autre.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 29 septembre 2026).

- **Les décisions :** dans `docs/licence.md`, section « Mises à jour ».
  - Numérotation : versions 1.4 → 1.5, correctifs 1.4.1 → 1.4.2.
  - Sans internet, le fichier arrive par WhatsApp, puis il est récupéré par câble.
  - La clé des mises à jour reste sur l'ordinateur de Drissa ; sa clé de réserve est gardée ailleurs.
- **Non décidé :** la signature de code Windows.
- **Ordre de construction :** quatrième étape, après l'export, la licence et le backoffice.
- **Ce qui existe déjà :**
  - l'installateur Windows, construit par la CI ;
  - `npm run test:e2e:mise-a-jour` ;
  - la sauvegarde, pour la copie d'avant installation ;
  - `travauxEnCours()`, pour le moment sûr.

## Termes liés

[Mise à jour de l'application](/devops/#mise-a-jour-de-l-application-application-update-distribution-des-versions) · [Mise à jour différentielle](/devops/#mise-a-jour-differentielle-differential-update-delta) · [Connexion facturée à l'usage](/devops/#connexion-facturee-a-l-usage-metered-connection) · [Numérotation des versions](/devops/#numerotation-des-versions-release-and-patch-numbering) · [Retour à la version précédente](/devops/#retour-a-la-version-precedente-rollback) · [Correction en avant](/devops/#correction-en-avant-fix-forward) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Signature de code](/devops/#signature-de-code-code-signing-smartscreen) · [Verrouillage de fichier sous Windows](/devops/#verrouillage-de-fichier-sous-windows-file-locking)
