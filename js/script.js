// This file contains core, non-Firebase related UI functions
// that are shared across all pages.

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Add active class to current page in navigation
    const currentLocation = window.location.pathname;
    const navLinkItems = document.querySelectorAll('.nav-links a');
    const menuLength = navLinkItems.length;
    
    for (let i = 0; i < menuLength; i++) {
        const linkPath = navLinkItems[i].getAttribute('href');
        const currentPath = currentLocation.substring(currentLocation.lastIndexOf('/') + 1);

        if (linkPath === currentPath || (linkPath === '../index.html' && (currentPath === '' || currentPath === 'index.html'))) {
            navLinkItems[i].classList.add('active');
        }
    }
});
