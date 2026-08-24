// Google Analytics 4 + Search Console (Institut Delta)
//
// 1. GA4 : créez une propriété sur https://analytics.google.com/
//    Copiez l'ID de mesure (G-XXXXXXXXXX) ci-dessous et mettez enabled: true.
//
// 2. Search Console : https://search.google.com/search-console
//    Ajoutez la propriété https://www.institutdelta.fr/
//    Vérifiez via la balise meta dans index.html (voir commentaire dans le <head>).
//    Puis soumettez le sitemap : https://www.institutdelta.fr/sitemap.xml

window.DELTA_ANALYTICS = {
  // Passez à true une fois ga4MeasurementId renseigné.
  enabled: false,

  // ID de mesure GA4 (ex. G-ABC123XYZ)
  ga4MeasurementId: "G-XXXXXXXXXX",
};
