/* ==========================================================================
   Céline Dion Compte à Rebours - Logique & Citations Séquentielles
   ========================================================================== */

// --- Variables Globales ---
let currentQuoteIndex = 0;

// Citations de Céline Dion (en Français)
const CELINE_QUOTES = [
    { text: "Je n'ai jamais été branchée, et je m'en fiche royalement.", context: "Interview TV, 2013" },
    { text: "Ma musique est ma façon de m'exprimer. C'est ma thérapie, ma force.", context: "Conférence de presse" },
    { text: "Il n'y a pas de règles en amour, et il n'y a pas de règles en musique.", context: "Spectacle à Las Vegas" },
    { text: "Si tu suis tes rêves, cela signifie que tu suis ton cœur.", context: "Tournée A New Day" },
    { text: "Je ne sais pas si je suis une diva. Mais je suis une grande bosseuse.", context: "Reportage Biographique" },
    { text: "Le plus difficile dans la vie, c'est de trouver un équilibre - surtout avec le succès.", context: "Interview Vogue" },
    { text: "Mon cœur continuera de battre... seconde après seconde.", context: "Coulisses, Titanic Theme" },
    { text: "J'ai toujours été une personne très positive, il faut aller de l'avant.", context: "Journal de convalescence" },
    { text: "Nous avons tous nos propres rêves. J'ai de la chance de vivre le mien.", context: "Discours des Grammy Awards" }
];

// --- Éléments du DOM ---
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');

const quoteText = document.getElementById('quote-text');
const quoteContext = document.getElementById('quote-context');
const btnNextQuote = document.getElementById('btn-next-quote');

// --- 1. Compte à Rebours (7 Octobre 2026 à 19h30) ---
const TARGET_DATE = new Date(2026, 9, 7, 19, 30, 0); // 9 = Octobre en JS (0-indexed)

function updateCountdown() {
    const now = new Date();
    const diff = TARGET_DATE - now;

    if (diff <= 0) {
        cdDays.textContent = "00";
        cdHours.textContent = "00";
        cdMinutes.textContent = "00";
        cdSeconds.textContent = "00";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// --- 2. Citations Séquentielles de Céline ---
function showNextQuote() {
    quoteText.style.opacity = 0;
    quoteContext.style.opacity = 0;
    setTimeout(() => {
        // Avancement séquentiel de l'index des citations
        currentQuoteIndex = (currentQuoteIndex + 1) % CELINE_QUOTES.length;
        const quote = CELINE_QUOTES[currentQuoteIndex];
        quoteText.textContent = `"${quote.text}"`;
        quoteContext.textContent = `— Céline Dion, ${quote.context}`;
        quoteText.style.opacity = 1;
        quoteContext.style.opacity = 1;
    }, 250);
}

btnNextQuote.addEventListener('click', showNextQuote);
quoteText.style.transition = "opacity 0.25s ease";
quoteContext.style.transition = "opacity 0.25s ease";

// Initialisation au chargement de la page
updateCountdown();
// L'index 0 correspond à la citation par défaut de l'index.html
