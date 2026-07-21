$htmlPath = 'index.html'
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# 1. Inject Carousel HTML after <body>
$bodyTag = "<body>"
$carouselHTML = @"
<body>

  <!-- ══ ONBOARDING CAROUSEL ══════════════════════════════ -->
  <div id="onboardingScreen">
    <div class="carousel-container">
      
      <!-- Slide 1 -->
      <div class="carousel-slide active" id="slide-1">
        <div class="slide-title">Welcome to Luna OS</div>
        <div class="slide-text">
          The ultimate <span class="slide-highlight">Autonomous AI Web OS</span>.<br><br>
          Luna isn't just an assistant; she controls your computer, routes through hybrid LLMs, and executes commands with <span class="slide-highlight">zero-latency</span> precision.
        </div>
      </div>

      <!-- Slide 2 -->
      <div class="carousel-slide" id="slide-2">
        <div class="slide-title">Deep Local Access</div>
        <div class="slide-text">
          Luna can securely manage your local folders, integrating seamlessly with your OS. Supported by <span class="slide-highlight">high security</span> architecture.
        </div>
        <div class="folder-section">
          <div class="folder-container">
            <div class="work-5"></div>
            <div class="work-paper work-4"></div>
            <div class="work-paper work-3"></div>
            <div class="work-paper work-2"></div>
            <div class="work-1"></div>
          </div>
          <div class="folder-hint">Hover to open</div>
        </div>
      </div>

      <!-- Slide 3 -->
      <div class="carousel-slide" id="slide-3">
        <div class="slide-title">Crafted with Clean Code</div>
        <div class="slide-text">
          Engineered with an ultra-clean, minimal interface. We implemented sophisticated <span class="slide-highlight">sugar code</span> and pure vanilla techniques to ensure maximum performance without the bloat of massive frameworks.
        </div>
      </div>

      <!-- Slide 4 -->
      <div class="carousel-slide" id="slide-4">
        <div class="slide-title">The Road to Peak (v6)</div>
        <div class="slide-text">
          To our judges: Due to time constraints, this isn't the absolute <span class="slide-highlight">best UI possible</span>, but we gave it everything.<br><br>
          This ambitious vision might sound like a "slop idea" to skeptics today, but when Luna reaches <span class="slide-highlight">v6</span>, it will be absolute peak.
        </div>
      </div>

      <!-- Slide 5 -->
      <div class="carousel-slide" id="slide-5">
        <div class="slide-title">Special Dedication</div>
        <div class="slide-text">
          A mesmerizing thank you to <span class="slide-highlight">GPT-5.6</span>.<br><br>
          This v3 implementation was made possible through this incredible AI collaboration. We dedicate this version entirely to you.
        </div>
        <br><br>
        <button class="carousel-btn" style="padding: 15px 40px; font-size: 1.2rem; background: var(--c-blue); color: #fff; box-shadow: 0 0 20px rgba(0,180,255,0.6);" onclick="dismissOnboarding()">Launch Luna OS</button>
      </div>

      <!-- Navigation -->
      <div class="carousel-nav">
        <button class="carousel-btn" id="prevBtn" onclick="changeSlide(-1)" style="visibility: hidden;">&larr; Prev</button>
        <div class="carousel-dots" id="carouselDots">
          <div class="dot active"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <button class="carousel-btn" id="nextBtn" onclick="changeSlide(1)">Next &rarr;</button>
      </div>

    </div>
  </div>
"@
$html = $html.Replace($bodyTag, $carouselHTML)

# 2. Inject JS before </body>
$bodyEndTag = "</body>"
$carouselJS = @"
  <script>
    let currentSlide = 1;
    const totalSlides = 5;

    function changeSlide(dir) {
      const prev = document.getElementById(`slide-` + currentSlide);
      
      currentSlide += dir;
      if (currentSlide < 1) currentSlide = 1;
      if (currentSlide > totalSlides) currentSlide = totalSlides;
      
      const next = document.getElementById(`slide-` + currentSlide);
      
      document.querySelectorAll('.carousel-slide').forEach(s => {
        s.classList.remove('active', 'prev-slide');
      });
      
      if (dir > 0) {
        prev.classList.add('prev-slide');
      }
      next.classList.add('active');

      document.getElementById('prevBtn').style.visibility = currentSlide === 1 ? 'hidden' : 'visible';
      document.getElementById('nextBtn').style.visibility = currentSlide === totalSlides ? 'hidden' : 'visible';

      document.querySelectorAll('.carousel-dots .dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide - 1);
      });
    }

    function dismissOnboarding() {
      document.getElementById('onboardingScreen').classList.add('hidden');
    }
  </script>
</body>
"@
$html = $html.Replace($bodyEndTag, $carouselJS)

Set-Content $htmlPath -Value $html -Encoding UTF8
