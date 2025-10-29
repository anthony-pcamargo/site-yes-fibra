document.addEventListener('DOMContentLoaded', () => {
    // 1. Ícones lucide
    lucide.createIcons();

    // 2. Ano atual no footer
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // 3. Swiper hero
    try {
        new Swiper('.hero-swiper', {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            effect: 'fade',
            fadeEffect: { crossFade: true },
        });
    } catch (e) {
        console.error("Erro Swiper.js:", e);
    }

    // 4. Tabs de planos
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // remove ativo de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // ativa o clicado
            button.classList.add('active');
            const activeContent = document.getElementById(`tab-${targetTab}`);
            if (activeContent) activeContent.classList.remove('hidden');
        });
    });

    // 5. FAQ accordion
    const accButtons = document.querySelectorAll('.accordion-button');
    accButtons.forEach(btn => {
        const content = btn.nextElementSibling;
        if (!content) return;

        // wrap conteúdo interno pra animação suave
        const inner = document.createElement('div');
        inner.className = 'accordion-inner';
        while (content.firstChild) {
            inner.appendChild(content.firstChild);
        }
        content.appendChild(inner);

        btn.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');

        btn.addEventListener('click', () => {
            const isOpen = btn.getAttribute('aria-expanded') === 'true';

            // fecha todos os outros
            accButtons.forEach(b => {
                if (b !== btn) {
                    b.classList.remove('open');
                    b.setAttribute('aria-expanded', 'false');
                    const c = b.nextElementSibling;
                    c?.classList.remove('open');
                    c?.setAttribute('aria-hidden','true');
                    if (c){
                        c.style.paddingTop = null;
                        c.style.paddingBottom = null;
                    }
                }
            });

            // alterna este
            btn.classList.toggle('open', !isOpen);
            content.classList.toggle('open', !isOpen);
            btn.setAttribute('aria-expanded', (!isOpen).toString());
            content.setAttribute('aria-hidden', (isOpen).toString());

            // padding animado
            content.style.paddingTop = "0";
            content.style.paddingBottom = !isOpen ? "1.5rem" : null;
        });
    });

    // 6. Scroll reveal
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));

    // 7. CEP checker
    const cepForm = document.getElementById('cep-form');
    const cepInput = document.getElementById('cep-input');
    const cepSubmitButton = document.getElementById('cep-submit-button');
    const cepSubmitText = document.getElementById('cep-submit-text');
    const cepLoadingSpinner = document.getElementById('cep-loading-spinner');
    const cepErrorMessage = document.getElementById('cep-error');
    const cepResultMessage = document.getElementById('cep-result-message');

    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').substring(0, 8);
            if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;

            cepErrorMessage.classList.add('hidden');
            cepInput.classList.remove('border-red-500');
        });
    }

    if (cepForm) {
        cepForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length !== 8) {
                cepErrorMessage.textContent = 'CEP inválido. Deve conter 8 dígitos.';
                cepErrorMessage.classList.remove('hidden');
                cepInput.classList.add('border-red-500');
                return;
            }

            // estado "carregando"
            cepSubmitButton.disabled = true;
            cepSubmitText.classList.add('hidden');
            cepLoadingSpinner.classList.remove('hidden');
            cepResultMessage.classList.add('hidden');
            cepResultMessage.classList.remove('animate-pulse');

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                if (!response.ok) throw new Error('Erro API.');
                const data = await response.json();

                if (data.erro) {
                    showCepResult(
                        'CEP não encontrado',
                        'Verifique os dados e tente novamente.',
                        'error'
                    );
                } else if (data.uf && data.uf.toUpperCase() === 'SP') {
                    showCepResult(
                        'Ótima notícia! Atendemos na sua região!',
                        `CEP <strong>${data.cep}</strong>: <strong>${data.logradouro || 'Rua/Av.'}, ${data.bairro} - ${data.localidade}/${data.uf}</strong>.<br><br>Clique abaixo para contratar!`,
                        'success'
                    );
                } else {
                    showCepResult(
                        'Ainda não chegamos aí...',
                        `O CEP <strong>${data.cep}</strong> (${data.localidade}/${data.uf}) está fora da nossa cobertura (SP).`,
                        'error'
                    );
                }
            } catch (error) {
                console.error("Erro ViaCEP:", error);
                showCepResult(
                    'Erro na consulta',
                    'Tente novamente mais tarde.',
                    'error'
                );
            } finally {
                cepSubmitButton.disabled = false;
                cepSubmitText.classList.remove('hidden');
                cepLoadingSpinner.classList.add('hidden');
            }
        });
    }

    function showCepResult(title, message, type = 'success') {
        cepResultMessage.classList.remove('hidden','success','error');
        cepResultMessage.classList.add('animate-pulse');

        const isSuccess = type === 'success';
        const titleColor = isSuccess ? 'text-accent-500' : 'text-red-400';

        const icon = isSuccess
            ? '<i data-lucide="check-circle" class="w-6 h-6 mr-3 text-accent-500 flex-shrink-0"></i>'
            : '<i data-lucide="x-circle" class="w-6 h-6 mr-3 text-red-400 flex-shrink-0"></i>';

        let html = `
            <div class="flex items-center mb-3">
                ${icon}
                <h4 class="font-display text-xl font-bold ${titleColor}">${title}</h4>
            </div>
            <p class="text-gray-400">${message}</p>
        `;

        if (isSuccess) {
            html += `
                <div class="mt-6 border-t border-gray-700 pt-4">
                    <a href="https://wa.me/5500999998888?text=Olá!%20Verifiquei%20no%20site%20que%20atendem%20no%20meu%20CEP!%20Gostaria%20de%20contratar."
                       target="_blank"
                       rel="noopener noreferrer"
                       class="btn-primary inline-flex items-center text-sm py-3">
                        <i data-lucide="message-circle" class="w-5 h-5 mr-2"></i>
                        Contratar via WhatsApp
                    </a>
                </div>
            `;
        }

        cepResultMessage.innerHTML = html;

        // estado visual success/error
        cepResultMessage.classList.add(isSuccess ? 'success' : 'error');

        // recria icons no conteúdo novo
        lucide.createIcons();

        cepResultMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => cepResultMessage.classList.remove('animate-pulse'), 1000);
    }

    // 8. Botão "Verificar Cobertura"
    const locationButtons = document.querySelectorAll('#location-button');
    const coberturaSection = document.getElementById('cobertura');
    if (coberturaSection) {
        locationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                coberturaSection.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    document.getElementById('cep-input')?.focus();
                }, 500);
            });
        });
    }

    // 9. Botão Voltar ao topo
    const backtop = document.getElementById('backtop');
    const onScroll = () => {
        if (window.scrollY > 600) backtop.classList.add('show');
        else backtop.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll);

    backtop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 10. Acessibilidade: reduz movimento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            el.style.transition = 'none';
            el.classList.add('is-visible');
        });
    }

    // 11. Garante ícones corretos mesmo após mudanças dinâmicas
    lucide.createIcons();
});
