/* =========================================================================
   TKselect main.js
   - 画像/動画枠の描画（site-config.js の media を参照）
   - 実測値・価格の差し込み（product を参照）
   - 購入ボタン（未接続時はデモダイアログ）
   - スマホ固定購入バー／ギャラリー／ヘッダー／スクロール表示
   ========================================================================= */
(function () {
  "use strict";

  var C = window.TK_CONFIG || {};
  var MEDIA = C.media || {};
  var P = C.product || {};
  var BUY = C.purchase || {};
  var PENDING = "実測中";

  // サイトのルート（main.js の位置から算出）。media の src は "assets/img/xxx.webp" のように
  // ルートからの相対パスで書けば、どの階層のページからでも正しく読み込まれる。
  var ROOT = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/assets\/js\/main\.js(\?.*)?$/, "") : "";
  })();
  function url(u) { return !u || /^(https?:)?\/\//.test(u) || u.charAt(0) === "/" ? u : ROOT + u; }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { return Number(n).toLocaleString("ja-JP"); }

  /* -------------------------------------------------------------------
     画像・動画枠
     <div class="media" data-media="IMG-01" [data-compact]></div>
     ------------------------------------------------------------------- */
  function renderMedia(el, id) {
    id = id || el.getAttribute("data-media");
    var m = MEDIA[id];
    if (!m) return;
    var compact = el.hasAttribute("data-compact");
    el.style.setProperty("--ratio", m.ratio || "4/3");
    if (m.ratioSp) el.style.setProperty("--ratio-sp", m.ratioSp);
    el.setAttribute("data-media", id);

    if (m.src) {
      el.classList.add("media--filled");
      el.classList.remove("media--placeholder");
      if (m.type === "video") {
        el.innerHTML =
          '<video src="' + esc(url(m.src)) + '"' + (m.poster ? ' poster="' + esc(url(m.poster)) + '"' : "") +
          ' controls playsinline muted preload="metadata" aria-label="' + esc(m.alt || m.title) + '"></video>';
      } else {
        var eager = m.priority ? ' fetchpriority="high"' : ' loading="lazy"';
        var img = '<img src="' + esc(url(m.src)) + '" alt="' + esc(m.alt || "") + '" decoding="async"' + eager + ">";
        el.innerHTML = m.srcSp
          ? '<picture><source media="(max-width: 767px)" srcset="' + esc(url(m.srcSp)) + '">' + img + "</picture>"
          : img;
      }
      return;
    }

    el.classList.add("media--placeholder");
    el.classList.remove("media--filled");
    var isVideo = m.type === "video";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "画像差し込み予定枠 " + id + "：" + m.title);
    el.innerHTML =
      '<div class="ph">' +
        '<span class="ph__id">' + (isVideo ? '<svg class="ph__play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' : "") + esc(id) + "</span>" +
        (compact ? "" :
          '<span class="ph__title">' + esc(m.title) + "</span>" +
          '<span class="ph__meta">推奨 ' + esc(m.size) + "　比率 " + esc((m.ratio || "").replace("/", ":")) + "</span>" +
          '<span class="ph__shot">' + esc(m.shot) + "</span>") +
      "</div>";
  }

  function initMedia() {
    $all("[data-media]").forEach(function (el) { renderMedia(el); });
    // 縦型動画（VID-02）が差し込まれていればスマホではそちらを表示
    $all("[data-demo-video]").forEach(function (el) {
      el.classList.toggle("has-sp", !!(MEDIA["VID-02"] && MEDIA["VID-02"].src));
    });
  }

  /* -------------------------------------------------------------------
     ギャラリー（サムネイルでメイン画像を切り替え）
     ------------------------------------------------------------------- */
  function initGallery() {
    $all("[data-gallery]").forEach(function (g) {
      var main = $("[data-gallery-main]", g);
      var thumbs = $all("[data-gallery-thumb]", g);
      thumbs.forEach(function (t) {
        t.addEventListener("click", function () {
          renderMedia(main, t.getAttribute("data-gallery-thumb"));
          thumbs.forEach(function (x) { x.setAttribute("aria-current", x === t ? "true" : "false"); });
        });
      });
    });
  }

  /* -------------------------------------------------------------------
     商品情報・実測値の差し込み
     ------------------------------------------------------------------- */
  function pendingBadge() { return '<span class="badge-pending">' + PENDING + "</span>"; }

  function initProductData() {
    $all("[data-price]").forEach(function (el) { el.textContent = yen(P.price); });
    $all("[data-product-name]").forEach(function (el) { el.textContent = P.name; });

    var byKey = {};
    (P.measured || []).forEach(function (r) { byKey[r.key] = r; });

    // 単独の値： <span data-spec="weight"></span>
    $all("[data-spec]").forEach(function (el) {
      var r = byKey[el.getAttribute("data-spec")];
      if (!r) return;
      el.innerHTML = r.value ? esc(r.value) : pendingBadge();
    });

    // 実測データ表
    $all("[data-spec-table='measured']").forEach(function (tbody) {
      tbody.innerHTML = (P.measured || []).map(function (r) {
        return "<tr><th scope='row'>" + esc(r.label) + "</th><td>" +
          (r.value ? esc(r.value) : pendingBadge()) +
          "</td><td class='spec__note'>" + esc(r.note || "") + "</td></tr>";
      }).join("");
    });

    // 基本仕様表
    $all("[data-spec-table='fixed']").forEach(function (tbody) {
      tbody.innerHTML = (P.fixed || []).map(function (r) {
        return "<tr><th scope='row'>" + esc(r.label) + "</th><td>" +
          (r.value ? esc(r.value) : '<span class="badge-pending">確認中</span>') + "</td></tr>";
      }).join("");
    });

    // 実測済み件数
    $all("[data-measured-count]").forEach(function (el) {
      var all = (P.measured || []).length;
      var done = (P.measured || []).filter(function (r) { return r.value; }).length;
      el.textContent = done + " / " + all;
    });
  }

  /* -------------------------------------------------------------------
     購入ボタン
     ------------------------------------------------------------------- */
  function initBuy() {
    var connected = !!BUY.url;
    var dialog = $("#demo-dialog");

    $all("[data-buy]").forEach(function (el) {
      var label = $(".btn__label", el) || el;
      if (connected) {
        el.setAttribute("href", BUY.url);
        label.textContent = BUY.label || "購入手続きへ進む";
      } else {
        el.classList.add("is-demo");
        el.setAttribute("href", "#demo-dialog");
        el.setAttribute("aria-haspopup", "dialog");
        label.textContent = BUY.demoLabel || "購入する（デモ）";
        el.addEventListener("click", function (e) {
          e.preventDefault();
          if (dialog && typeof dialog.showModal === "function") {
            dialog.showModal();
          } else {
            window.alert("デモ表示です。購入ボタンはまだどこにも接続されていません。");
          }
        });
      }
    });

    $all("[data-buy-note]").forEach(function (el) { el.hidden = connected; });

    if (dialog) {
      $all("[data-dialog-close]", dialog).forEach(function (b) {
        b.addEventListener("click", function () { dialog.close(); });
      });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
      var idEl = $("[data-base-item-id]", dialog);
      if (idEl) idEl.textContent = BUY.baseItemId || "";
    }
  }

  /* -------------------------------------------------------------------
     固定購入バー：最初の購入エリアが見えなくなったら表示し、
     最終購入導線が見えている間は隠す
     ------------------------------------------------------------------- */
  function initStickyBar() {
    var bar = $("[data-sticky-buy]");
    var first = $("#buy");
    var last = $("#final-cta");
    if (!bar || !first || !("IntersectionObserver" in window)) return;
    var firstVisible = true, firstAbove = false, lastVisible = false;
    var pc = window.matchMedia("(min-width: 960px)");
    function update() {
      // PC：購入ボタンを通り過ぎてから表示／SP：購入ボタンが画面に無ければ表示（参考サイトと同様）
      var show = !firstVisible && !lastVisible && (firstAbove || !pc.matches);
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
      $all("a,button", bar).forEach(function (a) { a.tabIndex = show ? 0 : -1; });
      document.body.classList.toggle("has-sticky-buy", show);
    }
    var target = $("[data-buy-anchor]", first) || first;
    new IntersectionObserver(function (es) {
      firstVisible = es[0].isIntersecting;
      firstAbove = !firstVisible && es[0].boundingClientRect.top < 0;
      update();
    }).observe(target);
    if (pc.addEventListener) pc.addEventListener("change", update);
    if (last) new IntersectionObserver(function (es) { lastVisible = es[0].isIntersecting; update(); }).observe(last);
    update();
  }

  /* -------------------------------------------------------------------
     ヘッダー（スクロール時の境界線・スマホメニュー）
     ------------------------------------------------------------------- */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        header.classList.toggle("is-open", !open);
      });
      $all("a", nav).forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          header.classList.remove("is-open");
        });
      });
    }
  }

  /* -------------------------------------------------------------------
     スクロールでふわっと表示（視差効果を減らす設定の場合は無効）
     ------------------------------------------------------------------- */
  function initReveal() {
    var items = $all(".reveal");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------------------
     素材リスト（media-guide.html）
     ------------------------------------------------------------------- */
  function initMediaGuide() {
    var tbody = $("[data-media-guide]");
    if (!tbody) return;
    tbody.innerHTML = Object.keys(MEDIA).map(function (id) {
      var m = MEDIA[id];
      return "<tr><th scope='row'><span class='ph__id ph__id--inline'>" + esc(id) + "</span>" +
        (m.optional ? "<br><small>任意</small>" : "") + "</th>" +
        "<td><strong>" + esc(m.title) + "</strong><br><small>" + esc(m.page) + "</small></td>" +
        "<td>" + esc(m.size) + "<br><small>比率 " + esc((m.ratio || "").replace("/", ":")) +
        (m.ratioSp ? "（SP " + esc(m.ratioSp.replace("/", ":")) + "）" : "") + "</small></td>" +
        "<td>" + esc(m.shot) + "</td>" +
        "<td>" + (m.src ? "<span class='badge-done'>差し込み済</span>" : "<span class='badge-pending'>未</span>") + "</td></tr>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMedia();
    initGallery();
    initProductData();
    initBuy();
    initStickyBar();
    initHeader();
    initReveal();
    initMediaGuide();
    $all("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });
})();
