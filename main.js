// ================================================================
// REMVOX LANDING
// ================================================================

const CONFIG = window.REMVOX_PUBLIC_CONFIG || {
  downloads: { windows: "", linux: "" },
  links: { guide: "", support: "", contact: "" },
  analytics: {
    enabled: false,
    measurementId: "",
    trackDownloads: true,
    trackGallery: true,
    trackContactClicks: true
  }
};


// ================================================================
// UTILIDADES
// ================================================================

let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}


// ================================================================
// GOOGLE ANALYTICS 4
// ================================================================

let analyticsReady = false;

function isValidGaMeasurementId(value) {
  return /^G-[A-Z0-9]+$/i.test(String(value || "").trim());
}

function initGoogleAnalytics() {
  const analytics = CONFIG.analytics || {};
  const measurementId = String(analytics.measurementId || "").trim();

  if (analytics.enabled !== true || !isValidGaMeasurementId(measurementId)) {
    console.info("Google Analytics no está configurado.");
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());

  // Configuración básica. El page_view se envía automáticamente.
  window.gtag("config", measurementId, {
    send_page_view: true
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.onload = () => {
    analyticsReady = true;
    console.info("Google Analytics 4 conectado.");
  };
  script.onerror = () => {
    console.warn("No se pudo cargar Google Analytics.");
  };

  document.head.appendChild(script);
}

function trackEvent(name, params = {}) {
  if (!CONFIG.analytics?.enabled) return;
  if (!isValidGaMeasurementId(CONFIG.analytics?.measurementId)) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", name, params);
}


// ================================================================
// MENÚ RESPONSIVE
// ================================================================

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav?.classList.toggle("open") ?? false;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});


// ================================================================
// DESCARGAS
// ================================================================

document.querySelectorAll(".js-download").forEach((button) => {
  button.addEventListener("click", () => {
    const platform = button.dataset.platform;
    const url = CONFIG.downloads?.[platform];

    if (!url) {
      showToast(
        `Configura la URL de descarga para ${
          platform === "windows" ? "Windows" : "Linux"
        } en js/config.js.`
      );
      return;
    }

    if (CONFIG.analytics?.trackDownloads) {
      trackEvent("download_installer", {
        platform,
        file_url: url
      });
    }

    window.location.href = url;
  });
});

document.querySelectorAll("[data-config-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const key = link.dataset.configLink;
    const url = CONFIG.links?.[key];

    if (!url) {
      event.preventDefault();
      showToast(`Configura la URL "${key}" en js/config.js.`);
      return;
    }

    if (key === "guide") {
      event.preventDefault();

      if (CONFIG.analytics?.trackDownloads) {
        trackEvent("download_guide", {
          file_type: "txt",
          file_url: url
        });
      }

      const downloader = document.createElement("a");
      downloader.href = url;
      downloader.download = "Guia_Instalacion_RemVox.txt";
      downloader.rel = "noopener";
      document.body.appendChild(downloader);
      downloader.click();
      downloader.remove();
      return;
    }

    if (
      (key === "support" || key === "contact") &&
      CONFIG.analytics?.trackContactClicks
    ) {
      trackEvent("contact_click", {
        contact_type: key
      });
    }

    link.href = url;
  });
});


// ================================================================
// RULETA / CARRUSEL
// ================================================================

const carouselSlides = [
  { title: "Llamada activa", image: "assets/interfaz-llamada-activa.png", alt: "Interfaz durante una llamada activa" },
  { title: "Marcación", image: "assets/interfaz-marcador-base.png", alt: "Pantalla principal de marcación" },
  { title: "Historial", image: "assets/interfaz-historial.png", alt: "Historial de llamadas" },
  { title: "Contactos", image: "assets/interfaz-contactos.png", alt: "Gestión de contactos" },
  { title: "Seguimiento", image: "assets/interfaz-programar-seguimiento.png", alt: "Programación de seguimiento" },
  { title: "Recordatorios", image: "assets/interfaz-recordatorios.png", alt: "Panel de recordatorios" },
  { title: "Cuenta SIP", image: "assets/interfaz-cuenta-sip.png", alt: "Configuración de cuenta SIP" },
  { title: "Diagnóstico", image: "assets/interfaz-autodiagnostico.png", alt: "Autodiagnóstico y reparación" },
  { title: "DTMF", image: "assets/interfaz-marcacion-dtmf.png", alt: "Teclado DTMF" }
];

