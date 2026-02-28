/* AutiKit — frontend logic */

document.addEventListener('DOMContentLoaded', () => {

    // ── Profile & Onboarding ───────────────────────────────
    const PROFILE_KEY = 'autikit_profile';
    let currentProfile = {};
    let obData = { role: null, challenges: [], notes: '' };
    let obCurrentStep = 1;

    function loadStoredProfile() {
        try {
            const raw = localStorage.getItem(PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function saveProfile(data) {
        const profile = { ...data, completed: true };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        currentProfile = profile;
    }

    function showOnboarding() {
        document.getElementById('onboarding').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideOnboarding() {
        document.getElementById('onboarding').classList.add('hidden');
        document.body.style.overflow = '';
    }

    function goToStep(n) {
        document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`ob-step-${n}`).classList.add('active');

        const progressEl = document.querySelector('.onboarding-progress');
        progressEl.style.display = n === 0 ? 'none' : '';

        document.querySelectorAll('.progress-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i + 1 === n);
            dot.classList.toggle('done', i + 1 < n);
        });
        document.querySelectorAll('.progress-line').forEach((line, i) => {
            line.classList.toggle('done', i + 1 < n);
        });

        obCurrentStep = n;
        const skipBtn = document.getElementById('ob-skip');
        skipBtn.textContent = n === 0 ? 'Skip for now' : 'Skip this question →';
        skipBtn.style.visibility = (n === 0 || n === 3) ? 'hidden' : '';
    }

    function applyProfileToApp() {
        const age = currentProfile.age_group;
        if (!age) return;
        ['social-age', 'sensory-age', 'exec-age'].forEach(name => {
            const radio = document.querySelector(`input[name="${name}"][value="${age}"]`);
            if (radio) radio.checked = true;
        });
    }

    // Step 0: Welcome — Let's get started
    document.getElementById('ob-welcome-start').addEventListener('click', () => {
        if (currentProfile.completed) {
            hideOnboarding();
        } else {
            goToStep(1);
        }
    });

    // Step 1: Role — toggle select/deselect; Next button advances
    document.querySelectorAll('#ob-role-options .ob-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                obData.role = null;
            } else {
                document.querySelectorAll('#ob-role-options .ob-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                obData.role = btn.dataset.value;
            }
        });
    });

    document.getElementById('ob-step1-next').addEventListener('click', () => {
        goToStep(2);
    });

    // Step 2: Challenges — explicit Next
    document.getElementById('ob-step2-next').addEventListener('click', () => {
        obData.challenges = Array.from(
            document.querySelectorAll('#ob-step-2 input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        goToStep(3);
    });

    // Step 3: Finish
    document.getElementById('ob-finish').addEventListener('click', () => {
        obData.notes = document.getElementById('ob-notes').value.trim();
        saveProfile(obData);
        applyProfileToApp();
        hideOnboarding();
    });

    // Skip — on step 0 closes entirely; on steps 1-2 advances one step; step 3 skip is hidden
    document.getElementById('ob-skip').addEventListener('click', () => {
        if (obCurrentStep === 0) {
            if (!obData.role) obData.role = 'self';
            saveProfile(obData);
            applyProfileToApp();
            hideOnboarding();
        } else if (obCurrentStep < 3) {
            goToStep(obCurrentStep + 1);
        } else {
            obData.notes = document.getElementById('ob-notes').value.trim();
            if (!obData.role) obData.role = 'self';
            saveProfile(obData);
            applyProfileToApp();
            hideOnboarding();
        }
    });

    // Edit Profile button — re-open and pre-populate
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        obData = {
            role:       currentProfile.role       || null,
            challenges: currentProfile.challenges ? [...currentProfile.challenges] : [],
            notes:      currentProfile.notes      || '',
        };

        // Pre-select role
        document.querySelectorAll('#ob-role-options .ob-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.value === obData.role);
        });
        // Pre-check challenges
        document.querySelectorAll('#ob-step-2 input[type="checkbox"]').forEach(cb => {
            cb.checked = obData.challenges.includes(cb.value);
        });
        // Pre-fill notes
        document.getElementById('ob-notes').value = obData.notes;

        goToStep(1);
        showOnboarding();
    });

    // Init: always show welcome screen; load stored profile if it exists
    const stored = loadStoredProfile();
    if (stored && stored.completed) {
        currentProfile = stored;
        applyProfileToApp();
    }
    goToStep(0);
    showOnboarding();

    // ── Tab Switching ──────────────────────────────────────
    const tabs   = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(target).classList.add('active');
        });
    });

    // ── Helpers ────────────────────────────────────────────

    function getAgeGroup(name) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : 'adult';
    }

    function showLoading(loadingEl) {
        loadingEl.classList.add('visible');
    }

    function hideLoading(loadingEl) {
        loadingEl.classList.remove('visible');
    }

    function showResponse(responseEl, html) {
        responseEl.innerHTML = html;
        responseEl.classList.add('visible');
        setTimeout(() => {
            responseEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    function showError(responseEl, message) {
        responseEl.innerHTML = `<div class="response-error">${message}</div>`;
        responseEl.classList.add('visible');
    }

    function setButtonLoading(btn, loading) {
        btn.disabled = loading;
        const textEl = btn.querySelector('.btn-text');
        if (loading) {
            btn.dataset.originalText = textEl.textContent;
            textEl.textContent = 'Thinking…';
        } else {
            textEl.textContent = btn.dataset.originalText || textEl.textContent;
        }
    }

    async function callApi(endpoint, payload, loadingEl, responseEl, btn) {
        setButtonLoading(btn, true);
        showLoading(loadingEl);
        responseEl.classList.remove('visible');

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, profile: currentProfile }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                showError(responseEl, data.error || 'Something went wrong. Please try again.');
            } else {
                showResponse(responseEl, marked.parse(data.response));
            }
        } catch (err) {
            showError(responseEl, 'Could not reach the server. Please check your connection and try again.');
        } finally {
            hideLoading(loadingEl);
            setButtonLoading(btn, false);
        }
    }

    // ── Social Script Generator ────────────────────────────
    document.getElementById('social-script-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const situation = document.getElementById('social-situation').value.trim();
        if (!situation) {
            document.getElementById('social-situation').focus();
            return;
        }

        await callApi(
            '/api/social-script',
            {
                situation,
                context:   document.getElementById('social-context').value,
                age_group: getAgeGroup('social-age'),
            },
            document.getElementById('social-script-loading'),
            document.getElementById('social-script-response'),
            e.target.querySelector('.btn-primary'),
        );
    });

    // ── Sensory Prep Planner ───────────────────────────────
    document.getElementById('sensory-prep-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const environment = document.getElementById('sensory-environment').value.trim();
        if (!environment) {
            document.getElementById('sensory-environment').focus();
            return;
        }

        await callApi(
            '/api/sensory-prep',
            {
                environment,
                age_group: getAgeGroup('sensory-age'),
            },
            document.getElementById('sensory-prep-loading'),
            document.getElementById('sensory-prep-response'),
            e.target.querySelector('.btn-primary'),
        );
    });

    // ── Executive Function Unsticker ───────────────────────
    document.getElementById('executive-function-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const task = document.getElementById('exec-task').value.trim();
        if (!task) {
            document.getElementById('exec-task').focus();
            return;
        }

        await callApi(
            '/api/executive-function',
            {
                task,
                age_group: getAgeGroup('exec-age'),
            },
            document.getElementById('executive-function-loading'),
            document.getElementById('executive-function-response'),
            e.target.querySelector('.btn-primary'),
        );
    });

});
