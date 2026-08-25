function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (!(toggle instanceof HTMLButtonElement)) return;
  if (!(nav instanceof HTMLElement)) return;

  const setOpen = (isOpen) => {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  nav.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest(".nav-dropdown-toggle")) return;
    const link = t.closest("a");
    if (link) setOpen(false);
  });
}

function initNavDropdown() {
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  if (!dropdowns.length) return;

  const isTouchNav = () =>
    window.matchMedia("(hover: none), (pointer: coarse)").matches;

  dropdowns.forEach((dropdown) => {
    if (!(dropdown instanceof HTMLDetailsElement)) return;
    const summary = dropdown.querySelector("summary");
    if (!(summary instanceof HTMLElement)) return;

    // Sur tactile, le 1er tap active souvent :hover sans ouvrir <details>.
    // On force l’ouverture/fermeture au premier appui.
    summary.addEventListener("click", (e) => {
      if (!isTouchNav()) return;
      e.preventDefault();
      const willOpen = !dropdown.open;
      dropdowns.forEach((other) => {
        if (other instanceof HTMLDetailsElement && other !== dropdown) {
          other.open = false;
        }
      });
      dropdown.open = willOpen;
    });
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.closest(".nav-dropdown")) return;
    dropdowns.forEach((dropdown) => {
      if (dropdown instanceof HTMLDetailsElement) dropdown.open = false;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    dropdowns.forEach((dropdown) => {
      if (dropdown instanceof HTMLDetailsElement) dropdown.open = false;
    });
  });
}

function initFooterYear() {
  const year = document.getElementById("year");
  if (!year) return;
  year.textContent = String(new Date().getFullYear());
}

function initAnalytics() {
  const cfg = window.DELTA_ANALYTICS;
  if (!cfg?.enabled) return;

  const measurementId = cfg.ga4MeasurementId;
  if (!measurementId || measurementId === "G-XXXXXXXXXX") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

function trackLeadConversion() {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "generate_lead", { method: "contact_form" });
}

function initFaqAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;

  root.addEventListener("toggle", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLDetailsElement)) return;
    if (!target.open) return;

    const items = root.querySelectorAll("details");
    items.forEach((d) => {
      if (d !== target) d.open = false;
    });
  });
}

/** @type {Promise<void> | null} */
let recaptchaReadyPromise = null;

/**
 * reCAPTCHA v2 checkbox est chargé via `contact.html` (api.js).
 * @returns {Promise<void>}
 */
function ensureRecaptchaV2() {
  if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
    return Promise.resolve();
  }
  if (!recaptchaReadyPromise) {
    recaptchaReadyPromise = new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const tick = () => {
        if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
          resolve();
          return;
        }
        if (Date.now() - startedAt > 8000) {
          reject(new Error("reCAPTCHA n’est pas prêt. Vérifiez le chargement de l’API reCAPTCHA v2."));
          return;
        }
        window.setTimeout(tick, 50);
      };
      tick();
    });
  }
  return recaptchaReadyPromise;
}

/** @type {boolean} */
let emailJsInitialized = false;

/**
 * @param {string} publicKey
 */
function ensureEmailJs(publicKey) {
  if (typeof emailjs === "undefined") {
    throw new Error("EmailJS n’est pas chargé. Vérifiez l’inclusion du script sur la page contact.");
  }
  if (!emailJsInitialized) {
    emailjs.init(publicKey);
    emailJsInitialized = true;
  }
}

/**
 * @param {unknown} cfg
 * @returns {cfg is { enabled: boolean; publicKey: string; serviceId: string; templateId: string; recaptchaSiteKey: string; toEmail?: string }}
 */
function isEmailJsConfigReady(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  const c = /** @type {Record<string, unknown>} */ (cfg);
  if (c.enabled !== true) return false;
  const keys = ["publicKey", "serviceId", "templateId", "recaptchaSiteKey"];
  for (const k of keys) {
    const v = c[k];
    if (typeof v !== "string" || !v.trim()) return false;
    if (v.includes("REMPLACER")) return false;
  }
  return true;
}

/**
 * @param {unknown} cfg
 */
