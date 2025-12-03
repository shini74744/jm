(() => {
  // ---------------------------
  // 域名判断（仅允许 shli.io）
  // ---------------------------
  if (window.location.hostname !== "shli.io") {
    console.warn("脚本未授权的域名，停止执行");
    return;
  }

  const jumpUrl = "https://www.bing.com"; // PC 检测到后跳转

  // -------------------------------
  // 0. 判断是否是移动端（增强：iPadOS 桌面模式也算移动端）
  // -------------------------------
  const ua = navigator.userAgent || "";
  const isIPadOS = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  const isMobile =
    /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(ua) || isIPadOS;

  // =====================================================================
  // ✅ 移动端：仅禁用“图片长按保存”
  // =====================================================================
  if (isMobile) {
    const style = document.createElement("style");
    style.innerHTML = `
      img {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener(
      "contextmenu",
      (e) => {
        const t = e.target;
        if (t && t.tagName && t.tagName.toLowerCase() === "img") {
          e.preventDefault();
        }
      },
      true
    );

    return; // ✅ 移动端到此结束，PC 端不执行
  }

  // =====================================================================
  // ✅ PC：防护（自适应一次学习 + 1秒2次反调试）
  // - DevTools 视觉检测使用“基线自适应”，减少窗口化/套壳误判
  // - 支持通过 ?reset_baseline=1 重置学习
  // =====================================================================

  // -------------------------------
  // 1. 禁用快捷键 (PC)
  // -------------------------------
  const punishOnce = (() => {
    let punished = false;
    return (msg) => {
      if (punished) return;
      punished = true;
      alert(msg);
      window.location.href = jumpUrl;
    };
  })();

  document.addEventListener("keydown", (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
      punishOnce("检测到开发者工具快捷键，操作被阻止");
    }
  });

  // -------------------------------
  // 2. DevTools 检测：自适应一次学习（baseline）
  // -------------------------------
  const BASELINE_KEY = "__shli_devtools_baseline_v2__";

  // 允许通过 URL 重置：?reset_baseline=1
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("reset_baseline") === "1") {
      localStorage.removeItem(BASELINE_KEY);
    }
  } catch (_) {}

  function getDiff() {
    return {
      h: Math.abs(window.innerHeight - window.outerHeight),
      w: Math.abs(window.innerWidth - window.outerWidth),
      hRatio: window.innerHeight / window.outerHeight,
      wRatio: window.innerWidth / window.outerWidth,
    };
  }

  function median(arr) {
    if (!arr.length) return 0;
    const a = arr.slice().sort((x, y) => x - y);
    return a[Math.floor(a.length / 2)];
  }

  function loadBaseline() {
    try {
      const raw = localStorage.getItem(BASELINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveBaseline(obj) {
    try {
      localStorage.setItem(BASELINE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  let baseline = loadBaseline();

  // 学习过程：采样多次取中位数，顺便估计抖动 jitter
  async function learnBaselineOnce() {
    // 已有 baseline 就不重复学（除非重置）
    if (baseline) return;

    // 页面稳定后再采样（UI、字体、布局，避免初始抖动）
    await new Promise((r) => setTimeout(r, 1500)); // 延迟更多时间确保页面稳定

    const samples = [];
    for (let i = 0; i < 7; i++) {
      samples.push(getDiff());
      await new Promise((r) => setTimeout(r, 250)); // 每次采样间隔更长，减少过早学习
    }

    const hs = samples.map((s) => s.h);
    const ws = samples.map((s) => s.w);

    const baseH = median(hs);
    const baseW = median(ws);

    // jitter：用“最大偏离中位数”的程度估计正常抖动范围
    const jitterH = Math.max(...hs.map((v) => Math.abs(v - baseH)));
    const jitterW = Math.max(...ws.map((v) => Math.abs(v - baseW)));

    baseline = {
      baseH,
      baseW,
      jitterH,
      jitterW,
      ts: Date.now(),
    };
    saveBaseline(baseline);
  }

  // 触发学习（不阻塞主线程）
  learnBaselineOnce();

  // resize 后不重学，只延迟检测启用，避免窗口化瞬间误判
  let devtoolsCheckEnabled = false;
  let enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 2500); // 增加更多的延迟

  window.addEventListener("resize", () => {
    devtoolsCheckEnabled = false;
    clearTimeout(enableTimer);
    enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 2500); // 增加检测延迟

    // 如果用户主动大幅调整窗口，我们不自动重学（避免“学坏”）
    // 需要重学可用 ?reset_baseline=1
  });

  // 判定：相对 baseline 的增量（动态阈值 = 固定阈值 + jitter 余量）
  function isDevtoolsOpenAdaptive() {
    if (!baseline) return false;

    const d = getDiff();

    // 动态增量阈值：在各种环境下更稳
    const deltaH = d.h - baseline.baseH;
    const deltaW = d.w - baseline.baseW;

    const thH = 300 + Math.min(baseline.jitterH || 0, 150); // 增加阈值，防止误判
    const thW = 300 + Math.min(baseline.jitterW || 0, 150); // 增加阈值，防止误判

    return deltaH > thH || deltaW > thW;
  }

  // 补充：开局已打开 DevTools 的“绝对差值 + 比例”保守检测（不依赖 baseline）
  function isDevtoolsOpenAbs() {
    const d = getDiff();
    const byH = d.h > 500 && d.hRatio < 0.8; // 增加最小差值
    const byW = d.w > 500 && d.wRatio < 0.8; // 增加最小差值
    return byH || byW;
  }

  let hitAdaptive = 0;
  let hitAbs = 0;

  setInterval(() => {
    if (!devtoolsCheckEnabled) return;

    if (isDevtoolsOpenAdaptive()) hitAdaptive++;
    else hitAdaptive = 0;

    if (isDevtoolsOpenAbs()) hitAbs++;
    else hitAbs = 0;

    if (hitAdaptive >= 2 || hitAbs >= 3) {
      punishOnce("检测到开发者工具已打开！");
    }
  }, 500);

  // -------------------------------
  // 3. 反调试 (PC)：1秒2次（500ms 一次）
  // -------------------------------
  function antiDebug() {
    const dbg = Function("debugger");
    setInterval(() => {
      dbg();
    }, 500);
  }
  try {
    antiDebug();
  } catch (_) {}

  // -------------------------------
  // 4. 禁用右键（PC）
  // -------------------------------
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    alert("右键已被禁用");
  });

  // -------------------------------
  // 5. 禁止选中（PC）
  // -------------------------------
  document.addEventListener("selectstart", (e) => e.preventDefault());
  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) e.preventDefault();
  });

  const stylePC = document.createElement("style");
  stylePC.innerHTML = `
    body {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
  `;
  document.head.appendChild(stylePC);
})();
