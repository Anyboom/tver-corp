/* ============================================================
   Т-информ — интерактивный слой
   Зависимости: gsap 3.12, ScrollTrigger, lenis 1.1 (CDN)
   ============================================================ */

(() => {
  "use strict";

  const docEl = document.documentElement;
  docEl.classList.remove("no-js");

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
    if (typeof Lenis === "undefined") return null;

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
    if (typeof gsap === "undefined") return;

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
    gsap.from(".hero__bottom", { opacity: 0, y: 26, duration: 0.9, ease: "power3.out", delay: 0.7 });
  };

  /* ---------------------------------------------------------
     Reveal — появление секций при скролле
  --------------------------------------------------------- */
  const initReveal = () => {
    if (typeof ScrollTrigger === "undefined") return;

    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  };

  /* ---------------------------------------------------------
     Counters — счётчики в блоке «О компании»
  --------------------------------------------------------- */
  const initCounters = () => {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const end = parseInt(el.dataset.count, 10);

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
     Hero — переливание баннера в следующий блок
     (видео тонет и притемняется при скролле)
     --------------------------------------------------------- */
  const initHeroBlend = () => {
    if (typeof ScrollTrigger === "undefined") return;

    const hero = document.getElementById("hero");
    if (!hero) return;

    gsap.to(".hero__media", {
      yPercent: 16,
      scale: 1.08,
      opacity: 0.25,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  };

  /* ---------------------------------------------------------
     Marquee — бесшовный цикл: дублируем набор тегов
     (translateX(-50%) = ровно одна копия + gap)
     --------------------------------------------------------- */
  const initMarquee = () => {
    document.querySelectorAll(".marquee__items").forEach((row) => {
      const clone = Array.from(row.children).map((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        return copy;
      });
      clone.forEach((copy) => row.appendChild(copy));
    });
  };

  /* ---------------------------------------------------------
     Magnetic buttons (только fine pointer)
     --------------------------------------------------------- */
  const initMagneticButtons = () => {
    if (!finePointer) return;

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
    if (typeof ScrollTrigger === "undefined") return;

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
    initHeroBlend();
    initMarquee();
    initMagneticButtons();
    initGalleryParallax();
  };

  init();
})();
