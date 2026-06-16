/* 홈 화면 캐로셀: 포트폴리오 썸네일(main 이미지)을 슬라이드로 보여준다. */
async function initCarousel(rootSelector) {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const projects = await Projects.loadAll();
  if (projects.length === 0) {
    root.innerHTML = `<div class="carousel-empty">포트폴리오를 추가하면 이곳에 표시됩니다.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="carousel__track">
      ${projects
        .map(
          (p) => `
        <a class="carousel__slide" href="project?p=${p.folder}">
          ${Projects.thumbTag(p)}
          <div class="carousel__caption">
            <h3>${p.title}</h3>
            <p>${[p.location, p.year].filter(Boolean).join(" · ")}</p>
          </div>
        </a>`
        )
        .join("")}
    </div>
    <button class="carousel__btn carousel__btn--prev" aria-label="이전">‹</button>
    <button class="carousel__btn carousel__btn--next" aria-label="다음">›</button>
    <div class="carousel__dots">
      ${projects.map((_, i) => `<button class="dot ${i === 0 ? "is-active" : ""}" data-i="${i}"></button>`).join("")}
    </div>`;

  const track = root.querySelector(".carousel__track");
  const slides = root.querySelectorAll(".carousel__slide");
  const dots = root.querySelectorAll(".dot");
  let index = 0;
  let timer = null;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
  }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function start() { stop(); timer = setInterval(next, 4500); }
  function stop() { if (timer) clearInterval(timer); }

  root.querySelector(".carousel__btn--next").addEventListener("click", () => { next(); start(); });
  root.querySelector(".carousel__btn--prev").addEventListener("click", () => { prev(); start(); });
  dots.forEach((d) =>
    d.addEventListener("click", () => { go(Number(d.dataset.i)); start(); })
  );
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);

  // 모바일 스와이프
  let x0 = null;
  track.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    x0 = null;
    start();
  });

  go(0);
  start();
}
