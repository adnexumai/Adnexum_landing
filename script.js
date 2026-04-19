const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const WHATSAPP_NUMBER = "5492974194948";
const WORKING_DAYS_PER_MONTH = 26;

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("navPanel");
const processTabs = Array.from(document.querySelectorAll("[data-process-tab]"));
const processPanels = Array.from(document.querySelectorAll("[data-process-panel]"));
const counters = Array.from(document.querySelectorAll("[data-count]"));
const revealNodes = Array.from(document.querySelectorAll(".reveal"));
const staticWhatsAppLinks = Array.from(document.querySelectorAll("[data-wa-link]"));
const lossCalculator = document.getElementById("lossCalculator");
const roiLeadForm = document.getElementById("roiLeadForm");
const calculatorWhatsAppLink = document.getElementById("calculatorWhatsAppLink");

const calculatorInputs = {
  dailyLeads: document.getElementById("dailyLeads"),
  lostPercent: document.getElementById("lostPercent"),
  averageTicket: document.getElementById("averageTicket"),
  closeRate: document.getElementById("closeRate")
};

const calculatorResults = {
  lostPerDay: document.getElementById("resultLostPerDay"),
  lostPerMonth: document.getElementById("resultLostPerMonth"),
  potentialSales: document.getElementById("resultPotentialSales"),
  monthlyLoss: document.getElementById("resultMonthlyLoss")
};

const leadFields = {
  name: document.getElementById("leadName"),
  business: document.getElementById("leadBusiness"),
  email: document.getElementById("leadEmail"),
  phone: document.getElementById("leadPhone"),
  context: document.getElementById("leadContext")
};

function syncHeader() {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
}

function closeMenu() {
  if (!navToggle || !navPanel) {
    return;
  }

  navToggle.setAttribute("aria-expanded", "false");
  navPanel.classList.remove("is-open");
}

function toggleMenu() {
  if (!navToggle || !navPanel) {
    return;
  }

  const isOpen = navPanel.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
}

