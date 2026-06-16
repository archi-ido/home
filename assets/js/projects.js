/* 포트폴리오 폴더(portfolio/001, 002 …)를 자동으로 찾아 읽는다.
   별도 목록 파일 없이, 폴더를 만들기만 하면 사이트에 자동 반영된다.
   이미지는 "있는지 미리 검사"하지 않고 곧바로 <img>로 그려서 브라우저가 병렬 로드하게 한다(빠름). */
const Projects = {
  _cache: null,
  // 지원 확장자(앞쪽이 우선). jpg가 대부분이라 첫 시도에서 바로 로드된다.
  _exts: ["jpg", "jpeg", "png", "webp"],

  _pad(n) {
    return String(n).padStart(3, "0");
  },

  // 전체 프로젝트 목록. 폴더를 10개씩 병렬로 탐색하고, 한 묶음이 전부 비면 종료.
  async loadAll() {
    if (this._cache) return this._cache;
    const CHUNK = 10;
    const found = [];
    for (let start = 1; start <= 300; start += CHUNK) {
      const idxs = Array.from({ length: CHUNK }, (_, k) => start + k);
      const results = await Promise.all(
        idxs.map(async (i) => {
          const folder = this._pad(i);
          const md = await MD.load(`portfolio/${folder}/info.md`);
          return md ? { folder, md } : null;
        })
      );
      const hits = results.filter(Boolean);
      found.push(...hits);
      if (hits.length === 0) break; // 묶음 전체가 비었으면 더 없다고 보고 종료
    }

    const list = found.map(({ folder, md }) => ({
      folder,
      title: md.meta.title || "(제목 없음)",
      location: md.meta.location || "",
      year: md.meta.year || "",
      category: md.meta.category || "",
      // 썸네일 = 첫 이미지(001). 실제 로딩은 <img>가 담당.
      thumbBase: `portfolio/${folder}/001`
    }));
    list.sort((a, b) => b.folder.localeCompare(a.folder)); // 최신(번호 큰) 순
    this._cache = list;
    return list;
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

  // 썸네일 <img> 태그 문자열 (확장자 폴백 포함). 캐로셀/목록 공용.
  thumbTag(p, extraClass) {
    return `<img class="${extraClass || ""}" src="${p.thumbBase}.${this._exts[0]}"
      data-base="${p.thumbBase}" data-ei="0" alt="${p.title}" loading="lazy"
      onerror="Projects.onThumbError(this)">`;
  },

  // 썸네일 로딩 실패 시 다음 확장자로 시도, 모두 실패하면 카드/슬라이드 숨김.
  onThumbError(img) {
    const next = Number(img.dataset.ei || 0) + 1;
    if (next < this._exts.length) {
      img.dataset.ei = String(next);
      img.src = `${img.dataset.base}.${this._exts[next]}`;
    } else {
      img.onerror = null;
      const box = img.closest(".carousel__slide, .card");
      if (box) box.style.display = "none";
    }
  },

  // 상세 이미지: 001부터 순차로 그린다. 첫 이미지가 로드되는 즉시 화면에 표시되고,
  // 없는 번호를 만나면 멈춘다. (모두 받을 때까지 기다리지 않음 → 체감 속도 빠름)
  renderDetail(folder, container, alt) {
    const exts = this._exts;
    const loadAt = (index) => {
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
          img.onerror = null; // 이 번호 이미지는 없음 → 종료
          img.remove();
        }
      };
      img.onload = () => {
        img.onerror = null;
        loadAt(index + 1); // 다음 번호로
      };
      container.appendChild(img);
      img.src = `${base}.${exts[0]}`;
    };
    loadAt(1);
  }
};