function isEmailJsEnabledWithoutRecaptcha(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  const c = /** @type {Record<string, unknown>} */ (cfg);
  if (c.enabled !== true) return false;
  const keys = ["publicKey", "serviceId", "templateId"];
  for (const k of keys) {
    const v = c[k];
    if (typeof v !== "string" || !v.trim()) return false;
    if (v.includes("REMPLACER")) return false;
  }
  const rk = c.recaptchaSiteKey;
  if (typeof rk !== "string" || !rk.trim() || rk.includes("REMPLACER")) return true;
  return false;
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const recaptchaWidget = document.getElementById("recaptchaWidget");
  /** @type {number | null} */
  let recaptchaWidgetId = null;
  if (!(form instanceof HTMLFormElement)) return;
  if (!(status instanceof HTMLElement)) return;

  const get = (id) => document.getElementById(id);
  const nom = get("nom");
  const email = get("email");
  const parcours = get("parcours");
  const message = get("message");

  const cfgAtInit = window.DELTA_EMAILJS;
  if (recaptchaWidget instanceof HTMLElement && isEmailJsConfigReady(cfgAtInit)) {
    ensureRecaptchaV2()
      .then(() => {
        if (!window.grecaptcha || typeof window.grecaptcha.render !== "function") return;
        if (recaptchaWidgetId !== null) return;
        recaptchaWidgetId = window.grecaptcha.render(recaptchaWidget, {
          sitekey: cfgAtInit.recaptchaSiteKey,
        });
      })
      .catch(() => {
        // L'affichage d'erreur est géré au submit si besoin.
      });
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultSubmitLabel =
    submitBtn instanceof HTMLButtonElement ? submitBtn.textContent || "Envoyer" : "Envoyer";

  const setSubmitting = (isSubmitting) => {
    if (!(submitBtn instanceof HTMLButtonElement)) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Envoi en cours…" : defaultSubmitLabel;
  };

  const setStatus = (kind, text) => {
    status.classList.remove("is-error", "is-success");
    if (kind) status.classList.add(kind === "error" ? "is-error" : "is-success");
    status.textContent = text || "";
  };

  const isEmailValid = (value) => {
    const v = String(value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const setInvalid = (el, isInvalid) => {
    if (!(el instanceof HTMLElement)) return;
    el.setAttribute("aria-invalid", String(isInvalid));
  };

  const PARCOURS_LABELS = {
    maths: "Parcours Terminale – Spécialité Mathématiques",
    physique: "Parcours Terminale – Spécialité Physique-Chimie",
    bac: "Parcours Terminale – Réussite Bac",
    concours: "Parcours Ingénieur – Préparation Concours",
  };

  const prefillFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const p = params.get("parcours");
    if (!p) return;
    if (parcours instanceof HTMLSelectElement && Object.hasOwn(PARCOURS_LABELS, p)) {
      parcours.value = p;
    }
  };

  prefillFromQuery();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus(null, "");

    const nomV = nom instanceof HTMLInputElement ? nom.value.trim() : "";
    const emailV = email instanceof HTMLInputElement ? email.value.trim() : "";
    const parcoursV = parcours instanceof HTMLSelectElement ? parcours.value : "";
    const messageV = message instanceof HTMLTextAreaElement ? message.value.trim() : "";

    const ok = Boolean(nomV) && Boolean(messageV) && Boolean(emailV && isEmailValid(emailV));

    setInvalid(nom, !nomV);
    setInvalid(email, !(emailV && isEmailValid(emailV)));
    setInvalid(message, !messageV);

    if (!ok) {
      setStatus("error", "Merci de compléter les champs requis (email valide).");
      return;
    }

    const cfg = window.DELTA_EMAILJS;

    const parcoursLabel = PARCOURS_LABELS[parcoursV] || "";

    const subject = parcoursV
      ? `Institut Delta — Demande d'information (${parcoursV})`
      : "Institut Delta — Demande d'information";

    const sendWithMailto = () => {
      const body = [
        `Nom : ${nomV}`,
        `Email : ${emailV}`,
        parcoursV ? `Parcours : ${parcoursV}` : null,
        "",
        "Message :",
        messageV,
      ]
        .filter(Boolean)
        .join("\n");

      const mailto = `mailto:contact@institutdelta.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      setStatus("success", "Votre messagerie s’ouvre pour envoyer votre message.");
    };

    if (isEmailJsEnabledWithoutRecaptcha(cfg)) {
      setStatus(
        "error",
        "EmailJS est activé, mais reCAPTCHA n’est pas configuré : renseignez recaptchaSiteKey dans js/emailjs-config.js."
      );
      return;
    }

    if (!isEmailJsConfigReady(cfg)) {
      sendWithMailto();
      return;
    }

    setSubmitting(true);

    const sendAt = new Date().toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    Promise.resolve()
      .then(() => ensureRecaptchaV2())
      .then(() => {
        if (!window.grecaptcha) throw new Error("reCAPTCHA indisponible.");
        const token =
          recaptchaWidgetId !== null ? window.grecaptcha.getResponse(recaptchaWidgetId) : window.grecaptcha.getResponse();
        if (!token) throw new Error("Merci de valider le reCAPTCHA.");
        return token;
      })
      .then((token) => {
        ensureEmailJs(cfg.publicKey);
        const toEmail =
          typeof cfg.toEmail === "string" && cfg.toEmail.trim() ? cfg.toEmail.trim() : "contact@institutdelta.fr";

        /** @type {Record<string, string>} */
        const templateParams = {
          from_name: nomV,
          from_email: emailV,
          subject,
          message: messageV,
          parcours: parcoursV || "",
          parcours_label: parcoursLabel,
          send_at: sendAt,
          "g-recaptcha-response": token,
          to_email: toEmail,
        };

        return emailjs.send(cfg.serviceId, cfg.templateId, templateParams);
      })
      .then(() => {
        setStatus("success", "Message envoyé. Nous vous répondrons dès que possible.");
        trackLeadConversion();
        form.reset();
        setInvalid(nom, false);
        setInvalid(email, false);
        setInvalid(message, false);
        if (window.grecaptcha && typeof window.grecaptcha.reset === "function") {
          if (recaptchaWidgetId !== null) window.grecaptcha.reset(recaptchaWidgetId);
          else window.grecaptcha.reset();
        }
      })
      .catch((err) => {
        const msg =
          err && typeof err === "object" && "text" in err && typeof err.text === "string"
            ? err.text
            : err instanceof Error
              ? err.message
              : "Une erreur est survenue lors de l’envoi.";
        setStatus("error", msg);
        if (window.grecaptcha && typeof window.grecaptcha.reset === "function") {
          if (recaptchaWidgetId !== null) window.grecaptcha.reset(recaptchaWidgetId);
          else window.grecaptcha.reset();
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAnalytics();
  initMobileNav();
  initNavDropdown();
  initFooterYear();
  initFaqAccordion();
  initContactForm();
});
