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
    console.log("移动端访问：启用图片长按禁用");

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
        if (t && t.tagName && t.tagName.toLowerCase() === "img") e.preventDefault();
      },
      true
    );

    return; // 移动端到此结束
  }

  // =====================================================================
  // ✅ PC：防护（更稳版）
  // - 仍保留快捷键拦截
  // - DevTools 检测 =【基线增量】+【绝对差值/比例（用于开局已打开）】
  // - 检测带“启用延迟”和“resize 后延迟”，减少误判
  // =====================================================================

  // -------------------------------
  // 1. 禁用快捷键 (PC) —— 立刻触发
  // -------------------------------
  document.addEventListener("keydown", (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
      alert("检测到开发者工具快捷键，操作被阻止");
      window.location.href = jumpUrl;
    }
  });

  // -------------------------------
  // 2. DevTools 检测（基线 + 增量）——避免窗口化误判
  // -------------------------------
  let baseDiffH = null;
  let baseDiffW = null;

  function sampleBaseline() {
    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);
    baseDiffH = diffH;
    baseDiffW = diffW;
  }

  // 首次进入延迟采样（等 UI 稳定）
  setTimeout(sampleBaseline, 800);

  // resize 后也延迟重采样（用户窗口化/拖动不误判）
  let baselineTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(baselineTimer);
    baselineTimer = setTimeout(sampleBaseline, 800);
    // resize 后暂时不做判定
    devtoolsCheckEnabled = false;
    clearTimeout(enableTimer);
    enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 1200);
  });

  function isDevtoolsOpenByDelta() {
    if (baseDiffH === null || baseDiffW === null) return false;
    if (!window.outerHeight || !window.outerWidth) return false;

    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);

    const deltaH = diffH - baseDiffH;
    const deltaW = diffW - baseDiffW;

    // 只看“增量”，更稳
    return deltaH > 220 || deltaW > 220;
  }

  // -------------------------------
  // 3. 新增：开局已打开 DevTools 的补充检测（绝对差值 + 比例）
  //   - 不依赖基线（即使一开始就开着 DevTools 也能抓到）
  //   - 用“差值很大 + viewport比例很小”双条件降低误伤
  // -------------------------------
  function isDevtoolsOpenByAbs() {
    if (!window.outerHeight || !window.outerWidth) return false;

    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);

    const hRatio = window.innerHeight / window.outerHeight; // viewport 占比
    const wRatio = window.innerWidth / window.outerWidth;

    // 典型：dock 底部/右侧时 diff 大且占比明显下降
    const byH = diffH > 360 && hRatio < 0.78;
    const byW = diffW > 360 && wRatio < 0.78;

    return byH || byW;
  }

  // -------------------------------
  // 4. 统一的处罚逻辑（连续命中才触发）
  // -------------------------------
  function punish() {
    alert("检测到开发者工具已打开！");
    window.location.href = jumpUrl;
  }

  let devtoolsCheckEnabled = false;
  let enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 1200); // 页面稳定后再启用

  let hitDelta = 0;
  let hitAbs = 0;

  setInterval(() => {
    if (!devtoolsCheckEnabled) return;

    // 增量命中：2次（约1秒）触发
    if (isDevtoolsOpenByDelta()) hitDelta++;
    else hitDelta = 0;

    // 绝对命中（开局已开 DevTools）：3次（约1.5秒）触发，稍微保守
    if (isDevtoolsOpenByAbs()) hitAbs++;
    else hitAbs = 0;

    if (hitDelta >= 2 || hitAbs >= 3) punish();
  }, 500);

  // -------------------------------
  // 5. 反调试 (PC)（保留你的逻辑：可能有性能影响）
  // -------------------------------
  function antiDebug() {
    setInterval(() => {
      (function () {
        return false;
      })
        ["constructor"]("debugger")
        ["call"]();
    }, 50);
  }
  try {
    antiDebug();
  } catch (err) {}

  // -------------------------------
  // 6. 禁用右键（PC）
  // -------------------------------
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    alert("右键已被禁用");
  });

  // -------------------------------
  // 7. 禁止选中（PC）
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