function revealAll() {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

function setupReveal() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function hydrateStaticWhatsAppLinks() {
  staticWhatsAppLinks.forEach((link) => {
    link.href = buildWhatsAppUrl(link.dataset.waLink || "Hola Tomás, quiero hablar por WhatsApp.");
    link.target = "_blank";
    link.rel = "noreferrer";
  });
}

function formatCounter(node, value) {
  const prefix = node.dataset.prefix || "";
  const suffix = node.dataset.suffix || "";
  node.innerHTML = `${prefix}${Math.round(value)}${suffix}`;
}

function animateCounter(node) {
  const target = Number(node.dataset.count);

  if (!Number.isFinite(target)) {
    return;
  }

  if (prefersReducedMotion) {
    formatCounter(node, target);
    return;
  }

  const duration = 1200;
  const start = performance.now();

  const frame = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    formatCounter(node, target * eased);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
}

function setupCounters() {
  if (!counters.length) {
    return;
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach((counter) => animateCounter(counter));
    return;
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.55
    }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function formatInteger(value) {
  return new Intl.NumberFormat("es-AR").format(Math.round(value));
}

function formatUsd(value) {
  return `USD ${new Intl.NumberFormat("es-AR").format(Math.round(value))}`;
}

function getCalculatorValues() {
  if (!calculatorInputs.dailyLeads) {
    return null;
  }

  const dailyLeads = toPositiveNumber(calculatorInputs.dailyLeads.value, 15);
  const lostPercent = Math.min(toPositiveNumber(calculatorInputs.lostPercent.value, 30), 100);
  const averageTicket = toPositiveNumber(calculatorInputs.averageTicket.value, 1500);
  const closeRate = Math.min(toPositiveNumber(calculatorInputs.closeRate.value, 10), 100);
  const lostPerDay = Math.round(dailyLeads * (lostPercent / 100));
  const lostPerMonth = lostPerDay * WORKING_DAYS_PER_MONTH;
  const potentialSales = Math.round(lostPerMonth * (closeRate / 100));
  const monthlyLoss = potentialSales * averageTicket;

  return {
    dailyLeads,
    lostPercent,
    averageTicket,
    closeRate,
    lostPerDay,
    lostPerMonth,
    potentialSales,
    monthlyLoss
  };
}

function buildCalculatorMessage(values, lead = {}) {
  const lines = [
    "Hola Tomás, hice el cálculo de pérdida y quiero revisarlo.",
    lead.name ? `Nombre: ${lead.name}` : null,
    lead.business ? `Negocio: ${lead.business}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `WhatsApp: ${lead.phone}` : null,
    lead.context ? `Contexto: ${lead.context}` : null,
    "",
    "Cálculo estimado:",
    `- Consultas por día: ${formatInteger(values.dailyLeads)}`,
    `- % perdido/no respondido a tiempo: ${formatInteger(values.lostPercent)}%`,
    `- Ticket promedio: ${formatUsd(values.averageTicket)}`,
    `- Tasa de cierre estimada: ${formatInteger(values.closeRate)}%`,
    `- Consultas perdidas/día: ${formatInteger(values.lostPerDay)}`,
    `- Consultas perdidas/mes: ${formatInteger(values.lostPerMonth)}`,
    `- Ventas potenciales/mes: ${formatInteger(values.potentialSales)}`,
    `- Plata que se va por la ventana/mes: ${formatUsd(values.monthlyLoss)}`
  ];

  return lines.filter(Boolean).join("\n");
}

function updateCalculator() {
  const values = getCalculatorValues();

  if (!values) {
    return null;
  }

  if (calculatorResults.lostPerDay) {
    calculatorResults.lostPerDay.textContent = formatInteger(values.lostPerDay);
  }

  if (calculatorResults.lostPerMonth) {
    calculatorResults.lostPerMonth.textContent = formatInteger(values.lostPerMonth);
  }

  if (calculatorResults.potentialSales) {
    calculatorResults.potentialSales.textContent = formatInteger(values.potentialSales);
  }

  if (calculatorResults.monthlyLoss) {
    calculatorResults.monthlyLoss.textContent = formatUsd(values.monthlyLoss);
  }

  if (calculatorWhatsAppLink) {
    calculatorWhatsAppLink.href = buildWhatsAppUrl(buildCalculatorMessage(values));
    calculatorWhatsAppLink.target = "_blank";
    calculatorWhatsAppLink.rel = "noreferrer";
  }

  return values;
}

function setupCalculator() {
  if (!lossCalculator) {
    return;
  }

  Object.values(calculatorInputs)
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", updateCalculator);
    });

  updateCalculator();

  if (!roiLeadForm) {
    return;
  }

  roiLeadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!roiLeadForm.reportValidity()) {
      return;
    }

    const values = updateCalculator();

    if (!values) {
      return;
    }

    const lead = {
      name: leadFields.name?.value.trim(),
      business: leadFields.business?.value.trim(),
      email: leadFields.email?.value.trim(),
      phone: leadFields.phone?.value.trim(),
      context: leadFields.context?.value.trim()
    };

    window.open(
      buildWhatsAppUrl(buildCalculatorMessage(values, lead)),
      "_blank",
      "noopener,noreferrer"
    );
  });
}

function activateProcess(index) {
  processTabs.forEach((tab, tabIndex) => {
    const isActive = tabIndex === index;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  processPanels.forEach((panel, panelIndex) => {
    const isActive = panelIndex === index;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function setupProcessTabs() {
  if (!processTabs.length || processTabs.length !== processPanels.length) {
    return;
  }

  processTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateProcess(index));

    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (index + 1) % processTabs.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (index - 1 + processTabs.length) % processTabs.length;
      } else {
        return;
      }

      event.preventDefault();
      activateProcess(nextIndex);
      processTabs[nextIndex].focus();
    });
  });
}

syncHeader();
hydrateStaticWhatsAppLinks();
setupReveal();
setupCounters();
setupProcessTabs();
setupCalculator();

window.addEventListener("scroll", syncHeader, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 860) {
    closeMenu();
  }
});

if (navToggle) {
  navToggle.addEventListener("click", toggleMenu);
}

if (navPanel) {
  navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

const yearNode = document.getElementById("currentYear");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
