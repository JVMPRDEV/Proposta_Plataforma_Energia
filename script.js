// ========================================
// Plataforma Energia Solar - Proposta Comercial
// JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update active class
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Update active nav on scroll
    const sections = document.querySelectorAll('.section');

    window.addEventListener('scroll', function() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Animate elements on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.module-card, .feature-card, .pricing-card, .step-item, .diff-item');

        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Initial styles for animation
    const animatedElements = document.querySelectorAll('.module-card, .feature-card, .pricing-card, .step-item, .diff-item');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    // Run animation on load and scroll
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    // Print functionality
    window.printProposal = function() {
        window.print();
    };

    // Add print button dynamically
    const header = document.querySelector('.header');
    if (header) {
        const printBtn = document.createElement('button');
        printBtn.innerHTML = 'Imprimir';
        printBtn.style.cssText = `
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-left: 1rem;
        `;
        printBtn.onclick = window.printProposal;

        const headerBadge = document.querySelector('.header-badge');
        if (headerBadge) {
            headerBadge.appendChild(printBtn);
        }
    }

    console.log('Plataforma Energia Solar - Proposta carregada com sucesso!');
});
