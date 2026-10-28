// Funkloch – kleine Helfer: Menü, Header-Zustand, Scroll-Reveal, Jahr
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("nav");

  // Mobile-Menü
  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
  matchMedia("(min-width: 821px)").addEventListener("change", (e) => e.matches && setOpen(false));

  // Header bekommt Hintergrund, sobald man scrollt
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.35);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Aktiven Menüpunkt markieren
  const links = [...document.querySelectorAll(".nav-list a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  sections.push(document.getElementById("top")); // im Hero ist nichts aktiv

  // Elemente beim Reinscrollen einblenden
  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          reveal.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  // Altes Leuchtschild: Logo flackert unregelmässig wie ein Wackelkontakt
  const logo = document.querySelector(".hero-logo img");
  if (logo && logo.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const rand = (min, max) => min + Math.random() * (max - min);

    const flicker = () => {
      const frames = [{ opacity: 1, easing: "steps(1, end)" }];
      if (Math.random() < 0.15) {
        // kurzer Aussetzer
        frames.push({ opacity: rand(0.08, 0.25), easing: "steps(1, end)" }, { opacity: 0.6, easing: "steps(1, end)" });
      }
      const blinks = Math.floor(rand(1, 5));
      for (let i = 0; i < blinks; i++) {
        frames.push({ opacity: rand(0.2, 0.75), easing: "steps(1, end)" }, { opacity: 1, easing: "steps(1, end)" });
      }
      frames.push({ opacity: 1 });
      logo.animate(frames, { duration: frames.length * rand(45, 110) });
      setTimeout(flicker, rand(700, 4000));
    };

    setTimeout(flicker, 900);
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
});
