const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("navPanel");
const processTabs = Array.from(document.querySelectorAll("[data-process-tab]"));
const processPanels = Array.from(document.querySelectorAll("[data-process-panel]"));
const counters = Array.from(document.querySelectorAll("[data-count]"));
const revealNodes = Array.from(document.querySelectorAll(".reveal"));

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
setupReveal();
setupCounters();
setupProcessTabs();

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
