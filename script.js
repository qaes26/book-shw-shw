/* ============================================
   شادية — حكاية حب ما إلها آخر
   Mobile Page-Flip Book — JavaScript
   ============================================ */

(function () {
    'use strict';

    // ===== CONFIG =====
    const TOTAL_PAGES = 6;
    const FLIP_THRESHOLD = 50; // px drag needed to flip
    const FLIP_VELOCITY = 0.3; // px/ms velocity that auto-flips

    // ===== STATE =====
    let currentPage = 1;       // which page is visible (1-indexed)
    let isFlipping = false;
    let introShown = true;

    // Touch/drag state
    let dragStartX = 0;
    let dragStartY = 0;
    let dragCurrentX = 0;
    let dragStartTime = 0;
    let isDragging = false;
    let dragPage = null;       // the DOM .page being dragged
    let dragDirection = null;  // 'next' or 'prev'

    // ===== DOM =====
    const introScreen = document.getElementById('introScreen');
    const giftWrap = document.getElementById('giftWrap');
    const giftBox = document.getElementById('giftBox');
    const bookContainer = document.getElementById('bookContainer');
    const book = document.getElementById('book');
    const navNext = document.getElementById('navNext');
    const navPrev = document.getElementById('navPrev');
    const pageDots = document.getElementById('pageDots');
    const pageCounter = document.getElementById('pageCounter');
    const currentNum = document.getElementById('currentNum');
    const totalNum = document.getElementById('totalNum');
    const swipeHint = document.getElementById('swipeHint');
    const allPages = document.querySelectorAll('.page');

    // ===== INIT =====
    function init() {
        totalNum.textContent = TOTAL_PAGES;
        buildDots();
        setupIntro();
        setupNavButtons();
        setupTouch();
        initParticles();

        // Mark first page visible
        document.getElementById('page-1').classList.add('visible');
        updateUI();
    }

    // ===== DOTS =====
    function buildDots() {
        for (let i = 1; i <= TOTAL_PAGES; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 1 ? ' active' : '');
            dot.dataset.page = i;
            dot.addEventListener('click', () => goToPage(i));
            pageDots.appendChild(dot);
        }
    }

    function updateUI() {
        currentNum.textContent = currentPage;

        // Dots
        pageDots.querySelectorAll('.dot').forEach(d => {
            d.classList.toggle('active', parseInt(d.dataset.page) === currentPage);
        });

        // Arrows
        navPrev.classList.toggle('disabled', currentPage <= 1);
        navNext.classList.toggle('disabled', currentPage >= TOTAL_PAGES);
    }

    // ===== INTRO =====
    function setupIntro() {
        giftWrap.addEventListener('click', openGift);
        giftWrap.addEventListener('touchend', (e) => {
            e.preventDefault();
            openGift();
        }, { passive: false });
    }

    function openGift() {
        if (!introShown) return;
        giftBox.classList.add('unwrapping');

        // Burst particles
        createBurst();

        setTimeout(() => {
            introScreen.classList.add('hide');
            bookContainer.classList.remove('hidden');
            introShown = false;

            // Hide swipe hint after 3s
            setTimeout(() => {
                if (swipeHint) swipeHint.classList.add('gone');
            }, 3500);
        }, 700);
    }

    function createBurst() {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        for (let i = 0; i < 24; i++) {
            const el = document.createElement('div');
            const size = Math.random() * 6 + 3;
            const angle = (Math.PI * 2 * i) / 24;
            const dist = Math.random() * 160 + 60;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const color = Math.random() > 0.5 ? '#d4a853' : '#c41e3a';
            el.style.cssText = `
                position:fixed; left:${cx}px; top:${cy}px;
                width:${size}px; height:${size}px;
                background:${color}; border-radius:50%;
                pointer-events:none; z-index:9999;
                transition: all 0.9s cubic-bezier(0.25,0.46,0.45,0.94);
                box-shadow: 0 0 ${size * 2}px ${color};
            `;
            document.body.appendChild(el);
            requestAnimationFrame(() => {
                el.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                el.style.opacity = '0';
            });
            setTimeout(() => el.remove(), 1000);
        }
    }

    // ===== NAV BUTTONS =====
    function setupNavButtons() {
        navNext.addEventListener('click', () => flipNext());
        navPrev.addEventListener('click', () => flipPrev());
    }

    // ===== PAGE FLIP LOGIC =====
    function flipNext() {
        if (isFlipping || currentPage >= TOTAL_PAGES) return;
        isFlipping = true;

        const page = document.getElementById(`page-${currentPage}`);
        page.classList.add('flipped');

        // Remove visible from current, add to next
        setTimeout(() => {
            page.classList.remove('visible');
            currentPage++;
            const nextPage = document.getElementById(`page-${currentPage}`);
            if (nextPage) nextPage.classList.add('visible');
            updateUI();
            isFlipping = false;
        }, 400);
    }

    function flipPrev() {
        if (isFlipping || currentPage <= 1) return;
        isFlipping = true;

        currentPage--;
        const page = document.getElementById(`page-${currentPage}`);
        page.classList.remove('flipped');
        page.classList.add('visible');

        setTimeout(() => {
            // Remove visible from the page after
            const afterPage = document.getElementById(`page-${currentPage + 1}`);
            if (afterPage) afterPage.classList.remove('visible');
            updateUI();
            isFlipping = false;
        }, 400);
    }

    function goToPage(target) {
        if (isFlipping || target === currentPage) return;
        if (target < 1 || target > TOTAL_PAGES) return;

        if (target > currentPage) {
            flipNext();
            if (target > currentPage) {
                setTimeout(() => goToPage(target), 500);
            }
        } else {
            flipPrev();
            if (target < currentPage) {
                setTimeout(() => goToPage(target), 500);
            }
        }
    }

    // ===== TOUCH / SWIPE / DRAG FLIP =====
    function setupTouch() {
        book.addEventListener('touchstart', onTouchStart, { passive: true });
        book.addEventListener('touchmove', onTouchMove, { passive: false });
        book.addEventListener('touchend', onTouchEnd, { passive: true });

        // Mouse support for desktop testing
        book.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onTouchStart(e) {
        if (isFlipping || introShown) return;
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        moveDrag(touch.clientX);
    }

    function onTouchEnd(e) {
        if (!isDragging) return;
        const touch = e.changedTouches[0];
        endDrag(touch.clientX);
    }

    function onMouseDown(e) {
        if (isFlipping || introShown) return;
        startDrag(e.clientX, e.clientY);
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        moveDrag(e.clientX);
    }

    function onMouseUp(e) {
        if (!isDragging) return;
        endDrag(e.clientX);
    }

    function startDrag(x, y) {
        dragStartX = x;
        dragStartY = y;
        dragCurrentX = x;
        dragStartTime = Date.now();
        isDragging = true;
        dragDirection = null;
        dragPage = null;
    }

    function moveDrag(x) {
        dragCurrentX = x;
        const dx = x - dragStartX;

        // Determine direction (RTL: drag right = next, drag left = prev)
        if (!dragDirection) {
            if (Math.abs(dx) < 10) return;
            // In RTL, swiping left (negative dx) means "next page", right means "prev"
            if (dx < 0) {
                // Swiping left -> flip to next (in RTL)
                if (currentPage >= TOTAL_PAGES) { isDragging = false; return; }
                dragDirection = 'next';
                dragPage = document.getElementById(`page-${currentPage}`);
            } else {
                // Swiping right -> flip back (in RTL)
                if (currentPage <= 1) { isDragging = false; return; }
                dragDirection = 'prev';
                dragPage = document.getElementById(`page-${currentPage - 1}`);
            }
            if (dragPage) dragPage.classList.add('dragging');
        }

        if (!dragPage) return;

        // Calculate flip angle based on drag distance
        const bookWidth = book.offsetWidth;
        const progress = Math.abs(dx) / bookWidth;
        const clampedProgress = Math.min(Math.max(progress, 0), 1);

        let angle;
        if (dragDirection === 'next') {
            angle = clampedProgress * 180; // 0 -> 180
        } else {
            angle = 180 - clampedProgress * 180; // 180 -> 0
        }

        dragPage.style.transform = `rotateY(${angle}deg)`;
    }

    function endDrag(x) {
        if (!dragPage) {
            isDragging = false;
            return;
        }

        dragPage.classList.remove('dragging');
        const dx = x - dragStartX;
        const elapsed = Date.now() - dragStartTime;
        const velocity = Math.abs(dx) / elapsed; // px/ms
        const absDx = Math.abs(dx);

        const shouldFlip = absDx > FLIP_THRESHOLD || velocity > FLIP_VELOCITY;

        if (shouldFlip) {
            if (dragDirection === 'next') {
                dragPage.style.transform = '';
                dragPage.classList.add('flipped');
                isFlipping = true;
                setTimeout(() => {
                    dragPage.classList.remove('visible');
                    currentPage++;
                    const nextEl = document.getElementById(`page-${currentPage}`);
                    if (nextEl) nextEl.classList.add('visible');
                    updateUI();
                    isFlipping = false;
                }, 400);
            } else {
                dragPage.style.transform = '';
                dragPage.classList.remove('flipped');
                dragPage.classList.add('visible');
                isFlipping = true;
                setTimeout(() => {
                    currentPage--;
                    const afterEl = document.getElementById(`page-${currentPage + 2}`);
                    if (afterEl) afterEl.classList.remove('visible');
                    updateUI();
                    isFlipping = false;
                }, 400);
            }
        } else {
            // Snap back
            dragPage.style.transform = '';
            if (dragDirection === 'next') {
                // It wasn't flipped, stay at 0
            } else {
                // It was flipped (180), snap back to flipped
                dragPage.classList.add('flipped');
            }
        }

        isDragging = false;
        dragPage = null;
        dragDirection = null;
    }

    // ===== KEYBOARD =====
    document.addEventListener('keydown', (e) => {
        if (introShown) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openGift();
            }
            return;
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); flipNext(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); flipPrev(); }
    });

    // ===== GOLDEN PARTICLES =====
    function initParticles() {
        const canvas = document.getElementById('particlesCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const count = 25; // fewer for mobile perf

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedY = -(Math.random() * 0.25 + 0.08);
                this.speedX = (Math.random() - 0.5) * 0.2;
                this.opacity = Math.random() * 0.4 + 0.1;
                this.fadeSpeed = Math.random() * 0.004 + 0.002;
                this.growing = Math.random() > 0.5;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.growing) {
                    this.opacity += this.fadeSpeed;
                    if (this.opacity >= 0.5) this.growing = false;
                } else {
                    this.opacity -= this.fadeSpeed;
                    if (this.opacity <= 0) this.reset();
                }
                if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
                    this.reset();
                    this.y = canvas.height + 10;
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212,168,83,${this.opacity})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212,168,83,${this.opacity * 0.12})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < count; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ===== START =====
    document.addEventListener('DOMContentLoaded', init);
})();
