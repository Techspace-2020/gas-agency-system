let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.navbar');
let submit=document.querySelector(".btn");

menu.onclick = () =>{
    menu.classList.toggle('fa-times');
    navbar.classList.toggle('active');
}

window.onscroll = () =>{
    menu.classList.remove('fa-times');
    navbar.classList.remove('active');
}

function foo() {
    alert("Successfully Login");
    return true;
 }

// --- Mock client-side auth using localStorage (for prototyping) ---
function _getUsers() {
	try { return JSON.parse(localStorage.getItem('mock_users')) || []; }
	catch (e) { return []; }
}
function _setUsers(users) {
	localStorage.setItem('mock_users', JSON.stringify(users));
}
function createMockUser(email, password, role = 'user') {
	const users = _getUsers();
	const normEmail = String(email || '').toLowerCase().trim();
	if (users.some(u => (u.email || '').toLowerCase() === normEmail)) return false;
	users.push({ email: normEmail, password, role });
	_setUsers(users);
	return true;
}
function seedDefaultUsers() {
	const users = _getUsers();
	if (users.length === 0) {
		createMockUser('admin@gmail.com', 'admin', 'admin');
		createMockUser('test', 'test', 'user'); // legacy "test" account
	}
}
function authenticate(identifier, password) {
	const users = _getUsers();
	if (!identifier) return null;
	// treat emails case-insensitively
	if ((identifier + '').includes('@')) {
		const idLower = String(identifier).toLowerCase();
		return users.find(u => (u.email || '').toLowerCase() === idLower && u.password === password) || null;
	}
	// fallback: exact match for non-email identifiers
	return users.find(u => u.email === identifier && u.password === password) || null;
}
function setCurrentUser(user) {
	if (user) {
		const emailNorm = (user.email || '').toLowerCase();
		localStorage.setItem('mock_current_user', JSON.stringify({ email: emailNorm, role: user.role }));
	} else localStorage.removeItem('mock_current_user');
}
function getCurrentUser() {
	try { return JSON.parse(localStorage.getItem('mock_current_user')); } catch (e) { return null; }
}
function isAuthenticated() {
	return !!getCurrentUser();
}
function logout() {
	localStorage.removeItem('mock_current_user');
	// adjust redirect as needed
	window.location.href = 'index.html';
}
function requireAuth(requiredRole, redirectTo = 'index.html') {
	const user = getCurrentUser();
	if (!user || (requiredRole && user.role !== requiredRole)) {
		window.location.href = redirectTo;
	}
}

