/* ============================================================
   Т-информ — интерактивный слой
   Зависимости: gsap 3.12, ScrollTrigger, lenis 1.1 (CDN)
   ============================================================ */

(() => {
  "use strict";

  const docEl = document.documentElement;
  docEl.classList.remove("no-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduceMotion) docEl.classList.add("no-motion");

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------
     Preloader — счётчик прогресса + split-door reveal
  --------------------------------------------------------- */
  const initPreloader = () => {
    const preloader = document.getElementById("preloader");
    const counter = document.getElementById("preloaderCounter");
    const logo = preloader.querySelector(".preloader__logo");

    document.body.classList.add("is-locked");

    const finish = () => {
      preloader.classList.add("is-done");
      document.body.classList.remove("is-locked");
      window.setTimeout(() => preloader.remove(), 1000);
      startHeroIntro();
    };

    if (reduceMotion) {
      window.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 600); // страховка
      return;
    }

    // Счётчик тикает от 0 до 100; завершение не раньше реальной загрузки страницы
    let progress = 0;
    let pageReady = false;
    window.addEventListener("load", () => { pageReady = true; }, { once: true });

    const tick = () => {
      const target = pageReady ? 100 : 82;
      progress = lerp(progress, target, 0.08);
      const value = clamp(Math.round(progress), 0, 100);
      counter.textContent = value;
      logo.style.setProperty("--load", (value / 100).toFixed(2));

      if (value < 100) {
        window.requestAnimationFrame(tick);
      } else {
        gsap.to(preloader.querySelector(".preloader__inner"), { y: -10, opacity: 0, duration: 0.3, onComplete: finish });
      }
    };

    tick();
  };

  /* ---------------------------------------------------------
     Lenis — инерционный скролл + синхронизация со ScrollTrigger
  --------------------------------------------------------- */
  const initSmoothScroll = () => {
    if (reduceMotion || typeof Lenis === "undefined") return null;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());

    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };
    window.requestAnimationFrame(raf);

    // Плавный переход по якорям
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -60 });
        closeMobileMenu();
      });
    });

    return lenis;
  };

  /* ---------------------------------------------------------
     Nav — всегда видима; при скролле «отсоединяется» в облачко
  --------------------------------------------------------- */
  const initNav = () => {
    const nav = document.getElementById("nav");

    window.addEventListener("scroll", () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    }, { passive: true });

    // Burger
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("mobileMenu");
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("is-locked", open);
    });
  };

  const closeMobileMenu = () => {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("mobileMenu");
    menu.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  };

  /* ---------------------------------------------------------
     Hero — каскадное появление заголовка
  --------------------------------------------------------- */
  const splitWords = (element) => {
    const words = element.textContent.trim().split(/\s+/);
    element.textContent = "";
    words.forEach((word) => {
      const outer = document.createElement("span");
      outer.className = "word";
      const inner = document.createElement("span");
      inner.textContent = word;
      outer.appendChild(inner);
      element.appendChild(outer);
      element.appendChild(document.createTextNode(" "));
    });
    return element.querySelectorAll(".word > span");
  };

  const startHeroIntro = () => {
    if (reduceMotion || typeof gsap === "undefined") return;

    const lines = document.querySelectorAll("#heroTitle .hero__line");
    const stagger = 0.055;

    lines.forEach((line) => {
      const targets = splitWords(line);
      gsap.to(targets, {
        y: 0,
        duration: 1,
        ease: "power4.out",
        stagger,
        delay: 0.15,
      });
    });

    gsap.from(".hero__media", { opacity: 0, scale: 1.06, duration: 1.6, ease: "power2.out" });
    gsap.from(".hero__bottom", { opacity: 0, y: 26, duration: 0.9, ease: "power3.out", delay: 0.7, clearProps: "all" });
  };

  /* ---------------------------------------------------------
     Reveal — появление секций при скролле
  --------------------------------------------------------- */
  const initReveal = () => {
    if (reduceMotion || typeof ScrollTrigger === "undefined") return;

    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        clearProps: "transform",
      });
    });
  };

  /* ---------------------------------------------------------
     Counters — счётчики в блоке «О компании»
  --------------------------------------------------------- */
  const initCounters = () => {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const end = parseInt(el.dataset.count, 10);

      if (reduceMotion) { el.textContent = String(end); return; }

      const proxy = { value: 0 };
      gsap.to(proxy, {
        value: end,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onUpdate: () => { el.textContent = String(Math.round(proxy.value)); },
      });
    });
  };

  /* ---------------------------------------------------------
     Horizontal scroll — горизонтальная лента проектов
  --------------------------------------------------------- */
  const initHorizontalScroll = () => {
    if (reduceMotion || typeof ScrollTrigger === "undefined") return;

    const section = document.getElementById("projects");
    const track = document.getElementById("hscrollTrack");
    if (!section || !track) return;

    const getDistance = () => track.scrollWidth - window.innerWidth;
    const isDesktop = () => window.innerWidth > 820;

    const build = () => {
      if (!isDesktop()) {
        track.style.transform = "";
        return false; // на мобильных — обычная вертикальная раскладка
      }

      const distance = getDistance();
      if (distance <= 0) return false;

      gsap.to(track, {
        x: () => -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      return true;
    };

    ScrollTrigger.addEventListener("refreshInit", () => {
      gsap.set(track, { x: 0 });
    });

    ScrollTrigger.refresh();
    window.addEventListener("load", () => ScrollTrigger.refresh());

    build();
    // пересборка при смене ориентации/размера
    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
    });
  };

  /* ---------------------------------------------------------
     Custom cursor + magnetic buttons (только fine pointer)
  --------------------------------------------------------- */
  const initCursor = () => {
    if (!finePointer || reduceMotion) return;

    const cursor = document.getElementById("cursor");
    const dot = cursor.querySelector(".cursor__dot");
    const label = document.getElementById("cursorLabel");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };

    window.addEventListener("pointermove", (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
    }, { passive: true });

    const render = () => {
      pos.x = lerp(pos.x, target.x, 0.2);
      pos.y = lerp(pos.y, target.y, 0.2);
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      window.requestAnimationFrame(render);
    };
    render();

    document.addEventListener("pointerover", (event) => {
      const interactive = event.target.closest("a, button");
      const labelled = event.target.closest("[data-cursor]");

      cursor.classList.toggle("is-link", Boolean(interactive));
      cursor.classList.toggle("is-label", Boolean(labelled));
      label.textContent = labelled ? labelled.dataset.cursor : "";
    });

    docEl.classList.add("has-cursor");

    // Магнитные кнопки
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (event) => {
        const rect = btn.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate3d(${dx * 0.28}px, ${dy * 0.28}px, 0)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  };

  /* ---------------------------------------------------------
     Gallery — лёгкий параллакс карточек
  --------------------------------------------------------- */
  const initGalleryParallax = () => {
    if (reduceMotion || typeof ScrollTrigger === "undefined") return;

    gsap.utils.toArray(".masonry__item").forEach((item, index) => {
      const speed = index % 3 === 0 ? 1.06 : index % 3 === 1 ? 1 : 1.03;
      gsap.fromTo(item,
        { yPercent: (speed - 1) * 60 * -1 },
        {
          yPercent: (speed - 1) * 60,
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
  };

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  const init = () => {
    initPreloader();
    initNav();
    initSmoothScroll();
    initReveal();
    initCounters();
    initHorizontalScroll();
    initCursor();
    initGalleryParallax();
  };

  init();
})();
