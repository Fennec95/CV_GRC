(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Coordonnées (assemblées ici pour limiter les robots) ---------- */
  const MAIL = ["montenoisec", "gmail.com"].join("@");
  const TEL = "+33647060898";
  const TEL_TXT = "06 47 06 08 98";

  $$("[data-mail]").forEach(a => (a.href = "mailto:" + MAIL));
  $$("[data-tel]").forEach(a => (a.href = "tel:" + TEL));
  $$("[data-mail-text]").forEach(e => (e.textContent = MAIL));
  $$("[data-tel-text]").forEach(e => (e.textContent = TEL_TXT));

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function notify(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      notify(msg);
    } catch {
      notify(text);
    }
  }

  $$("[data-copy]").forEach(b =>
    b.addEventListener("click", () =>
      b.dataset.copy === "mail" ? copy(MAIL, "Email copié") : copy(TEL_TXT, "Numéro copié")
    )
  );

  /* ---------- Top bar ---------- */
  const topbar = $("#topbar");
  const onScroll = () => topbar.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Qualités : soulignement tour à tour ---------- */
  const traits = $$(".traits span");
  if (traits.length) {
    if (reduced) {
      traits.forEach(t => t.classList.add("is-on"));
    } else {
      let i = 0;
      const step = () => {
        traits.forEach((t, k) => t.classList.toggle("is-on", k === i));
        i = (i + 1) % traits.length;
      };
      setTimeout(() => { step(); setInterval(step, 2200); }, 900);
    }
  }

  /* ---------- Compteurs ---------- */
  function countUp(el) {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduced) return;
    const t0 = performance.now();
    const dur = 1100;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Apparitions au scroll ---------- */
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("is-in");
        const n = el.querySelector("[data-count]");
        if (n) countUp(n);
        const flow = el.querySelector(".flow");
        if (flow) setTimeout(() => flow.classList.add("is-in"), 250);
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------- Accordéons : un seul élément ouvert par groupe ---------- */
  $$("[data-accordion]").forEach(group => {
    const items = $$(":scope > details", group);
    items.forEach(d =>
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        items.forEach(o => { if (o !== d && o.open) o.open = false; });
      })
    );
  });

  /* ---------- Dock mobile ---------- */
  const dock = $("#dock");
  const heroCta = $("#hero-cta");
  const contact = $("#contact");
  const vis = { hero: true, contact: false };
  const dockIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.target === heroCta) vis.hero = e.isIntersecting;
      if (e.target === contact) vis.contact = e.isIntersecting;
    });
    dock.classList.toggle("is-on", !vis.hero && !vis.contact);
  });
  dockIo.observe(heroCta);
  dockIo.observe(contact);

  /* ---------- QR code (mode salon) ---------- */
  const dialog = $("#qr");
  const qrBox = $("#qr-code");
  const pageUrl = location.protocol.startsWith("http")
    ? location.origin + location.pathname.replace(/index\.html$/, "")
    : "https://fennec95.github.io/CV_GRC/";
  $("#qr-url").textContent = pageUrl.replace(/^https?:\/\//, "");

  let qrLib;
  function loadQrLib() {
    if (window.qrcode) return Promise.resolve();
    if (qrLib) return qrLib;
    qrLib = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
      s.onload = res;
      s.onerror = () => { qrLib = null; rej(); };
      document.head.appendChild(s);
    });
    return qrLib;
  }

  async function openQr() {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    if (qrBox.dataset.ready) return;
    qrBox.innerHTML = "<p>Génération…</p>";
    try {
      await loadQrLib();
      const qr = window.qrcode(0, "M");
      qr.addData(pageUrl);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
      qrBox.dataset.ready = "1";
    } catch {
      qrBox.innerHTML = "<p>Hors ligne.<br>Utilisez « Partager » ou ma carte NFC.</p>";
    }
  }

  function closeQr() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  $$("[data-open-qr]").forEach(b => b.addEventListener("click", openQr));
  $$("[data-close-qr]").forEach(b => b.addEventListener("click", closeQr));
  dialog.addEventListener("click", e => { if (e.target === dialog) closeQr(); });

  // Précharge la lib quand le navigateur est au repos, pour un QR instantané sur le salon
  (window.requestIdleCallback || (cb => setTimeout(cb, 2500)))(() => loadQrLib().catch(() => {}));

  /* ---------- Partage ---------- */
  const share = $("#share");
  share.addEventListener("click", async () => {
    const data = {
      title: "Charles Montenoise — Cybersécurité GRC",
      text: "Charles Montenoise · Cybersécurité GRC · EPITA · Manei Lift",
      url: pageUrl
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* annulé */ }
    } else {
      copy(pageUrl, "Lien copié");
    }
  });
})();
