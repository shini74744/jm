// =======================================================
// 全 JS 版本：视频/图片背景 + 凌晨模式提示 + 地域判断 + 交互逻辑 + Favicon 同步
// 逻辑/资源 与原始代码保持一致（无需写 HTML/CSS）
// 仅在 shli.io（含子域）生效，非该域名跳转到百度
// =======================================================
(function () {
  // —— 域名白名单（仅 shli.io 及其子域名生效）——
  try {
    var host = (location && location.hostname) ? location.hostname.toLowerCase() : '';
    var allowed = host === 'shli.io' || host.endsWith('.shli.io');
    if (!allowed) {
      location.replace('https://www.baidu.com/');
      return;
    }
  } catch (e) {
    location.replace('https://www.baidu.com/');
    return;
  }

  // 等待 DOM 可用（保证 <head> 与 <body> 存在）
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(async function init() {
    // ---------------------------------------------------
    // 1) <meta name="referrer" content="no-referrer"> 动态注入
    //    说明：动态注入可能无法影响更早发起的请求，但可保证与原设置一致。
    // ---------------------------------------------------
    (function ensureNoReferrerMeta() {
      const existing = document.querySelector('meta[name="referrer"]');
      if (!existing) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'referrer');
        meta.setAttribute('content', 'no-referrer');
        // 尽量插在<head>最前面
        const head = document.head || document.getElementsByTagName('head')[0];
        head.insertBefore(meta, head.firstChild || null);
      } else {
        existing.setAttribute('content', 'no-referrer');
      }
    })();

    // ---------------------------------------------------
    // 2) 动态注入 CSS（与原样式一致）
    // ---------------------------------------------------
    (function injectStyle() {
      const style = document.createElement('style');
      style.setAttribute('data-from', 'dynamic-video-bg-style');
      style.textContent = `
/* 全局CSS变量，用于控制夜间主题样式 */
:root {
  --custom-border-color: rgba(13, 11, 9, 0.1);
  --custom-background-color: rgba(13, 11, 9, 0.4);
  --custom-background-image: unset;
}

/* 夜间模式下取消 root 背景色 */
.dark #root {
  background-color: unset !important;
}

/* 夜间模式下卡片样式，带有毛玻璃效果和边框 */
.dark .bg-card {
  background-color: var(--custom-background-color);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(13, 11, 9, 0.1);
  box-shadow: 0 4px 6px rgba(13, 11, 9, 0.2);
}

/* 夜间模式下 body 样式 */
html.dark body {
  color: #f4f5f6;
  background: unset;
  position: relative;
}

/* 视频背景容器固定全屏 */
.video-box {
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

/* 视频尺寸适应容器，保持裁剪 */
.video-box video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 视频背景容器样式，备用于静态图像背景 */
.image-box {
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-size: cover;
  background-position: center;
}

/* 凌晨提示样式，默认隐藏 */
#nightModeTip {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 1s ease-in-out;
}

/* 显示提示框时的样式 */
#nightModeTip.show {
  opacity: 1;
  pointer-events: auto;
}
      `;
      (document.head || document.documentElement).appendChild(style);
    })();

    // ---------------------------------------------------
    // 3) 动态创建所需的 DOM（视频容器/视频/源码、提示框）
    // ---------------------------------------------------
    const videoBox = document.createElement('div');
    videoBox.className = 'video-box';
    const videoEl = document.createElement('video');
    videoEl.id = 'myVideo';
    videoEl.muted = true;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.loop = true;
    videoEl.preload = 'auto';

    const sourceEl = document.createElement('source');
    sourceEl.id = 'videoSource';
    sourceEl.type = 'video/mp4';

    videoEl.appendChild(sourceEl);
    // “您的浏览器不支持 HTML5 视频。” 的文本提示
    videoEl.appendChild(document.createTextNode('您的浏览器不支持 HTML5 视频。'));
    videoBox.appendChild(videoEl);
    document.body.appendChild(videoBox);

    const nightTip = document.createElement('div');
    nightTip.id = 'nightModeTip';
    nightTip.textContent = '🌝 凌晨模式已开启';
    document.body.appendChild(nightTip);

    // ---------------------------------------------------
    // 4) 原脚本逻辑（不改动逻辑/资源/判定）
    // ---------------------------------------------------

    // 判断是否为移动设备
    const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|BlackBerry/i.test(navigator.userAgent);

    // 获取当前北京时间小时（UTC +8）
    const now = new Date();
    const utcHour = now.getUTCHours();
    const beijingHour = (utcHour + 8) % 24;
    const isNightMode = beijingHour >= 1 && beijingHour < 6; // 凌晨1点至6点为夜间模式

    // 设置全局自定义变量（保持原样）
    window.CustomLinks = '[{"link":"https://t.me/contact/1746959833:pDG7N84llgNWazU8","name":"联系我定制"},{"link":"https://github.com/hamster1963/nezha-dash","name":"GitHub"}]';
    window.CustomLogo = "https://cdn.skyimg.net/up/2025/1/13/zera6q.webp";
    window.ShowNetTransfer = "true";
    window.CustomIllustration = 'https://free.picui.cn/free/2025/04/15/67fe011873e90.gif';
    window.CustomDesc = "专业服务，技术先行";

    // —— Favicon 同步：让浏览器图标跟随 CustomLogo / 页面 logo 变化 ——
    (function setupFaviconSync() {
      const FAVICON_SIZE = 64;

      function ensureHead() {
        return document.head || document.getElementsByTagName('head')[0] || document.documentElement;
      }

      function setFaviconHref(href, type) {
        const head = ensureHead();
        let link = head.querySelector('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          head.appendChild(link);
        }
        link.href = href;
        if (type) link.type = type;
        link.sizes = 'any';

        // 兼容旧写法
        let legacy = head.querySelector('link[rel="shortcut icon"]');
        if (!legacy) {
          legacy = link.cloneNode();
          legacy.rel = 'shortcut icon';
          head.appendChild(legacy);
        } else {
          legacy.href = href;
          if (type) legacy.type = type;
          legacy.sizes = 'any';
        }
      }

      async function updateFaviconFromLogo(url) {
        if (!url || typeof url !== 'string') return;
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // CORS 允许则转为 dataURL，便于 Safari 等老版本支持
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });

          const size = FAVICON_SIZE;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d');

          // 清底并按 contain 等比缩放，居中绘制
          ctx.clearRect(0, 0, size, size);
          const ratio = Math.min(size / img.width, size / img.height);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const x = Math.round((size - w) / 2);
          const y = Math.round((size - h) / 2);
          ctx.drawImage(img, x, y, w, h);

          const dataUrl = canvas.toDataURL('image/png');
          setFaviconHref(dataUrl, 'image/png');
        } catch (e) {
          // 回退：直接把外链当 favicon（若 CSP 限制 data:，或无 CORS）
          setFaviconHref(url, '');
        }
      }

      // 1) 初始化：用当前 CustomLogo 试一次
      updateFaviconFromLogo(window.CustomLogo);

      // 2) 监听后续对 window.CustomLogo 的赋值（拦截器）
      try {
        let _logo = window.CustomLogo;
        Object.defineProperty(window, 'CustomLogo', {
          configurable: true,
          enumerable: true,
          get() { return _logo; },
          set(v) {
            _logo = v;
            updateFaviconFromLogo(v);
          }
        });
      } catch {
        // 在极少数环境下 defineProperty 会被限制：退化为轮询
        let last = window.CustomLogo;
        setInterval(() => {
          if (window.CustomLogo && window.CustomLogo !== last) {
            last = window.CustomLogo;
            updateFaviconFromLogo(last);
          }
        }, 2000);
      }

      // 3) 观察 DOM，如出现/变更可能的 logo <img>，也尝试同步
      const mo = new MutationObserver(() => {
        const candidate =
          document.querySelector('img[alt*="logo" i], img[class*="logo" i]') ||
          document.querySelector('img[alt*="icon" i], img[class*="icon" i]');
        if (candidate && candidate.src) {
          updateFaviconFromLogo(candidate.src);
        }
      });
      mo.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'class', 'alt']
      });
    })();

    let isChinaUser = false; // 默认不是中国用户

    // 尝试通过 IPInfo 判断 ASN 是否来自中国大陆
    try {
      const asnResponse = await fetch('https://ipinfo.io/json?token=769fdd3c5a44a4'); // ← 如需更安全请替换为你自己的 token
      const asnInfo = await asnResponse.json();
      const blockAsnList = ['AS9808', 'AS4134', 'AS4837']; // 移动、电信、联通等 ASN
      const userASN = asnInfo.org || '';
      if (blockAsnList.some(asn => userASN.includes(asn))) {
        isChinaUser = true;
      }
    } catch (err) {
      console.warn('ASN 获取失败，将按默认地区处理');
    }

    // 工具：创建图片背景容器
    function mountImageBackground(url) {
      const imageBox = document.createElement('div');
      imageBox.classList.add('image-box');
      imageBox.style.backgroundImage = `url(${url})`;
      document.body.appendChild(imageBox);
    }

    // 工具：设置视频源并加载
    function setVideoSrc(url) {
      sourceEl.src = url;
      videoEl.load();
    }

    // 如果是凌晨时间段，启用夜间模式（图片背景+提示）——仅非中国大陆用户生效
    if (isNightMode && !isChinaUser) {
      const nightImages = [
        'https://jkapi.com/api/yo_cup?type=&apiKey=85d2491045c79dc05e67e51574ad38da',
        'https://image.anosu.top/pixiv/direct?r18=1&keyword=touhou',
        'https://imgs.serv00.net/pic.php'
      ];
      const randomNightImage = nightImages[Math.floor(Math.random() * nightImages.length)];
      mountImageBackground(randomNightImage);

      // 隐藏视频背景
      if (videoBox) videoBox.style.display = 'none';

      // 显示夜间提示
      nightTip.classList.add('show');
      setTimeout(() => {
        nightTip.classList.remove('show');
      }, 10000);

      // 夜间模式启用后与原逻辑一致：后续不再执行
      return;
    }

    // 如果是PC端，加载梅花落动画特效（优先加载 避免后续加载不出）
    if (!isMobile) {
      const meihuaScript = document.createElement('script');
      meihuaScript.src = 'https://api.vvhan.com/api/script/meihua';
      document.body.appendChild(meihuaScript);
    }

    // 针对中国用户设置背景资源（优先加载国内 CDN）
    if (isChinaUser) {
      const chinaMediaSources = [
        { type: 'video', src: 'https://t.alcy.cc/acg' },
        { type: 'image', src: 'https://t.alcy.cc/fj' },
        { type: 'video', src: 'https://api.lolimi.cn/API/xjj/xjj.php' },
        { type: 'image', src: 'https://api.lolimi.cn/API/xjj/lt.php' },
      ];
      const randomChinaSource = chinaMediaSources[Math.floor(Math.random() * chinaMediaSources.length)];

      if (randomChinaSource.type === 'video') {
        setVideoSrc(randomChinaSource.src);
      } else {
        mountImageBackground(randomChinaSource.src);
      }

      // 与原逻辑一致：中国用户分支结束后直接退出
      return;
    }

    // 非中国用户背景设置逻辑
    if (isMobile) {
      // 移动端背景资源
      const mobileMediaSources = [
        { type: 'image', src: 'https://api.lolimi.cn/API/tup/xjj.php' },
        { type: 'video', src: 'https://tc.shni.cc/api/api.php' },
        { type: 'image', src: 'https://www.onexiaolaji.cn/RandomPicture/api/?key=qq249663924' },
        { type: 'video', src: 'http://api.mmp.cc/api/shortvideo?type=mp4' },
        { type: 'video', src: 'https://t.alcy.cc/acg' },
      ];
      const randomMobileSource = mobileMediaSources[Math.floor(Math.random() * mobileMediaSources.length)];

      if (randomMobileSource.type === 'video') {
        setVideoSrc(randomMobileSource.src);
      } else {
        mountImageBackground(randomMobileSource.src);
      }
    } else {
      // PC端背景资源
      const pcMediaSources = [
        { type: 'video', src: 'https://tc.shni.cc/api/pcapi.php' },
        { type: 'video', src: 'http://api.mmp.cc/api/ksvideo?type=mp4&id=BianZhuang' },
        { type: 'video', src: 'https://tc.shni.cc/api/api.php' },
        { type: 'image', src: 'https://api.lolimi.cn/API/meinv/api.php?type=image' },
        { type: 'video', src: 'http://api.mmp.cc/api/shortvideo?type=mp4' },
        { type: 'image', src: 'https://imgapi.xl0408.top/index.php' },
        { type: 'video', src: 'https://t.alcy.cc/acg' },
      ];
      const randomPcSource = pcMediaSources[Math.floor(Math.random() * pcMediaSources.length)];

      if (randomPcSource.type === 'video') {
        setVideoSrc(randomPcSource.src);
      } else {
        mountImageBackground(randomPcSource.src);
      }

      // 强制夜间主题和限峰功能（如果前端支持）
      window.ForceTheme = 'dark';
      window.ForcePeakCutEnabled = 'true';
    }

    // 点击视频时解除静音
    videoEl?.addEventListener('click', () => {
      videoEl.muted = false;
    });

    // 点击 Logo 切换视频静音状态（前提是 logo 存在）
    const logo = document.querySelector('.min-h-screen .cursor-pointer');
    if (logo) {
      logo.addEventListener('click', () => {
        videoEl.muted = !videoEl.muted;
      });
    }
  });
})();