// --- Sanitization & validation helpers ---
function sanitize(input) {
	try { return String(input).replace(/[<>]/g, '').trim(); } catch (e) { return ''; }
}
function isValidEmail(email) {
	// simple RFC-5322-ish check (sufficient for prototype)
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// normalize stored users (lowercase emails) to avoid casing issues
function normalizeStoredUsers() {
	const users = _getUsers();
	if (!Array.isArray(users) || users.length === 0) return;
	let changed = false;
	const normalized = users.map(u => {
		const copy = { ...u };
		if (copy.email) {
			const lower = String(copy.email).toLowerCase().trim();
			if (copy.email !== lower) changed = true;
			copy.email = lower;
		}
		return copy;
	});
	if (changed) _setUsers(normalized);
}

// Initialize mock data on load — normalize existing users, then seed defaults.
// Also disable autocapitalize on email inputs and lowercase on blur to handle mobile/autocap issues.
document.addEventListener('DOMContentLoaded', function () {
	normalizeStoredUsers();
	seedDefaultUsers();

	// ensure email inputs don't autocapitalize and enforce lowercase on input/blur
	try {
		document.querySelectorAll('input[type="email"], input[name="email"]').forEach(el => {
			el.autocapitalize = 'none';
			el.autocorrect = 'off';
			el.spellcheck = false;
			el.style.textTransform = 'none'; // override CSS that may capitalize letters

			// lowercase as user types while preserving caret position
			el.addEventListener('input', function () {
				const start = this.selectionStart;
				const end = this.selectionEnd;
				const lower = (this.value || '').toLowerCase();
				if (lower !== this.value) {
					this.value = lower;
					try { this.setSelectionRange(start, end); } catch (e) {}
				}
			});

			// final normalization on blur
			el.addEventListener('blur', function () {
				this.value = (this.value || '').toLowerCase();
			});
		});
	} catch (e) {
		// ignore if environment doesn't support these props
	}

		// main header hamburger toggle (keeps menu next to User Login)
		try{
			const hbBtn = document.getElementById('main-hamburger');
			const hbPanel = document.getElementById('main-hamburger-panel');
			if (hbBtn && hbPanel){
				hbBtn.addEventListener('click', function(ev){ ev.stopPropagation(); hbPanel.classList.toggle('open'); hbBtn.setAttribute('aria-expanded', hbPanel.classList.contains('open')); hbPanel.setAttribute('aria-hidden', !hbPanel.classList.contains('open')); });
				document.addEventListener('click', function(e){ if (!hbPanel.contains(e.target) && !hbBtn.contains(e.target)) { hbPanel.classList.remove('open'); hbBtn.setAttribute('aria-expanded','false'); hbPanel.setAttribute('aria-hidden','true'); } });
				document.addEventListener('keydown', function(e){ if (e.key === 'Escape') { hbPanel.classList.remove('open'); hbBtn.setAttribute('aria-expanded','false'); hbPanel.setAttribute('aria-hidden','true'); } });
			}
		} catch (err){ console.debug('main hamburger init skipped', err); }

		// initialize canvas-based captcha widgets on the page
		try {
			function generateCaptcha(len = 6){
				const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // avoid ambiguous 0O1Il
				let out = '';
				for (let i=0;i<len;i++) out += chars.charAt(Math.floor(Math.random()*chars.length));
				return out;
			}

			function drawCaptchaOnCanvas(canvas, code){
				if (!canvas) return;
				const ratio = window.devicePixelRatio || 1;
				// Use the canvas's CSS layout size (clientWidth/clientHeight)
				// so repeated redraws don't accumulate into larger sizes.
				const cssW = Math.max(60, Math.round(canvas.clientWidth || 140));
				const cssH = Math.max(32, Math.round(canvas.clientHeight || 50));
				canvas.width = cssW * ratio;
				canvas.height = cssH * ratio;
				canvas.style.width = cssW + 'px';
				canvas.style.height = cssH + 'px';
				const ctx = canvas.getContext('2d');
				ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

				// background
				const grad = ctx.createLinearGradient(0,0,cssW,0);
				grad.addColorStop(0,'#fff');
				grad.addColorStop(1,'#f7f7fb');
				ctx.fillStyle = grad;
				ctx.fillRect(0,0,cssW,cssH);

				// noise lines
				for (let i=0;i<5;i++){
					ctx.strokeStyle = 'rgba(0,0,0,' + (0.05 + Math.random()*0.08) + ')';
					ctx.beginPath();
					ctx.moveTo(Math.random()*cssW, Math.random()*cssH);
					ctx.lineTo(Math.random()*cssW, Math.random()*cssH);
					ctx.stroke();
				}

				// draw characters
				const len = code.length;
				const fontSize = Math.min(28, cssH * 0.6);
				ctx.textBaseline = 'middle';
				for (let i=0;i<len;i++){
					const ch = code.charAt(i);
					const x = 12 + i * ( (cssW - 24) / len );
					const y = cssH/2 + (Math.random()*6-3);
					const angle = (Math.random()*30 - 15) * Math.PI/180;
					ctx.save();
					ctx.translate(x,y);
					ctx.rotate(angle);
					ctx.fillStyle = '#'+Math.floor(100+Math.random()*120).toString(16)+Math.floor(100+Math.random()*120).toString(16)+Math.floor(100+Math.random()*120).toString(16);
					ctx.font = '700 ' + fontSize + 'px Arial';
					ctx.fillText(ch, -fontSize/2 + (Math.random()*6-3), 0);
					ctx.restore();
				}

				// noise dots
				for (let i=0;i<30;i++){
					ctx.fillStyle = 'rgba(0,0,0,' + (Math.random()*0.12) + ')';
					ctx.fillRect(Math.random()*cssW, Math.random()*cssH, Math.random()*2+0.5, Math.random()*2+0.5);
				}
			}

			document.querySelectorAll('.captcha-canvas').forEach(canvas => {
				const code = generateCaptcha(6);
				canvas.dataset.captcha = code;
				drawCaptchaOnCanvas(canvas, code);
			});

			document.querySelectorAll('.btn-refresh').forEach(btn => {
				btn.addEventListener('click', function(){
					const canvas = this.closest('.captcha-row')?.querySelector('.captcha-canvas');
					if (canvas){
						const code = generateCaptcha(6);
						canvas.dataset.captcha = code;
						drawCaptchaOnCanvas(canvas, code);
					}
					// clear the captcha input contained in the same row
					const input = this.closest('.captcha-row')?.querySelector('input[name="captcha"]') || document.querySelector('input[name="captcha"]');
					if (input) input.value = '';
				});
			});
		} catch (e) {
			console.debug('canvas captcha init skipped', e);
		}
});

// Replace original login functions to use mock auth and perform validation/sanitization
function login(eventOrForm) {
	let event;
	let form;
	if (eventOrForm && eventOrForm.preventDefault) {
		event = eventOrForm;
		form = event.target;
	} else {
		form = eventOrForm;
	}
	// defensive: if no form provided, nothing to do
	if (!form) return false;

	// run native HTML5 validation first
	if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
		if (event) event.preventDefault();
		if (typeof form.reportValidity === 'function') form.reportValidity();
		return false;
	}

	// extract credentials (support username OR email field names)
	const rawId = (form.querySelector('[name="username"]')?.value) || (form.querySelector('[name="email"]')?.value) || '';
	const rawPass = (form.querySelector('[name="password"]')?.value) || '';
	let id = sanitize(rawId);
	const pass = sanitize(rawPass);

	// normalize email casing if it looks like an email
	if (id.includes('@')) id = id.toLowerCase();

	// basic checks
	if (!id || !pass || pass.length < 3) {
		if (event) event.preventDefault();
		alert('Please enter valid credentials.');
		return false;
	}

	// if looks like an email, optionally validate format
	if (id.includes('@') && !isValidEmail(id)) {
		if (event) event.preventDefault();
		alert('Please enter a valid email address.');
		return false;
	}

	const user = authenticate(id, pass);

	// captcha check (if present)
	try {
		const formEl = form instanceof HTMLFormElement ? form : document.getElementById('user-login-form') || form;
		const captchaCanvas = formEl.querySelector('.captcha-canvas') || document.querySelector('.captcha-canvas');
		if (captchaCanvas) {
			const expected = (captchaCanvas.dataset.captcha || '').trim();
			const got = (formEl.querySelector('input[name="captcha"]')?.value || '').trim();
			if (!got || got.toUpperCase() !== expected.toUpperCase()) {
				if (event) event.preventDefault();
				alert('Captcha does not match. Please try again.');
				return false;
			}
		}
	} catch (e) {
		// ignore
	}
	if (user) {
		setCurrentUser(user);
		if (event) event.preventDefault(); // prevent default form submit; we handle navigation
		if (user.role === 'admin') window.location.href = 'admin_dashboard.html';
		else window.location.href = 'login_dashboard.html';
		return true;
	} else {
		if (event) event.preventDefault();
		alert('OOPs !! Incorrect email id and password');
		return false;
	}
}

