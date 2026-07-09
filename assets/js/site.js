/* 사이트 설정(content/site.md)을 읽어 공통 헤더/푸터를 생성한다.
   비개발자는 content/site.md 만 수정하면 된다. (JS 수정 불필요) */
const Site = {
  config: null,
  _promise: null,

  load() {
    if (this._promise) return this._promise;
    this._promise = MD.load("content/site.md").then((md) => {
      const m = (md && md.meta) || {};
      this.config = {
        name: m.name || "STUDIO",
        tagline: m.tagline || "",
        kakaoApiKey: m.kakaoApiKey || "",
        copyright: m.copyright || "",
        location: {
          lat: parseFloat(m.lat) || 37.5665,
          lng: parseFloat(m.lng) || 126.978,
          address: m.address || "",
          phone: m.phone || "",
          email: m.email || "",
          hours: m.hours || ""
        }
      };
      return this.config;
    });
    return this._promise;
  },

  /* 페이지 상단(eyebrow + 타이틀)을 md frontmatter로 채운다.
     meta에 값이 없으면 해당 요소를 숨기고, 둘 다 없으면 영역 전체를 숨긴다.
     필요한 요소 id: #page-head, #page-eyebrow, #page-title */
  renderPageHead(meta) {
    meta = meta || {};
    const head = document.getElementById("page-head");
    const eyebrow = document.getElementById("page-eyebrow");
    const title = document.getElementById("page-title");
    if (eyebrow) {
      if (meta.eyebrow) { eyebrow.textContent = meta.eyebrow; eyebrow.hidden = false; }
      else eyebrow.hidden = true;
    }
    if (title) {
      if (meta.title) { title.textContent = meta.title; title.hidden = false; }
      else title.hidden = true;
    }
    if (head) head.hidden = !(meta.eyebrow || meta.title);
  }
};

(function () {
  const menu = [
    { label: "홈", href: "index" },
    { label: "소개", href: "about" },
    { label: "포트폴리오", href: "portfolio" },
    { label: "오시는 길", href: "location" }
  ];

  const here = (location.pathname.split("/").pop() || "index")
    .replace(/\.html$/, "")
    .toLowerCase() || "index";
  const isActive = (href) =>
    href.toLowerCase() === here ||
    (here === "project" && href === "portfolio");

  function buildHeader(cfg) {
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="site-header__inner">
        <a class="brand" href="index">
          <img class="brand__logo" src="content/logo.jpg" alt="${cfg.name} 로고">
          <span class="brand__name">${cfg.name}</span>
        </a>
        <button class="nav-toggle" aria-label="메뉴 열기" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="nav">
          ${menu
            .map(
              (m) =>
                `<a href="${m.href}" class="${isActive(m.href) ? "is-active" : ""}">${m.label}</a>`
            )
            .join("")}
        </nav>
      </div>`;

    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".nav");
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") header.classList.remove("nav-open");
    });
    return header;
  }

  function buildFooter(cfg) {
    const loc = cfg.location || {};
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="site-footer__inner">
        <div class="footer-brand">${cfg.name}</div>
        <div class="footer-info">
          ${loc.address ? `<span>${loc.address}</span>` : ""}
          ${loc.phone ? `<span>${loc.phone}</span>` : ""}
          ${loc.email ? `<span>${loc.email}</span>` : ""}
        </div>
        <div class="footer-copy">${cfg.copyright || ""}</div>
      </div>`;
    return footer;
  }

  // 페이지를 부드럽게 등장시킨다(조립이 끝난 뒤 한 번에 페이드인).
  const reveal = () => {
    // 헤더 주입 직후 다음 프레임에 표시 → 레이아웃이 안정된 상태에서 페이드인
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  };
  // 안전장치: 무슨 일이 있어도 화면이 빈 채로 남지 않도록 보장
  window.addEventListener("load", reveal);
  setTimeout(reveal, 1500);

  document.addEventListener("DOMContentLoaded", async () => {
    const cfg = await Site.load();
    const top = document.querySelector("[data-site-header]");
    if (top) top.replaceWith(buildHeader(cfg));
    const bot = document.querySelector("[data-site-footer]");
    if (bot) bot.replaceWith(buildFooter(cfg));
    if (cfg.name && !document.title.startsWith("[")) {
      document.title = `[${cfg.name}] ${document.title}`;
    }
    reveal();
  });
})();
