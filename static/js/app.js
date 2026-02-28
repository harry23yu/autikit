/* AutiKit — frontend logic */

document.addEventListener('DOMContentLoaded', () => {

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
        // Smooth scroll so the response is visible
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
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                showError(responseEl, data.error || 'Something went wrong. Please try again.');
            } else {
                // Use marked to render Claude's markdown response
                const rendered = marked.parse(data.response);
                showResponse(responseEl, rendered);
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
