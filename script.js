// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
	navToggle.addEventListener('click', () => {
		const isOpen = navMenu.classList.toggle('open');
		navToggle.setAttribute('aria-expanded', String(isOpen));
	});
}

// Smooth active link highlighting on scroll
const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('.nav__link')];

const activateLinkForSection = (id) => {
	links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
};

const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) activateLinkForSection(entry.target.id);
		});
	},
	{ rootMargin: '-40% 0px -55% 0px', threshold: 0.01 }
);

sections.forEach((s) => observer.observe(s));

// Reveal on scroll animations
const revealEls = document.querySelectorAll('.reveal-on-scroll');
const revealObserver = new IntersectionObserver(
	(entries, obs) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add('revealed');
				obs.unobserve(entry.target);
			}
		});
	},
	{ threshold: 0.15 }
);
revealEls.forEach((el) => revealObserver.observe(el));

// Header progress bar
const progressBar = document.getElementById('scroll-progress');
const updateProgress = () => {
	const scrollTop = window.scrollY || document.documentElement.scrollTop;
	const docHeight = document.documentElement.scrollHeight - window.innerHeight;
	const progress = Math.max(0, Math.min(1, scrollTop / docHeight));
	if (progressBar) progressBar.style.width = `${progress * 100}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// Animated counters (hero stats)
const counters = document.querySelectorAll('.stat__num');
const countObserver = new IntersectionObserver(
	(entries, obs) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			const el = entry.target;
			const end = Number(el.getAttribute('data-count')) || 0;
			const duration = 1000;
			const startTime = performance.now();
			function tick(now) {
				const t = Math.min(1, (now - startTime) / duration);
				const eased = 1 - Math.pow(1 - t, 3);
				el.textContent = String(Math.round(end * eased));
				if (t < 1) requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
			obs.unobserve(el);
		});
	},
	{ threshold: 0.6 }
);
counters.forEach((c) => countObserver.observe(c));

// Year in footer
document.getElementById('year').textContent = String(new Date().getFullYear());

// (Contact form removed; socials are used instead)

// Background stars canvas — multi-depth twinkle, parallax, and rare shooting stars
const canvas = document.getElementById('bg-stars');
if (canvas) {
	const ctx = canvas.getContext('2d');
	let dpr = Math.max(1, window.devicePixelRatio || 1);
	let width = 0, height = 0;
	let layers = [];
	let shootingStars = [];
	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function resize() {
		const prevWidth = width;
		const prevHeight = height;
		width = canvas.clientWidth = window.innerWidth;
		height = canvas.clientHeight = window.innerHeight;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);
		if (prevWidth === 0) init();
	}

	function createStars(count, sizeMin, sizeMax, speed, twinkleSpeed, hue) {
		return Array.from({ length: count }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			r: sizeMin + Math.random() * (sizeMax - sizeMin),
			phase: Math.random() * Math.PI * 2,
			speed,
			twinkleSpeed,
			hue,
		}));
	}

	function init() {
		const area = width * height;
		layers = [
			{ stars: createStars(Math.max(40, Math.floor(area / 16000)), 0.6, 1.6, 0.03, 1.2, 220) },
			{ stars: createStars(Math.max(60, Math.floor(area / 12000)), 0.4, 1.2, 0.06, 1.6, 205) },
			{ stars: createStars(Math.max(90, Math.floor(area / 9000)), 0.3, 0.9, 0.09, 2.2, 200) },
		];
	}

	function maybeSpawnShootingStar() {
		if (prefersReduced) return;
		const maxConcurrent = 3;
		const spawnChance = 0.015; // per frame
		if (shootingStars.length >= maxConcurrent) return;
		if (Math.random() < spawnChance) {
			const startX = Math.random() * width;
			const startY = Math.random() * height;
			const angle = Math.random() * Math.PI * 2;
			const speed = 5 + Math.random() * 5; // px per frame
			const vx = Math.cos(angle) * speed;
			const vy = Math.sin(angle) * speed;
			shootingStars.push({
				x: startX,
				y: startY,
				vx,
				vy,
				tail: 80 + Math.random() * 80,
				life: 0,
				maxLife: 140 + Math.random() * 120,
			});
		}
	}

	let lastTime = performance.now();
	function draw(now = performance.now()) {
		const dt = Math.min(33, now - lastTime);
		lastTime = now;
		ctx.clearRect(0, 0, width, height);

		// Subtle vignette background
		const g = ctx.createRadialGradient(width * 0.5, height * 0.1, 0, width * 0.5, height * 0.1, Math.max(width, height));
		g.addColorStop(0, 'rgba(30,40,70,0.25)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, width, height);

		// Parallax layers
		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];
			for (const s of layer.stars) {
				if (!prefersReduced) s.x += s.speed * (dt / 16);
				if (s.x > width + 2) s.x = -2;
				s.phase += (s.twinkleSpeed * dt) / 1000;
				const alpha = 0.6 + 0.4 * Math.sin(s.phase * 2 + i);
				ctx.globalAlpha = alpha;
				ctx.fillStyle = `hsl(${s.hue}, 80%, 85%)`;
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Shooting stars
		if (shootingStars.length) {
			ctx.lineWidth = 2;
			for (let i = shootingStars.length - 1; i >= 0; i--) {
				const s = shootingStars[i];
				const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.tail;
				const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.tail;
				const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
				grad.addColorStop(0, 'rgba(200,220,255,0.95)');
				grad.addColorStop(1, 'rgba(200,220,255,0)');
				ctx.strokeStyle = grad;
				ctx.beginPath();
				ctx.moveTo(s.x, s.y);
				ctx.lineTo(tailX, tailY);
				ctx.stroke();

				s.x += s.vx;
				s.y += s.vy;
				s.life += 1;
				if (
					s.life > s.maxLife ||
					s.x < -200 || s.x > width + 200 ||
					s.y < -200 || s.y > height + 200
				) {
					shootingStars.splice(i, 1);
				}
			}
		}

		maybeSpawnShootingStar();
		requestAnimationFrame(draw);
	}

	resize();
	init();
	draw();
	window.addEventListener('resize', () => {
		resize();
		init();
	});
}

// Lightning bolt custom cursor (yellow)
(() => {
	const cursorHost = document.getElementById('cursor');
	const cursorGlow = document.getElementById('cursorGlow');
	if (!cursorHost) return;
	if (window.matchMedia('(pointer: fine)').matches === false) return;
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	const path = document.createElementNS(svgNS, 'path');
	// Stylized lightning bolt path
	path.setAttribute('d', 'M13 2L6 13h5l-2 9 7-11h-5z');
	path.setAttribute('fill', '#ffeb3b');
	path.setAttribute('stroke', '#e0c300');
	path.setAttribute('stroke-width', '0.5');
	svg.appendChild(path);
	cursorHost.appendChild(svg);

	let x = window.innerWidth / 2, y = window.innerHeight / 2;
	let tx = x, ty = y;
	let rafId = 0;
	const speed = 0.22; // smoothing
	const tick = () => {
		x += (tx - x) * speed;
		y += (ty - y) * speed;
		cursorHost.style.transform = `translate(${x}px, ${y}px)`;
		if (cursorGlow) cursorGlow.style.transform = `translate(${tx}px, ${ty}px)`;
		rafId = requestAnimationFrame(tick);
	};
	const onMove = (e) => {
		tx = e.clientX; ty = e.clientY;
		cursorHost.classList.remove('custom-cursor--hidden');
	};

	// Toggle active cursor when hovering clickable elements
	const interactiveSelector = 'a, button, .btn, [role="button"], input, select, textarea, label, .nav__link, .to-top';
	const isInteractive = (el) => !!el && (el.closest(interactiveSelector) != null);
	let active = false;
	const updateActive = (e) => {
		const target = e.target;
		const next = isInteractive(target);
		if (next !== active) {
			active = next;
			cursorHost.classList.toggle('custom-cursor--active', active);
		}
	};
	window.addEventListener('mousemove', updateActive, { passive: true });
	window.addEventListener('mouseover', updateActive, { passive: true });
	window.addEventListener('mousedown', () => cursorHost.classList.add('custom-cursor--active'));
	window.addEventListener('mouseup', updateActive, { passive: true });
	const onLeave = () => cursorHost.classList.add('custom-cursor--hidden');
	window.addEventListener('mousemove', onMove, { passive: true });
	window.addEventListener('mouseout', onLeave);
	window.addEventListener('blur', onLeave);
	window.addEventListener('focus', () => cursorHost.classList.remove('custom-cursor--hidden'));
	tick();
})();

// Click lightning burst effect around interactive elements
(() => {
	const fxLayer = document.getElementById('fx');
	if (!fxLayer) return;
	const interactiveSelector = 'a, button, .btn, [role="button"], input[type="button"], input[type="submit"], .nav__link, .to-top';

	function createBolt(x, y, angleDeg, color) {
		const bolt = document.createElement('div');
		bolt.style.position = 'absolute';
		bolt.style.left = `${x}px`;
		bolt.style.top = `${y}px`;
		bolt.style.width = '2px';
		bolt.style.height = '20px';
		bolt.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0))';
		bolt.style.filter = `drop-shadow(0 0 6px ${color})`;
		bolt.style.transform = `translate(-50%,-50%) rotate(${angleDeg}deg)`;
		bolt.style.borderRadius = '2px';
		bolt.style.opacity = '1';
		bolt.style.transition = 'transform 520ms ease, opacity 700ms ease';
		fxLayer.appendChild(bolt);
		requestAnimationFrame(() => {
			bolt.style.transform = `translate(-50%,-50%) rotate(${angleDeg}deg) translateY(-26px) scaleY(1.2)`;
			bolt.style.opacity = '0';
		});
		setTimeout(() => bolt.remove(), 720);
	}

	function burstAt(x, y, color = 'rgba(124,154,255,0.9)') {
		const count = 5 + Math.floor(Math.random() * 4);
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * 360;
			createBolt(x, y, angle, color);
		}
	}

	function getCenter(el) {
		const r = el.getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	}

	// Intercept clicks to show burst for ~0.7s, then perform default action
	function handleClick(e) {
		// only intercept primary button clicks without modifiers
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const target = e.target.closest(interactiveSelector);
		if (!target) return;
		if (target.dataset.burstBypass === '1') return; // avoid recursion

		const { x, y } = getCenter(target);
		burstAt(x, y);
		// prevent immediate default action
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		setTimeout(() => {
			// perform the deferred action
			const anchor = target.closest('a[href]');
			if (anchor && anchor.getAttribute('href')) {
				const href = anchor.getAttribute('href');
				if (href.startsWith('#')) {
					const dest = document.querySelector(href);
					if (dest) dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
					// close mobile menu if open
					const menu = document.getElementById('navMenu');
					if (menu) menu.classList.remove('open');
				} else {
					if (anchor.target && anchor.target !== '_self') {
						window.open(href, anchor.target);
					} else {
						window.location.href = href;
					}
				}
				return;
			}

			// For form submits
			const form = target.form;
			if (form && (target.type === 'submit' || target.getAttribute('type') === 'submit')) {
				if (form.requestSubmit) form.requestSubmit(target); else form.submit();
				return;
			}

			// Generic clickable: re-fire click once, bypassing the interceptor
			target.dataset.burstBypass = '1';
			target.click();
			setTimeout(() => { delete target.dataset.burstBypass; }, 100);
		}, 720);
	}

	document.addEventListener('click', handleClick, true);
})();

// Continuous name animation - cycles between "Dhairya" and "Meck"
(() => {
  const nameElement = document.getElementById('animated-name');
  if (!nameElement) return;

  const originalText = nameElement.dataset.text;
  const altText = nameElement.dataset.altText;
  let currentText = originalText;
  let isAnimating = false;

  function wrapLettersInSpans(text) {
    return text.split('').map(letter => `<span class="letter">${letter}</span>`).join('');
  }

  function animateNameChange() {
    if (isAnimating) return;
    isAnimating = true;

    const targetText = currentText === originalText ? altText : originalText;
    const currentLetters = nameElement.querySelectorAll('.letter');
    const targetLetters = targetText.split('');

    // Phase 1: Fade out current letters in reverse order
    const fadeOutPromises = [];
    for (let i = currentLetters.length - 1; i >= 0; i--) {
      const promise = new Promise(resolve => {
        setTimeout(() => {
          if (currentLetters[i]) {
            currentLetters[i].classList.add('fade-out');
          }
          resolve();
        }, (currentLetters.length - 1 - i) * 100); // 100ms delay between each letter
      });
      fadeOutPromises.push(promise);
    }

    // Phase 2: Replace text and fade in new letters
    Promise.all(fadeOutPromises).then(() => {
      setTimeout(() => {
        nameElement.innerHTML = wrapLettersInSpans(targetText);
        currentText = targetText;
        
        const newLetters = nameElement.querySelectorAll('.letter');
        newLetters.forEach((letter, index) => {
          letter.classList.add('fade-in');
          setTimeout(() => {
            letter.classList.remove('fade-in');
          }, index * 100); // 100ms delay between each letter appearance
        });

        setTimeout(() => {
          isAnimating = false;
        }, newLetters.length * 100 + 500); // Wait for all letters to appear + buffer
      }, 300); // Small delay before showing new text
    });
  }

  // Initialize with wrapped letters
  nameElement.innerHTML = wrapLettersInSpans(originalText);

  // Start the animation cycle
  setTimeout(() => {
    animateNameChange();
    // Continue the cycle every 4 seconds
    setInterval(animateNameChange, 4000);
  }, 2000); // Start after 2 seconds
})();

// Live age timer - calculates time since birth
(() => {
  const birthDate = new Date('2005-01-10T05:30:00');
  
  function updateTimer() {
    const now = new Date();
    const diff = now - birthDate;
    
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('years').textContent = years;
    document.getElementById('months').textContent = months;
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
  }
  
  // Update timer immediately and then every second
  updateTimer();
  setInterval(updateTimer, 1000);
})();


