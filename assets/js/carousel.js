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

  // 마우스 드래그 + 터치 스와이프 (Pointer Events로 통합)
  // 드래그하는 동안 슬라이드가 손가락/커서를 실시간으로 따라오고,
  // 놓을 때 이동 거리가 임계값을 넘으면 다음/이전으로 넘어간다.
  const THRESHOLD = 40; // px. 이보다 적게 움직이면 제자리로 복귀
  let dragging = false, startX = 0, dx = 0, width = 1;

  // 링크/이미지의 네이티브 드래그가 시작되면 Pointer 시퀀스가 끊기므로 막는다.
  track.addEventListener("dragstart", (e) => e.preventDefault());

  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    dx = 0;
    width = root.clientWidth || 1;
    track.style.transition = "none"; // 드래그 중엔 실시간으로 따라오게
    stop();
    root.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    const pct = (dx / width) * 100;
    track.style.transform = `translateX(calc(-${index * 100}% + ${pct}%))`;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.style.transition = ""; // CSS의 부드러운 애니메이션 복원
    root.classList.remove("is-dragging");
    if (Math.abs(dx) > THRESHOLD) (dx < 0 ? next : prev)();
    else go(index); // 임계값 미만 → 원래 위치로
    start();
  }
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // 드래그였다면(살짝의 움직임이 아니라면) 슬라이드 링크 클릭을 막는다.
  track.addEventListener("click", (e) => {
    if (Math.abs(dx) > 5) e.preventDefault();
  });

  go(0);
  start();
}
