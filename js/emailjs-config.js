// Configuration EmailJS pour le formulaire de contact (Institut Delta).
//
// IMPORTANT:
// - La clé EmailJS ci-dessous est une clé *publique* (côté navigateur).
// - reCAPTCHA v2 utilise une clé *site* publique.
// - Le destinataire final est en général défini dans le *template* EmailJS (recommandé),
//   mais tu peux aussi utiliser un champ `to_email` si ton template l'affiche/expédite.

window.DELTA_EMAILJS = {
  // Mets `true` une fois les valeurs renseignées.
  enabled: true,

  // EmailJS (public key)
  publicKey: "8CUJUOR3Uhx_X7vxf",

  // EmailJS (IDs)
  serviceId: "service_q90y1er",
  templateId: "template_hrr2y2l",

  // Google reCAPTCHA v2 (site key)
  recaptchaSiteKey: "6Lfeh8MsAAAAADrhePTxe8BIIevAj6RMdM4hf-1n",

  // Optionnel: si ton template EmailJS utilise explicitement un champ `to_email`
  toEmail: "contact@institutdelta.fr",
};
