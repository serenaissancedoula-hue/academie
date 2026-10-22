(function () {
  var b = document.getElementById('menuBtn'); if (b) b.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  var o = document.getElementById('overlay'); if (o) o.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
})();
