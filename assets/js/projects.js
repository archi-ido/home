/* 포트폴리오 폴더(portfolio/001, 002 …)를 자동으로 찾아 읽는다.
   별도 목록 파일 없이, 폴더를 만들기만 하면 사이트에 자동 반영된다.
   이미지는 "있는지 미리 검사"하지 않고 곧바로 <img>로 그려서 브라우저가 병렬 로드하게 한다(빠름). */
const Projects = {
  _cache: null,
  // 지원 확장자(앞쪽이 우선). 이미지는 webp로 관리하며, 나머지는 폴백용.
  _exts: ["webp", "jpg", "jpeg", "png"],

  _pad(n) {
    return String(n).padStart(3, "0");
  },

  // 전체 프로젝트 목록. portfolio/info.md 에 나열된 폴더명 = 노출 순서.
  // 목록에 없거나 오타/존재하지 않는 폴더명은 자동으로(에러 없이) 제외된다.
  async loadAll() {
    if (this._cache) return this._cache;

    const orderMd = await MD.load("portfolio/info.md");
    const names = this._parseOrder(orderMd ? orderMd.body : "");

    // 나열된 순서를 유지하며 각 폴더의 info.md 를 로드 (Promise.all은 순서 보존)
    const results = await Promise.all(
      names.map(async (folder) => {
        const md = await MD.load(`portfolio/${folder}/info.md`);
        return md ? { folder, md } : null; // 없는 폴더는 null → 아래에서 조용히 제외
      })
    );

    const list = results.filter(Boolean).map(({ folder, md }) => ({
      folder,
      title: md.meta.title || "(제목 없음)",
      location: md.meta.location || "",
      year: md.meta.year || "",
      category: md.meta.category || ""
      // 썸네일은 thumbTag()가 folder 기준으로 001부터 폴백해서 로드한다.
    }));
    this._cache = list;
    return list;
  },

  // portfolio/info.md 본문을 폴더명 목록으로 파싱한다.
  // 빈 줄 / '#' 주석 / '<!-- -->' 주석 / '- ' 목록기호는 무시하고, 앞뒤 공백을 제거한다.
  _parseOrder(body) {
    return (body || "")
      .replace(/<!--[\s\S]*?-->/g, "") // HTML 주석 블록 제거
      .split("\n")
      .map((line) => line.replace(/^\s*-\s*/, "").trim()) // 목록기호/공백 제거
      .filter((line) => line && !line.startsWith("#")); // 빈 줄·# 주석 제외
  },

  // 단일 프로젝트 메타/본문 로드 (상세 페이지용)
  async loadOne(folder) {
    const md = await MD.load(`portfolio/${folder}/info.md`);
    if (!md) return null;
    return {
      folder,
      title: md.meta.title || "(제목 없음)",
      location: md.meta.location || "",
      year: md.meta.year || "",
      category: md.meta.category || "",
      meta: md.meta,
      body: md.body
    };
  },

  // 대표 썸네일로 시도할 최대 번호. 001~008 중 처음 존재하는 이미지를 썸네일로 쓴다.
  _thumbMaxN: 8,

  // 썸네일 <img> 태그 문자열. 캐로셀/목록 공용.
  // 001 이 없으면 002, 003 … 순으로 폴백하고(번호+확장자), 하나도 없으면 카드를 숨긴다.
  thumbTag(p, extraClass) {
    const first = `portfolio/${p.folder}/${this._pad(1)}.${this._exts[0]}`;
    return `<img class="${extraClass || ""}" src="${first}"
      data-folder="${p.folder}" data-n="1" data-ei="0" alt="${p.title}" loading="lazy"
      onerror="Projects.onThumbError(this)">`;
  },

  // 썸네일 로딩 실패 시: 같은 번호의 다음 확장자 → 없으면 다음 번호(001→002…)로 시도.
  onThumbError(img) {
    let n = Number(img.dataset.n || 1);
    let ei = Number(img.dataset.ei || 0) + 1;
    if (ei >= this._exts.length) { ei = 0; n += 1; } // 확장자 모두 실패 → 다음 번호
    if (n > this._thumbMaxN) { // 대표 이미지를 못 찾음 → 카드/슬라이드 숨김
      img.onerror = null;
      const box = img.closest(".carousel__slide, .card");
      if (box) box.style.display = "none";
      return;
    }
    img.dataset.n = String(n);
    img.dataset.ei = String(ei);
    img.src = `portfolio/${img.dataset.folder}/${this._pad(n)}.${this._exts[ei]}`;
  },

  // 상세 이미지: 001부터 순차로 그린다. 첫 이미지가 로드되는 즉시 화면에 표시된다.
  // 없는 번호가 있어도 바로 멈추지 않고 다음 번호를 시도하며(001이 없어도 002부터 표시),
  // 연속으로 _detailMaxMiss 개를 못 찾으면 더 없다고 보고 종료한다.
  _detailMaxMiss: 2,

  renderDetail(folder, container, alt) {
    const exts = this._exts;
    const loadAt = (index, miss) => {
      if (miss > this._detailMaxMiss) return; // 연속으로 여러 번 비면 종료
      const base = `portfolio/${folder}/${this._pad(index)}`;
      const img = document.createElement("img");
      img.alt = alt || "";
      img.loading = "lazy";
      let ei = 0;
      img.onerror = () => {
        ei++;
        if (ei < exts.length) {
          img.src = `${base}.${exts[ei]}`; // 같은 번호, 다른 확장자 재시도
        } else {
          img.onerror = null; // 이 번호 이미지는 없음 → 다음 번호로(비었으므로 miss+1)
          img.remove();
          loadAt(index + 1, miss + 1);
        }
      };
      img.onload = () => {
        img.onerror = null;
        loadAt(index + 1, 0); // 성공 → 다음 번호(miss 리셋)
      };
      container.appendChild(img);
      img.src = `${base}.${exts[0]}`;
    };
    loadAt(1, 0);
  }
};
