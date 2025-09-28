// Resalta el enlace del menú correspondiente a la página actual
(function(){
  const path = location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('nav a').forEach(a=>{
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();
