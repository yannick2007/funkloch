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

  // Player: Folgen direkt auf der Seite abspielen
  const player = document.querySelector("[data-player]");
  if (player) {
    const audio = new Audio();
    audio.preload = "none";

    const $ = (sel) => player.querySelector(sel);
    const toggle = $("[data-player-toggle]");
    const seek = $("[data-seek]");
    const timeCurrent = $("[data-time-current]");
    const timeTotal = $("[data-time-total]");
    const playButtons = [...document.querySelectorAll("[data-play]")];
    let current = null; // Button der aktuellen Folge
    let seeking = false;

    const fmt = (s) => {
      if (!isFinite(s)) return "0:00";
      s = Math.floor(s);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = String(s % 60).padStart(2, "0");
      return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
    };

    const render = () => {
      const playing = !audio.paused;
      player.classList.toggle("is-playing", playing);
      toggle.setAttribute("aria-label", playing ? "Pausieren" : "Abspielen");
      playButtons.forEach((btn) => {
        const isCurrent = current && btn.dataset.src === current.dataset.src;
        btn.classList.toggle("is-playing", isCurrent && playing);
        btn.closest(".episode")?.classList.toggle("is-current", Boolean(isCurrent));
        const label = btn.querySelector("[data-label]");
        if (label) label.textContent = isCurrent && playing ? "Pausieren" : "Folge abspielen";
        if (!label) btn.setAttribute("aria-label", `${btn.dataset.num} ${isCurrent && playing ? "pausieren" : "abspielen"}`);
      });
    };

    const updateTime = () => {
      if (seeking) return;
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      seek.value = Math.round(pct * 10);
      seek.style.setProperty("--progress", `${pct}%`);
      timeCurrent.textContent = fmt(audio.currentTime);
      timeTotal.textContent = fmt(audio.duration);
    };

    const load = (btn) => {
      current = btn;
      audio.src = btn.dataset.src;
      $("[data-player-num]").textContent = btn.dataset.num;
      $("[data-player-title]").textContent = btn.dataset.title;
      seek.value = 0;
      seek.style.setProperty("--progress", "0%");
      timeCurrent.textContent = "0:00";
      timeTotal.textContent = "0:00";

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: btn.dataset.title,
          artist: "Funkloch Podcast",
          album: btn.dataset.num,
          artwork: [{ src: new URL("assets/img/cover-400.jpg", location.href).href, sizes: "400x400", type: "image/jpeg" }],
        });
      }
    };

    const play = () => {
      player.classList.add("is-open");
      document.body.classList.add("has-player");
      audio.play().catch(() => {});
    };

    playButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (current && btn.dataset.src === current.dataset.src) {
          audio.paused ? play() : audio.pause();
        } else {
          load(btn);
          play();
        }
      });
    });

    // Ganze Folgen-Karte ist klickbar
    document.querySelectorAll(".episode").forEach((card) => {
      const btn = card.querySelector("[data-play]");
      if (btn) card.addEventListener("click", () => btn.click());
    });

    toggle.addEventListener("click", () => (audio.paused ? play() : audio.pause()));

    player.querySelectorAll("[data-skip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + Number(btn.dataset.skip)));
      });
    });

    seek.addEventListener("input", () => {
      seeking = true;
      const pct = seek.value / 10;
      seek.style.setProperty("--progress", `${pct}%`);
      timeCurrent.textContent = fmt((pct / 100) * audio.duration);
    });
    seek.addEventListener("change", () => {
      if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
      seeking = false;
    });

    $("[data-player-close]").addEventListener("click", () => {
      audio.pause();
      player.classList.remove("is-open");
      document.body.classList.remove("has-player");
    });

    audio.addEventListener("play", render);
    audio.addEventListener("pause", render);
    audio.addEventListener("ended", render);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("waiting", () => player.classList.add("is-loading"));
    audio.addEventListener("playing", () => player.classList.remove("is-loading"));
    audio.addEventListener("error", () => {
      player.classList.remove("is-loading");
      $("[data-player-title]").textContent = "Kein Empfang – Folge konnte nicht geladen werden";
    });

    // Steuerung auf dem Sperrbildschirm / mit Medientasten
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => (audio.currentTime = Math.max(0, audio.currentTime - 15)));
      navigator.mediaSession.setActionHandler("seekforward", () => (audio.currentTime = audio.currentTime + 30));
    }
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
});
