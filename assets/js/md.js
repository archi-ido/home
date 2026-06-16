/* Markdown 파일을 다루는 헬퍼.
   - frontmatter(--- 로 감싼 상단 영역)를 key:value 객체로 파싱
   - 본문은 marked 라이브러리로 HTML 변환 (marked가 없으면 줄바꿈만 처리) */
const MD = {
  // 원본 텍스트 -> { meta: {...}, body: "본문" }
  parse(text) {
    text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
    const meta = {};
    let body = text;

    const fm = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fm) {
      fm[1].split("\n").forEach((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        val = val.replace(/^["']|["']$/g, ""); // 감싼 따옴표 제거
        if (key) meta[key] = val;
      });
      body = fm[2];
    }
    return { meta, body: body.trim() };
  },

  // 본문 마크다운 -> HTML
  render(body) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(body);
    }
    // marked 미로딩 시 최소한의 처리(문단/줄바꿈)
    return body
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  },

  // 파일 가져와서 parse까지 (없으면 null)
  async load(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return this.parse(await res.text());
    } catch (e) {
      return null;
    }
  }
};