const carouselImage = document.getElementById("compactCarouselImage");
const carouselTitle = document.getElementById("compactCarouselTitle");
const carouselCounter = document.getElementById("compactCarouselCounter");
const prevPreview = document.querySelector("#carouselPrevCard img");
const nextPreview = document.querySelector("#carouselNextCard img");
const prevButton = document.getElementById("compactPrev");
const nextButton = document.getElementById("compactNext");
const dots = Array.from(document.querySelectorAll(".carousel-dot"));
const labels = Array.from(document.querySelectorAll(".carousel-label"));

let carouselIndex = 0;
let carouselSwitchTimer = null;

function normalizeIndex(index) {
  return (index + carouselSlides.length) % carouselSlides.length;
}

function renderCarousel(index, animate = true, source = "unknown") {
  if (!carouselImage || !carouselSlides.length) return;

  carouselIndex = normalizeIndex(index);

  const current = carouselSlides[carouselIndex];
  const previous = carouselSlides[normalizeIndex(carouselIndex - 1)];
  const next = carouselSlides[normalizeIndex(carouselIndex + 1)];

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === carouselIndex);
    dot.setAttribute("aria-current", i === carouselIndex ? "true" : "false");
  });

  labels.forEach((label, i) => {
    label.classList.toggle("active", i === carouselIndex);
    label.setAttribute("aria-pressed", i === carouselIndex ? "true" : "false");
  });

  if (carouselTitle) carouselTitle.textContent = current.title;

  if (carouselCounter) {
    carouselCounter.textContent =
      `${String(carouselIndex + 1).padStart(2, "0")} / ` +
      `${String(carouselSlides.length).padStart(2, "0")}`;
  }

  if (prevPreview) {
    prevPreview.src = previous.image;
    prevPreview.alt = previous.alt;
  }

  if (nextPreview) {
    nextPreview.src = next.image;
    nextPreview.alt = next.alt;
  }

  clearTimeout(carouselSwitchTimer);

  const applyImage = () => {
    carouselImage.src = current.image;
    carouselImage.alt = current.alt;
    carouselImage.classList.remove("switching");
  };

  if (animate) {
    carouselImage.classList.add("switching");
    carouselSwitchTimer = setTimeout(applyImage, 100);
  } else {
    applyImage();
  }

  if (
    animate &&
    CONFIG.analytics?.trackGallery
  ) {
    trackEvent("gallery_view", {
      screen_name: current.title,
      slide_index: carouselIndex + 1,
      source
    });
  }
}

prevButton?.addEventListener("click", () => {
  renderCarousel(carouselIndex - 1, true, "arrow");
});

nextButton?.addEventListener("click", () => {
  renderCarousel(carouselIndex + 1, true, "arrow");
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    renderCarousel(Number(dot.dataset.index), true, "dot");
  });
});

labels.forEach((label) => {
  label.addEventListener("click", () => {
    renderCarousel(Number(label.dataset.index), true, "label");
  });
});


// ================================================================
// MODAL DE IMAGEN
// ================================================================

const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const zoomButton = document.getElementById("compactZoom");
const modalBackdrop = document.getElementById("imageModalBackdrop");
const modalClose = document.getElementById("closeImageModal");

function openImageModal() {
  if (!imageModal || !modalImage) return;

  const current = carouselSlides[carouselIndex];
  modalImage.src = current.image;
  modalImage.alt = current.alt;

  imageModal.classList.add("open");
  imageModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (CONFIG.analytics?.trackGallery) {
    trackEvent("gallery_expand", {
      screen_name: current.title,
      slide_index: carouselIndex + 1
    });
  }

  modalClose?.focus();
}

function closeImageModal() {
  if (!imageModal) return;

  imageModal.classList.remove("open");
  imageModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  zoomButton?.focus();
}

zoomButton?.addEventListener("click", openImageModal);
carouselImage?.addEventListener("click", openImageModal);
modalBackdrop?.addEventListener("click", closeImageModal);
modalClose?.addEventListener("click", closeImageModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageModal?.classList.contains("open")) {
    closeImageModal();
    return;
  }

  if (imageModal?.classList.contains("open")) return;

  const gallery = document.getElementById("galeria");
  if (!gallery) return;

  const rect = gallery.getBoundingClientRect();
  const galleryVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  if (!galleryVisible) return;

  if (event.key === "ArrowLeft") {
    renderCarousel(carouselIndex - 1, true, "keyboard");
  } else if (event.key === "ArrowRight") {
    renderCarousel(carouselIndex + 1, true, "keyboard");
  }
});


// ================================================================
// AÑO + INICIALIZACIÓN
// ================================================================

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

initGoogleAnalytics();
renderCarousel(0, false);
