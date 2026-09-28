import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Glossaire de Drissa',
  description: "Lexique personnel — tech & business pour un dev senior fondateur de Kelenpe",
  lang: 'fr-FR',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]
  ],

  themeConfig: {
    logo: { light: '/logo.png', dark: '/logo-dark.png', alt: 'Kelenpe' },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Rechercher un terme', buttonAriaLabel: 'Rechercher un terme' },
              modal: {
                noResultsText: 'Aucun résultat pour',
                resetButtonTitle: 'Réinitialiser la recherche',
                footer: { selectText: 'sélectionner', navigateText: 'naviguer', closeText: 'fermer' }
              }
            }
          }
        }
      }
    },

    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Glossaire A-Z', link: '/glossaire' },
      {
        text: 'Sections',
        items: [
          { text: 'Backend & architecture', link: '/backend/' },
          { text: 'Frontend & UI/UX', link: '/frontend/' },
          { text: 'DevOps & infra', link: '/devops/' },
          { text: 'Transcoding & streaming vidéo', link: '/streaming/' },
          { text: 'Édition média & traitement image', link: '/media/' },
          { text: 'Jargon entrepreneurial & investisseurs', link: '/business/' },
          { text: 'CropSuite (PFE)', link: '/cropsuite/' },
          { text: 'Architectures', link: '/architectures/' }
        ]
      }
    ],

    sidebar: {
      '/backend/': [{ text: 'Backend & architecture', items: [{ text: 'Vue d’ensemble', link: '/backend/' }] }],
      '/frontend/': [{ text: 'Frontend & UI/UX', items: [{ text: 'Vue d’ensemble', link: '/frontend/' }] }],
      '/devops/': [{ text: 'DevOps & infra', items: [{ text: 'Vue d’ensemble', link: '/devops/' }] }],
      '/streaming/': [{ text: 'Transcoding & streaming vidéo', items: [{ text: 'Vue d’ensemble', link: '/streaming/' }] }],
      '/media/': [{ text: 'Édition média & traitement image', items: [{ text: 'Vue d’ensemble', link: '/media/' }] }],
      '/business/': [{ text: 'Jargon entrepreneurial & investisseurs', items: [{ text: 'Vue d’ensemble', link: '/business/' }] }],
      '/cropsuite/': [{ text: 'CropSuite (PFE)', items: [{ text: 'Vue d’ensemble', link: '/cropsuite/' }] }],
      '/architectures/': [{ text: 'Architectures', items: [
        { text: 'Vue d’ensemble', link: '/architectures/' },
        { text: 'Journal d’événements et projections', link: '/architectures/journal-evenements' },
        { text: 'Rôles, modules et permissions', link: '/architectures/permissions' },
        { text: 'Développement / production', link: '/architectures/developpement-production' },
        { text: 'Chiffrement des données locales', link: '/architectures/chiffrement-donnees-locales' },
        { text: 'Codes de secours', link: '/architectures/codes-de-secours' },
        { text: 'Sauvegarde chiffrée sans serveur', link: '/architectures/sauvegarde-chiffree' },
        { text: 'Impression de tickets ESC/POS', link: '/architectures/impression-escpos' },
        { text: 'Suppression de fond d’image', link: '/architectures/suppression-fond-image' },
        { text: 'Suggestions de saisie', link: '/architectures/suggestions-saisie' },
        { text: 'Journal des erreurs et rapport', link: '/architectures/journal-erreurs' },
        { text: 'Vérification sous Windows', link: '/architectures/verification-windows' },
        { text: 'Licence logicielle hors ligne', link: '/architectures/licence-hors-ligne' },
        { text: 'Mises à jour hors ligne', link: '/architectures/mises-a-jour-hors-ligne' },
        { text: 'Backoffice et clés de signature', link: '/architectures/backoffice-cles' },
        { text: 'Synchronisation multi-poste', link: '/architectures/synchronisation-multi-poste' }
      ] }],
      '/': [{ text: 'Glossaire', items: [{ text: 'Index alphabétique', link: '/glossaire' }] }]
    },

    socialLinks: [],

    footer: {
      message: 'Lexique personnel — mis à jour en continu.',
      copyright: 'Drissa Sidiki Traoré · Kelenpe'
    },

    outline: { label: 'Sur cette page' },
    docFooter: { prev: 'Page précédente', next: 'Page suivante' },
    lastUpdatedText: 'Dernière mise à jour'
  }
})
