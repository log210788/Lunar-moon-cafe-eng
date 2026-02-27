window.addEventListener('DOMContentLoaded', () => {
  // Animate sections
  const sections = document.querySelectorAll(
    '.section1, .section2, .section3, .section4, .section5, .section6, .section7, .section8'
  );
  sections.forEach((section) => section.classList.add('animate'));

  // Image carousel (section5)
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.dot');
  let current = 0;

  function goTo(index) {
    slides[current].style.opacity = '0';
    dots[current].style.opacity = '0.4';
    current = index;
    slides[current].style.opacity = '1';
    dots[current].style.opacity = '1';
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  setInterval(() => goTo((current + 1) % slides.length), 3000);

  // Person carousel (section6)
  const personImg = document.getElementById('person-carousel');
  const people = [
    './src/assets/images/alady.jpg',
    './src/assets/images/aman.jpg'
  ];
  let personIndex = 0;

  setInterval(() => {
    personImg.style.opacity = '0';
    setTimeout(() => {
      personIndex = (personIndex + 1) % people.length;
      personImg.src = people[personIndex];
      personImg.style.opacity = '1';
    }, 700);
  }, 3000);

});