function admin_login(eventOrForm) {
	let event;
	let form;
	if (eventOrForm && eventOrForm.preventDefault) {
		event = eventOrForm;
		form = event.target;
	} else {
		form = eventOrForm;
	}
	if (!form) return false;

	// HTML5 validation
	if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
		if (event) event.preventDefault();
		if (typeof form.reportValidity === 'function') form.reportValidity();
		return false;
	}

	const rawEmail = (form.querySelector('[name="email"]')?.value) || '';
	const rawPass = (form.querySelector('[name="password"]')?.value) || '';
	const email = sanitize(rawEmail).toLowerCase();
	const pass = sanitize(rawPass);

	if (!email || !pass) {
		if (event) event.preventDefault();
		alert('Please enter admin credentials.');
		return false;
	}
	if (!isValidEmail(email)) {
		if (event) event.preventDefault();
		alert('Please enter a valid admin email.');
		return false;
	}

	const user = authenticate(email, pass);
	if (user && user.role === 'admin') {
		setCurrentUser(user);
		if (event) event.preventDefault();
		window.location.href = 'admin_dashboard.html';
		return true;
	} else {
		if (event) event.preventDefault();
		alert('OOPs !! Incorrect admin email id and password');
		return false;
	}
}
  
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			if (i.parentElement) i.parentElement.classList.remove('active');
		})
		if (li) li.classList.add('active');
	})
});


// TOGGLE SIDEBAR (guard elements — admin pages may not have these selectors)
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');
if (menuBar && sidebar) {
	menuBar.addEventListener('click', function () {
		sidebar.classList.toggle('hide');
	})
}

