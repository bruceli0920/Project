document.addEventListener('DOMContentLoaded', function() {
	var oNav = document.querySelector('.nav');
	var aDiv = oNav.children;
	var x = 0;
	var iNow = 0;
	var timer = null;
	oNav.style.width = 100 * aDiv.length + '%';
	for (var i = 0; i < aDiv.length; i++) {
		aDiv[i].style.width = 100 / aDiv.length + '%';
	}

	function calcelAnimate() {
		x = -iNow * aDiv[0].offsetWidth;
		oNav.style.WebkitTransition = 'none';
		oNav.style.WebkitTransform = 'translate3d(' + x + 'px,0,0)';
	}

	function createAnimate() {
		x = -iNow * aDiv[0].offsetWidth;
		oNav.style.WebkitTransition = '1s all ease';
		oNav.style.WebkitTransform = 'translate3d(' + x + 'px,0,0)';
	}

	function move() {
		iNow++;
		if (iNow >= aDiv.length) {
			iNow = 0;
			calcelAnimate();
		}
		createAnimate();
	}
	timer = setInterval(move, 3000);
	oNav.addEventListener('touchstart', function(ev) {
		clearInterval(timer);
		oNav.style.WebkitTransition = 'none';
		var downX = ev.targetTouches[0].pageX;
		var disX = downX - x;

		function fnMove(ev) {
			x = ev.targetTouches[0].pageX - disX;
			oNav.style.WebkitTransform = 'translate3d(' + x + 'px,0,0)';
		}

		function fnEnd(ev) {
			document.removeEventListener('touchmove', fnMove, false);
			document.removeEventListener('touchend', fnEnd, false);
			var upX = ev.changedTouches[0].pageX;
			if (Math.abs(upX - downX) > 50) {
				if (downX > upX) {
					iNow++;
					if (iNow >= aDiv.length) {
						iNow = 0;
						calcelAnimate();
					}
				} else {
					iNow--;
					if (iNow <= 0) {
						iNow = aDiv.length - 1;
						calcelAnimate();
					}
				}
			}
			createAnimate();
			timer = setInterval(move, 3000);
		}
		document.addEventListener('touchmove', fnMove, false);
		document.addEventListener('touchend', fnEnd, false);
		ev.preventDefault();
	}, false);
}, false)