const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

if (searchButton) {
	searchButton.addEventListener('click', function (e) {
		if(window.innerWidth < 576) {
			e.preventDefault();
			if (searchForm) searchForm.classList.toggle('show');
			if(searchForm && searchForm.classList.contains('show')) {
				if (searchButtonIcon) searchButtonIcon.classList.replace('bx-search', 'bx-x');
			} else {
				if (searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
			}
		}
	})
}

if(window.innerWidth < 768) {
	if (sidebar) sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	if (searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
	if (searchForm) searchForm.classList.remove('show');
}


window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		if (searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
		if (searchForm) searchForm.classList.remove('show');
	}
})



const switchMode = document.getElementById('switch-mode');
if (switchMode) {
	switchMode.addEventListener('change', function () {
		if(this.checked) {
			document.body.classList.add('dark');
		} else {
			document.body.classList.remove('dark');
		}
	})
}

// Robust initializer for admin login tabs/signup handler
function initAuthTabs() {
	try {
		// find every auth panel and initialize its tabs independently
		const panels = document.querySelectorAll('.panel.auth-panel');
		panels.forEach(panel => {
			const tabs = panel.querySelectorAll('.auth-tabs .tab');
			if (!tabs || tabs.length === 0) return;

			// replace nodes to avoid duplicate listeners
			tabs.forEach(t => t.replaceWith(t.cloneNode(true)));
			const freshTabs = panel.querySelectorAll('.auth-tabs .tab');

			const loginForm = panel.querySelector('form[id$="login-form"]') || panel.querySelector('form[id*="login"]') || panel.querySelector('form');
			const signupForm = panel.querySelector('form[id$="signup-form"]') || panel.querySelector('form[id*="signup"]');

			freshTabs.forEach(tab => tab.addEventListener('click', function (){
				freshTabs.forEach(t=>t.classList.remove('active'));
				this.classList.add('active');
				const target = this.getAttribute('data-target');
				if (target === 'signup'){
					if (loginForm) loginForm.style.display = 'none';
					if (signupForm) signupForm.style.display = '';
				} else {
					if (signupForm) signupForm.style.display = 'none';
					if (loginForm) loginForm.style.display = '';
				}
			}));

			// expose a contextual signup handler on window with panel scope
			// unique name per panel to avoid collisions
			const panelId = panel.getAttribute('id') || Math.random().toString(36).slice(2,7);
			const handlerName = 'handleSignup_' + panelId;
			window[handlerName] = function(form, role = 'user'){
				try {
					if (!form) return;
					const emailEl = form.querySelector('[name="email"]');
					const passEl = form.querySelector('[name="password"]');
					const confEl = form.querySelector('[name="confirm_password"]');
					const email = (emailEl && emailEl.value || '').toLowerCase().trim();
					const pass = (passEl && passEl.value || '').trim();
					const conf = (confEl && confEl.value || '').trim();
					if (!email || !pass || !conf) { alert('Please fill all fields'); return; }
					if (typeof isValidEmail === 'function' && !isValidEmail(email)) { alert('Please enter a valid email'); return; }
					if (pass.length < 3) { alert('Password must be at least 3 characters'); return; }
					if (pass !== conf) { alert('Passwords do not match'); return; }
					if (typeof createMockUser === 'function'){
						const ok = createMockUser(email, pass, role);
						if (ok){
							alert('Signup successful. You can now login.');
							const loginTab = panel.querySelector('.auth-tabs .tab[data-target="login"]');
							if (loginTab) loginTab.click();
							const loginEmail = panel.querySelector('form [name="email"]');
							if (loginEmail) loginEmail.value = email;
						} else {
							alert('User already exists. Try logging in.');
							const loginTab = panel.querySelector('.auth-tabs .tab[data-target="login"]');
							if (loginTab) loginTab.click();
						}
					} else {
						alert('Signup unavailable');
					}
				} catch (err) { console.error('signup handler error', err); }
			};

			// attach handler name to signup button if present (for convenience)
			if (signupForm) {
				const signupBtn = signupForm.querySelector('button[type="button"], button[data-signup]');
				if (signupBtn) {
					signupBtn.addEventListener('click', function(){ window[handlerName](signupForm, 'user'); });
				}
			}
		});
	} catch (e) {
		console.debug('initAuthTabs skipped:', e);
	}
}

try { initAuthTabs(); } catch (e) {}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuthTabs);