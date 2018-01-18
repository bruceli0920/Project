///<jscompress sourcefile="leaflet.js" />
/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/
(function (window, document, undefined) {
var oldL = window.L,
    L = {};
L.version = '0.7.2';

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = L;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(L);
}

// define Leaflet as a global L variable, saving the original L to restore later if needed

L.noConflict = function () {
	window.L = oldL;
	return this;
};

window.L = L;


/*
 * L.Util contains various utility functions used throughout Leaflet code.
 */

L.Util = {
	extend: function (dest) { // (Object[, Object, ...]) ->
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	bind: function (fn, obj) { // (Function, Object) -> Function
		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
		return function () {
			return fn.apply(obj, args || arguments);
		};
	},

	stamp: (function () {
		var lastId = 0,
		    key = '_leaflet_id';
		return function (obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),

	invokeEach: function (obj, method, context) {
		var i, args;

		if (typeof obj === 'object') {
			args = Array.prototype.slice.call(arguments, 3);

			for (i in obj) {
				method.apply(context, [i, obj[i]].concat(args));
			}
			return true;
		}

		return false;
	},

	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;

		return function wrapperFn() {
			var args = arguments;

			if (lock) {
				execOnUnlock = true;
				return;
			}

			lock = true;

			setTimeout(function () {
				lock = false;

				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);

			fn.apply(context, args);
		};
	},

	falseFn: function () {
		return false;
	},

	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	splitWords: function (str) {
		return L.Util.trim(str).split(/\s+/);
	},

	setOptions: function (obj, options) {
		obj.options = L.extend({}, obj.options, options);
		return obj.options;
	},

	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {

	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		var i, fn,
		    prefixes = ['webkit', 'moz', 'o', 'ms'];

		for (i = 0; i < prefixes.length && !fn; i++) {
			fn = window[prefixes[i] + name];
		}

		return fn;
	}

	var lastTime = 0;

	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame ||
	        getPrefixed('RequestAnimationFrame') || timeoutDefer;

	var cancelFn = window.cancelAnimationFrame ||
	        getPrefixed('CancelAnimationFrame') ||
	        getPrefixed('CancelRequestAnimationFrame') ||
	        function (id) { window.clearTimeout(id); };


	L.Util.requestAnimFrame = function (fn, context, immediate, element) {
		fn = L.bind(fn, context);

		if (immediate && requestFn === timeoutDefer) {
			fn();
		} else {
			return requestFn.call(window, fn, element);
		}
	};

	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};

}());

// shortcuts for most used utility functions
L.extend = L.Util.extend;
L.bind = L.Util.bind;
L.stamp = L.Util.stamp;
L.setOptions = L.Util.setOptions;


/*
 * L.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

L.Class = function () {};

L.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks) {
			this.callInitHooks();
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;

	var proto = new F();
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		L.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = L.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	L.extend(proto, props);

	proto._initHooks = [];

	var parent = this;
	// jshint camelcase: false
	NewClass.__super__ = parent.prototype;

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parent.prototype.callInitHooks) {
			parent.prototype.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// method for adding properties to prototype
L.Class.include = function (props) {
	L.extend(this.prototype, props);
};

// merge new default options to the Class
L.Class.mergeOptions = function (options) {
	L.extend(this.prototype.options, options);
};

// add a constructor hook
L.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};


/*
 * L.Mixin.Events is used to add custom events functionality to Leaflet classes.
 */

var eventsKey = '_leaflet_events';

L.Mixin = {};

L.Mixin.Events = {

	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])

		// types can be a map of types/handlers
		if (L.Util.invokeEach(types, this.addEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey] = this[eventsKey] || {},
		    contextId = context && context !== this && L.stamp(context),
		    i, len, event, type, indexKey, indexLenKey, typeIndex;

		// types can be a string of space-separated words
		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			event = {
				action: fn,
				context: context || this
			};
			type = types[i];

			if (contextId) {
				// store listeners of a particular context in a separate hash (if it has an id)
				// gives a major performance boost when removing thousands of map layers

				indexKey = type + '_idx';
				indexLenKey = indexKey + '_len';

				typeIndex = events[indexKey] = events[indexKey] || {};

				if (!typeIndex[contextId]) {
					typeIndex[contextId] = [];

					// keep track of the number of keys in the index to quickly check if it's empty
					events[indexLenKey] = (events[indexLenKey] || 0) + 1;
				}

				typeIndex[contextId].push(event);


			} else {
				events[type] = events[type] || [];
				events[type].push(event);
			}
		}

		return this;
	},

	hasEventListeners: function (type) { // (String) -> Boolean
		var events = this[eventsKey];
		return !!events && ((type in events && events[type].length > 0) ||
		                    (type + '_idx' in events && events[type + '_idx_len'] > 0));
	},

	removeEventListener: function (types, fn, context) { // ([String, Function, Object]) or (Object[, Object])

		if (!this[eventsKey]) {
			return this;
		}

		if (!types) {
			return this.clearAllEventListeners();
		}

		if (L.Util.invokeEach(types, this.removeEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey],
		    contextId = context && context !== this && L.stamp(context),
		    i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;

		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			type = types[i];
			indexKey = type + '_idx';
			indexLenKey = indexKey + '_len';

			typeIndex = events[indexKey];

			if (!fn) {
				// clear all listeners for a type if function isn't specified
				delete events[type];
				delete events[indexKey];
				delete events[indexLenKey];

			} else {
				listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];

				if (listeners) {
					for (j = listeners.length - 1; j >= 0; j--) {
						if ((listeners[j].action === fn) && (!context || (listeners[j].context === context))) {
							removed = listeners.splice(j, 1);
							// set the old action to a no-op, because it is possible
							// that the listener is being iterated over as part of a dispatch
							removed[0].action = L.Util.falseFn;
						}
					}

					if (context && typeIndex && (listeners.length === 0)) {
						delete typeIndex[contextId];
						events[indexLenKey]--;
					}
				}
			}
		}

		return this;
	},

	clearAllEventListeners: function () {
		delete this[eventsKey];
		return this;
	},

	fireEvent: function (type, data) { // (String[, Object])
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = L.Util.extend({}, data, { type: type, target: this });

		var events = this[eventsKey],
		    listeners, i, len, typeIndex, contextId;

		if (events[type]) {
			// make sure adding/removing listeners inside other listeners won't cause infinite loop
			listeners = events[type].slice();

			for (i = 0, len = listeners.length; i < len; i++) {
			    if (type == "moveend") {// zs 20150519 set _updateSvgViewport  before other moveend event
			        listeners[listeners.length - i - 1].action.call(listeners[listeners.length - i - 1].context, event);
			    }
			    else {
			        listeners[i].action.call(listeners[i].context, event);
			    }
			    //else if (type == "drag") { //��ʱ���ã������Ϸ�ʱ���ó�����Χ
			    //    if (this.options.maxBounds != null) {
			    //        if (this.options.maxBounds.contains(this.getCenter()))//�������Χ��
			    //        {
			    //            listeners[i].action.call(listeners[i].context, event);
			    //        }
			    //        else {
			    //            console.log("������Χ.");
			    //        }
			    //    }
			    //}
			}
		}

		// fire event for the context-indexed listeners as well
		typeIndex = events[type + '_idx'];

		for (contextId in typeIndex) {
			listeners = typeIndex[contextId].slice();

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].action.call(listeners[i].context, event);
				}
			}
		}

		return this;
	},

	addOneTimeEventListener: function (types, fn, context) {

		if (L.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) { return this; }

		var handler = L.bind(function () {
			this
			    .removeEventListener(types, fn, context)
			    .removeEventListener(types, handler, context);
		}, this);

		return this
		    .addEventListener(types, fn, context)
		    .addEventListener(types, handler, context);
	}
};

L.Mixin.Events.on = L.Mixin.Events.addEventListener;
L.Mixin.Events.off = L.Mixin.Events.removeEventListener;
L.Mixin.Events.once = L.Mixin.Events.addOneTimeEventListener;
L.Mixin.Events.fire = L.Mixin.Events.fireEvent;


/*
 * L.Browser handles different browser and feature detections for internal Leaflet use.
 */

(function () {

	var ie = 'ActiveXObject' in window,
		ielt9 = ie && !document.addEventListener,

	    // terrible browser detection to work around Safari / iOS / Android browser bugs
	    ua = navigator.userAgent.toLowerCase(),
	    webkit = ua.indexOf('webkit') !== -1,
	    chrome = ua.indexOf('chrome') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android = ua.indexOf('android') !== -1,
	    android23 = ua.search('android [23]') !== -1,
		gecko = ua.indexOf('gecko') !== -1,

	    mobile = typeof orientation !== undefined + '',
	    msPointer = window.navigator && window.navigator.msPointerEnabled &&
	              window.navigator.msMaxTouchPoints && !window.PointerEvent,
		pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
				  msPointer,
	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
	              window.matchMedia('(min-resolution:144dpi)').matches),

	    doc = document.documentElement,
	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera3d = 'OTransition' in doc.style,
	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


	// PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
	// https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

	var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

		var startName = 'ontouchstart';

		// IE10+ (We simulate these into touch* events in L.DomEvent and L.DomEvent.Pointer) or WebKit, etc.
		if (pointer || (startName in doc)) {
			return true;
		}

		// Firefox/Gecko
		var div = document.createElement('div'),
		    supported = false;

		if (!div.setAttribute) {
			return false;
		}
		div.setAttribute(startName, 'return;');

		if (typeof div[startName] === 'function') {
			supported = true;
		}

		div.removeAttribute(startName);
		div = null;

		return supported;
	}());


	L.Browser = {
		ie: ie,
		ielt9: ielt9,
		webkit: webkit,
		gecko: gecko && !webkit && !window.opera && !ie,

		android: android,
		android23: android23,

		chrome: chrome,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera3d: opera3d,
		any3d: any3d,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,

		touch: touch,
		msPointer: msPointer,
		pointer: pointer,

		retina: retina
	};

}());


/*
 * L.Point represents a point with x and y coordinates.
 */

L.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

L.Point.prototype = {

	clone: function () {
		return new L.Point(this.x, this.y);
	},

	// non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(L.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	subtract: function (point) {
		return this.clone()._subtract(L.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	distanceTo: function (point) {
		point = L.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	equals: function (point) {
		point = L.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	contains: function (point) {
		point = L.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	toString: function () {
		return 'Point(' +
		        L.Util.formatNum(this.x) + ', ' +
		        L.Util.formatNum(this.y) + ')';
	}
};

L.point = function (x, y, round) {
	if (x instanceof L.Point) {
		return x;
	}
	if (L.Util.isArray(x)) {
		return new L.Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new L.Point(x, y, round);
};


/*
 * L.Bounds represents a rectangular area on the screen in pixel coordinates.
 */

L.Bounds = function (a, b) { //(Point, Point) or Point[]
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

L.Bounds.prototype = {
	// extend the bounds to contain the given point
	extend: function (point) { // (Point)
		point = L.point(point);

		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	getCenter: function (round) { // (Boolean) -> Point
		return new L.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	getBottomLeft: function () { // -> Point
		return new L.Point(this.min.x, this.max.y);
	},

	getTopRight: function () { // -> Point
		return new L.Point(this.max.x, this.min.y);
	},

	getSize: function () {
		return this.max.subtract(this.min);
	},

	contains: function (obj) { // (Bounds) or (Point) -> Boolean
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof L.Point) {
			obj = L.point(obj);
		} else {
			obj = L.bounds(obj);
		}

		if (obj instanceof L.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};

L.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
	if (!a || a instanceof L.Bounds) {
		return a;
	}
	return new L.Bounds(a, b);
};


/*
 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};


/*
 * L.DomUtil contains various utility functions for working with DOM.
 */

L.DomUtil = {
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},

	getStyle: function (el, style) {

		var value = el.style[style];

		if (!value && el.currentStyle) {
			value = el.currentStyle[style];
		}

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	getViewportOffset: function (element) {

		var top = 0,
		    left = 0,
		    el = element,
		    docBody = document.body,
		    docEl = document.documentElement,
		    pos;

		do {
			top  += el.offsetTop  || 0;
			left += el.offsetLeft || 0;

			//add borders
			top += parseInt(L.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
			left += parseInt(L.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

			pos = L.DomUtil.getStyle(el, 'position');

			if (el.offsetParent === docBody && pos === 'absolute') { break; }

			if (pos === 'fixed') {
				top  += docBody.scrollTop  || docEl.scrollTop  || 0;
				left += docBody.scrollLeft || docEl.scrollLeft || 0;
				break;
			}

			if (pos === 'relative' && !el.offsetLeft) {
				var width = L.DomUtil.getStyle(el, 'width'),
				    maxWidth = L.DomUtil.getStyle(el, 'max-width'),
				    r = el.getBoundingClientRect();

				if (width !== 'none' || maxWidth !== 'none') {
					left += r.left + el.clientLeft;
				}

				//calculate full y offset since we're breaking out of the loop
				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);

				break;
			}

			el = el.offsetParent;

		} while (el);

		el = element;

		do {
			if (el === docBody) { break; }

			top  -= el.scrollTop  || 0;
			left -= el.scrollLeft || 0;

			el = el.parentNode;
		} while (el);

		return new L.Point(left, top);
	},

	documentIsLtr: function () {
		if (!L.DomUtil._docIsLtrCached) {
			L.DomUtil._docIsLtrCached = true;
			L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, 'direction') === 'ltr';
		}
		return L.DomUtil._docIsLtr;
	},

	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = L.DomUtil._getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = L.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!L.DomUtil.hasClass(el, name)) {
			var className = L.DomUtil._getClass(el);
			L.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			L.DomUtil._setClass(el, L.Util.trim((' ' + L.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	_setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	_getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {

			var filter = false,
			    filterName = 'DXImageTransform.Microsoft.Alpha';

			// filters collection throws an error if we try to retrieve a filter that doesn't exist
			try {
				filter = el.filters.item(filterName);
			} catch (e) {
				// don't set opacity to 1 if we haven't already set an opacity,
				// it isn't needed and breaks transparent pngs.
				if (value === 1) { return; }
			}

			value = Math.round(value * 100);

			if (filter) {
				filter.Enabled = (value !== 100);
				filter.Opacity = value;
			} else {
				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
			}
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	getTranslateString: function (point) {
		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
		// (same speed either way), Opera 12 doesn't support translate3d

		var is3d = L.Browser.webkit3d,
		    open = 'translate' + (is3d ? '3d' : '') + '(',
		    close = (is3d ? ',0' : '') + ')';

		return open + point.x + 'px,' + point.y + 'px' + close;
	},

	getScaleString: function (scale, origin) {

		var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
		    scaleStr = ' scale(' + scale + ') ';

		return preTranslateStr + scaleStr;
	},

	setPosition: function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])

		// jshint camelcase: false
		el._leaflet_pos = point;

		if (!disable3D && L.Browser.any3d) {
			el.style[L.DomUtil.TRANSFORM] =  L.DomUtil.getTranslateString(point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		// jshint camelcase: false
		return el._leaflet_pos;
	}
};


// prefix style property names

L.DomUtil.TRANSFORM = L.DomUtil.testProp(
        ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

// webkitTransition comes first because some browser versions that drop vendor prefix don't do
// the same for the transitionend event, in particular the Android 4.1 stock browser

L.DomUtil.TRANSITION = L.DomUtil.testProp(
        ['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

L.DomUtil.TRANSITION_END =
        L.DomUtil.TRANSITION === 'webkitTransition' || L.DomUtil.TRANSITION === 'OTransition' ?
        L.DomUtil.TRANSITION + 'End' : 'transitionend';

(function () {
    if ('onselectstart' in document) {
        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);
            },

            enableTextSelection: function () {
                L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);
            }
        });
    } else {
        var userSelectProperty = L.DomUtil.testProp(
            ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                if (userSelectProperty) {
                    var style = document.documentElement.style;
                    this._userSelect = style[userSelectProperty];
                    style[userSelectProperty] = 'none';
                }
            },

            enableTextSelection: function () {
                if (userSelectProperty) {
                    document.documentElement.style[userSelectProperty] = this._userSelect;
                    delete this._userSelect;
                }
            }
        });
    }

	L.extend(L.DomUtil, {
		disableImageDrag: function () {
			L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);
		},

		enableImageDrag: function () {
			L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);
		}
	});
})();


/*
 * L.LatLng represents a geographical point with latitude and longitude coordinates.
 */

L.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
	lat = parseFloat(lat);
	lng = parseFloat(lng);

	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	this.lat = lat;
	this.lng = lng;

	if (alt !== undefined) {
		this.alt = parseFloat(alt);
	}
};

L.extend(L.LatLng, {
	DEG_TO_RAD: Math.PI / 180,
	RAD_TO_DEG: 180 / Math.PI,
	MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check
});

L.LatLng.prototype = {
	equals: function (obj) { // (LatLng) -> Boolean
		if (!obj) { return false; }

		obj = L.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= L.LatLng.MAX_MARGIN;
	},

	toString: function (precision) { // (Number) -> String
		return 'LatLng(' +
		        L.Util.formatNum(this.lat, precision) + ', ' +
		        L.Util.formatNum(this.lng, precision) + ')';
	},

	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
	// TODO move to projection code, LatLng shouldn't know about Earth
	distanceTo: function (other) { // (LatLng) -> Number
		other = L.latLng(other);

		var R = 6378137, // earth radius in meters
		    d2r = L.LatLng.DEG_TO_RAD,
		    dLat = (other.lat - this.lat) * d2r,
		    dLon = (other.lng - this.lng) * d2r,
		    lat1 = this.lat * d2r,
		    lat2 = other.lat * d2r,
		    sin1 = Math.sin(dLat / 2),
		    sin2 = Math.sin(dLon / 2);

		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	},

	wrap: function (a, b) { // (Number, Number) -> LatLng
		var lng = this.lng;

		a = a || -180;
		b = b ||  180;

		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

		return new L.LatLng(this.lat, lng);
	}
};

L.latLng = function (a, b) { // (LatLng) or ([Number, Number]) or (Number, Number)
	if (a instanceof L.LatLng) {
		return a;
	}
	if (L.Util.isArray(a)) {
		if (typeof a[0] === 'number' || typeof a[0] === 'string') {
			return new L.LatLng(a[0], a[1], a[2]);
		} else {
			return null;
		}
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);
	}
	if (b === undefined) {
		return null;
	}
	return new L.LatLng(a, b);
};



/*
 * L.LatLngBounds represents a rectangular area on the map in geographical coordinates.
 */

L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

L.LatLngBounds.prototype = {
	// extend the bounds to contain the given point or bounds
	extend: function (obj) { // (LatLng) or (LatLngBounds)
		if (!obj) { return this; }

		var latLng = L.latLng(obj);
		if (latLng !== null) {
			obj = latLng;
		} else {
			obj = L.latLngBounds(obj);
		}

		if (obj instanceof L.LatLng) {
			if (!this._southWest && !this._northEast) {
				this._southWest = new L.LatLng(obj.lat, obj.lng);
				this._northEast = new L.LatLng(obj.lat, obj.lng);
			} else {
				this._southWest.lat = Math.min(obj.lat, this._southWest.lat);
				this._southWest.lng = Math.min(obj.lng, this._southWest.lng);

				this._northEast.lat = Math.max(obj.lat, this._northEast.lat);
				this._northEast.lng = Math.max(obj.lng, this._northEast.lng);
			}
		} else if (obj instanceof L.LatLngBounds) {
			this.extend(obj._southWest);
			this.extend(obj._northEast);
		}
		return this;
	},

	// extend the bounds by a percentage
	pad: function (bufferRatio) { // (Number) -> LatLngBounds
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new L.LatLngBounds(
		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	getCenter: function () { // -> LatLng
		return new L.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	getSouthWest: function () {
		return this._southWest;
	},

	getNorthEast: function () {
		return this._northEast;
	},

	getNorthWest: function () {
		return new L.LatLng(this.getNorth(), this.getWest());
	},

	getSouthEast: function () {
		return new L.LatLng(this.getSouth(), this.getEast());
	},

	getWest: function () {
		return this._southWest.lng;
	},

	getSouth: function () {
		return this._southWest.lat;
	},

	getEast: function () {
		return this._northEast.lng;
	},

	getNorth: function () {
		return this._northEast.lat;
	},

	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {
			obj = L.latLng(obj);
		} else {
			obj = L.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	intersects: function (bounds) { // (LatLngBounds)
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	equals: function (bounds) { // (LatLngBounds)
		if (!bounds) { return false; }

		bounds = L.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

//TODO International date line?

L.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)
	if (!a || a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
};


/*
 * L.Projection contains various geographical projections used by CRS classes.
 */

L.Projection = {};


/*
 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.
 */

L.Projection.SphericalMercator = {
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    x = latlng.lng * d,
		    y = lat * d;

		y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    lng = point.x * d,
		    lat = (2 * Math.atan(Math.exp(point.y)) - (Math.PI / 2)) * d;

		return new L.LatLng(lat, lng);
	}
};


/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

L.Projection.LonLat = {
	project: function (latlng) {
		return new L.Point(latlng.lng, latlng.lat);
	},

	unproject: function (point) {
		return new L.LatLng(point.y, point.x);
	}
};


/*
 * L.CRS is a base object for all defined CRS (Coordinate Reference Systems) in Leaflet.
 */

L.CRS = {
	latLngToPoint: function (latlng, zoom) { // (LatLng, Number) -> Point
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	pointToLatLng: function (point, zoom) { // (Point, Number[, Boolean]) -> LatLng
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	project: function (latlng) {
		return this.projection.project(latlng);
	},

	scale: function (zoom) {
		return 256 * Math.pow(2, zoom);
	},

	getSize: function (zoom) {
		var s = this.scale(zoom);
		return L.point(s, s);
	}
};


/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	}
});


/*
 * L.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping
 * and is used by Leaflet by default.
 */

L.CRS.EPSG3857 = L.extend({}, L.CRS, {
	code: 'EPSG:3857',

	projection: L.Projection.SphericalMercator,
	transformation: new L.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5),

	project: function (latlng) { // (LatLng) -> Point
		var projectedPoint = this.projection.project(latlng),
		    earthRadius = 6378137;
		return projectedPoint.multiplyBy(earthRadius);
	}
});

L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
	code: 'EPSG:900913'
});


/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.EPSG4326 = L.extend({}, L.CRS, {
	code: 'EPSG:4326',

	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1 / 360, 0.5, -1 / 360, 0.5)
});


/*
 * L.Map is the central class of the API - it is used to create a map.
 */

L.Map = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		crs: L.CRS.EPSG3857,

		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,
		trackResize: true,
		markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.setOptions(this, options);


		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = L.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];

		this._layers = {};
		this._zoomBoundLayers = {};
		this._tileLayersNum = 0;

		this.callInitHooks();

		this._addLayers(options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	setView: function (center, zoom) {
		zoom = zoom === undefined ? this.getZoom() : zoom;
		this._resetView(L.latLng(center), this._limitZoom(zoom));
		return this;
	},

	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = this._limitZoom(zoom);
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	zoomIn: function (delta, options) {
		return this.setZoom(this._zoom + (delta || 1), options);
	},

	zoomOut: function (delta, options) {
		return this.setZoom(this._zoom - (delta || 1), options);
	},

	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	fitBounds: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR)),
		    paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		zoom = options && options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;

		return this.setView(center, zoom, options);
	},

	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.PanAnimation.js
		this.fire('movestart');

		this._rawPanBy(L.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},

	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		this.options.maxBounds = bounds;
        /*zs  There IS A BUG ���ú󴰿ڻ᲻ͣ����
		if (!bounds) {
			return this.off('moveend', this._panInsideMaxBounds, this);
		}

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds, this);
        */
	},

	panInsideBounds: function (bounds, options) {
		var center = this.getCenter(),
			newCenter = this._limitCenter(center, this._zoom, bounds);

		if (center.equals(newCenter)) {
		    return this;
		}

		return this.panTo(newCenter, options);
	},

	addLayer: function (layer) {
		// TODO method is too big, refactor

		var id = L.stamp(layer);

		if (this._layers[id]) { return this; }

		this._layers[id] = layer;

		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)
		if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {
			this._zoomBoundLayers[id] = layer;
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor!!!
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum++;
			this._tileLayersToLoad++;
			layer.on('load', this._onTileLayerLoad, this);
		}

		if (this._loaded) {
			this._layerAdd(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
		}

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum--;
			this._tileLayersToLoad--;
			layer.off('load', this._onTileLayerLoad, this);
		}

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (L.stamp(layer) in this._layers);
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = L.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._initialCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	// TODO handler.addTo
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	remove: function () {
		if (this._loaded) {
			this.fire('unload');
		}

		this._initEvents('off');

		try {
			// throws error in IE6-8
			delete this._container._leaflet;
		} catch (e) {
			this._container._leaflet = undefined;
		}

		this._clearPanes();
		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		return this;
	},


	// public methods for getting map state

	getCenter: function () { // (Boolean) -> LatLng
		this._checkIfLoaded();

		if (this._initialCenter && !this._moved()) {
			return this._initialCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		return this.options.minZoom === undefined ?
			(this._layersMinZoom === undefined ? 0 : this._layersMinZoom) :
			this.options.minZoom;
	},

	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = L.latLngBounds(bounds);

		var zoom = this.getMinZoom() - (inside ? 1 : 0),
		    maxZoom = this.getMaxZoom(),
		    size = this.getSize(),

		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),

		    zoomNotFound = true,
		    boundsSize;

		padding = L.point(padding || [0, 0]);

		do {
			zoom++;
			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	getPixelBounds: function () {
		var topLeftPoint = this._getTopLeftPoint();
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._initialTopLeftPoint;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom) {
		var crs = this.options.crs;
		return crs.scale(toZoom) / crs.scale(this._zoom);
	},

	getScaleZoom: function (scale) {
		return this._zoom + (Math.log(scale) / Math.LN2);
	},


	// conversion methods

	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},

	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		var projectedPoint = L.point(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return L.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet) {
			throw new Error('Map container is already initialized.');
		}

		container._leaflet = true;
	},

	_initLayout: function () {
		var container = this._container;

		L.DomUtil.addClass(container, 'leaflet-container' +
			(L.Browser.touch ? ' leaflet-touch' : '') +
			(L.Browser.retina ? ' leaflet-retina' : '') +
			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(this.options.fadeAnimation ? ' leaflet-fade-anim' : ''));

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};

		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);

		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);
		panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);
		panes.shadowPane = this._createPane('leaflet-shadow-pane');
		panes.overlayPane = this._createPane('leaflet-overlay-pane');
		panes.markerPane = this._createPane('leaflet-marker-pane');
		panes.popupPane = this._createPane('leaflet-popup-pane');

		var zoomHide = ' leaflet-zoom-hide';

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, zoomHide);
			L.DomUtil.addClass(panes.shadowPane, zoomHide);
			L.DomUtil.addClass(panes.popupPane, zoomHide);
		}
	},

	_createPane: function (className, container) {
		return L.DomUtil.create('div', className, container || this._panes.objectsPane);
	},

	_clearPanes: function () {
		this._container.removeChild(this._mapPane);
	},

	_addLayers: function (layers) {
		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},


	// private methods that modify map state

	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {
	    //ZS Test efficiency
	    var t1;
	    var t2;
	    t1 = new Date().getTime();

	    var zoomChanged = (this._zoom !== zoom);

	    if (!afterZoomAnim) {
	        this.fire('movestart');

	        if (zoomChanged) {
	            this.fire('zoomstart');
	        }
	    }

	    this._zoom = zoom;
	    this._initialCenter = center;

	    this._initialTopLeftPoint = this._getNewTopLeftPoint(center);

	    if (!preserveMapOffset) {
	        L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
	    } else {
	        this._initialTopLeftPoint._add(this._getMapPanePos());
	    }

	    this._tileLayersToLoad = this._tileLayersNum;

	    var loading = !this._loaded;
	    this._loaded = true;

	    if (loading) {
	        this.fire('load');
	        this.eachLayer(this._layerAdd, this);
	    }

	    this.fire('viewreset', { hard: !preserveMapOffset });

	    this.fire('move');

	    if (zoomChanged || afterZoomAnim) {
	        this.fire('zoomend');
	    }
	    this.fire('moveend', { hard: !preserveMapOffset });
	    //ZS Test efficiency
	    t2 = new Date().getTime();
	    debugTools ? $("#show .wechat_text").html("<p>" + "缩放结束后耗时:" + (t2 - t1) + "毫秒" + "</p>") : "";
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_updateZoomLevels: function () {
		var i,
			minZoom = Infinity,
			maxZoom = -Infinity,
			oldZoomSpan = this._getZoomSpan();

		for (i in this._zoomBoundLayers) {
			var layer = this._zoomBoundLayers[i];
			if (!isNaN(layer.options.minZoom)) {
				minZoom = Math.min(minZoom, layer.options.minZoom);
			}
			if (!isNaN(layer.options.maxZoom)) {
				maxZoom = Math.max(maxZoom, layer.options.maxZoom);
			}
		}

		if (i === undefined) { // we have no tilelayers
			this._layersMaxZoom = this._layersMinZoom = undefined;
		} else {
			this._layersMaxZoom = maxZoom;
			this._layersMinZoom = minZoom;
		}

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	},

	_panInsideMaxBounds: function () {
		this.panInsideBounds(this.options.maxBounds);
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// map events

	_initEvents: function (onOff) {
		if (!L.DomEvent) { return; }

		onOff = onOff || 'on';

		L.DomEvent[onOff](this._container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter',
		              'mouseleave', 'mousemove', 'contextmenu'],
		    i, len;

		for (i = 0, len = events.length; i < len; i++) {
			L.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			L.DomEvent[onOff](window, 'resize', this._onResize, this);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this, false, this._container);
	},

	_onMouseClick: function (e) {
		if (!this._loaded || (!e._simulated &&
		        ((this.dragging && this.dragging.moved()) ||
		         (this.boxZoom  && this.boxZoom.moved()))) ||
		            L.DomEvent._skipped(e)) { return; }

		this.fire('preclick');
		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this._loaded || L.DomEvent._skipped(e)) { return; }

		var type = e.type;

		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) { return; }

		if (type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}

		var containerPoint = this.mouseEventToContainerPoint(e),
		    layerPoint = this.containerPointToLayerPoint(containerPoint),
		    latlng = this.layerPointToLatLng(layerPoint);

		this.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});
	},

	_onTileLayerLoad: function () {
		this._tileLayersToLoad--;
		if (this._tileLayersNum && !this._tileLayersToLoad) {
			this.fire('tilelayersload');
		}
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, this);
		} else {
			this.on('load', callback, context);
		}
		return this;
	},

	_layerAdd: function (layer) {
		layer.onAdd(this);
		this.fire('layeradd', {layer: layer});
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function () {
		return this.getPixelOrigin().subtract(this._getMapPanePos());
	},

	_getNewTopLeftPoint: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		// TODO round on display, not calculation to increase precision?
		return this.project(center, zoom)._subtract(viewHalf)._round();
	},

	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
		return this.project(latlng, newZoom)._subtract(topLeft);
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),

		    dx = this._rebound(nwOffset.x, -seOffset.x),
		    dy = this._rebound(nwOffset.y, -seOffset.y);

		return new L.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom();

		return Math.max(min, Math.min(max, zoom));
	}
});

L.map = function (id, options) {
	return new L.Map(id, options);
};


/*
 * Mercator projection that takes into account that the Earth is not a perfect sphere.
 * Less popular than spherical mercator; used by projections like EPSG:3395.
 */

L.Projection.Mercator = {
	MAX_LATITUDE: 85.0840591556,

	R_MINOR: 6356752.314245179,
	R_MAJOR: 6378137,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    r = L.Projection.Mercator.R_MAJOR,
		    r2 = L.Projection.Mercator.R_MINOR,
		    x = latlng.lng * d * r,
		    y = lat * d,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1.0 - tmp * tmp),
		    con = eccent * Math.sin(y);

		con = Math.pow((1 - con) / (1 + con), eccent * 0.5);

		var ts = Math.tan(0.5 * ((Math.PI * 0.5) - y)) / con;
		y = -r * Math.log(ts);

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    r = L.Projection.Mercator.R_MAJOR,
		    r2 = L.Projection.Mercator.R_MINOR,
		    lng = point.x * d / r,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1 - (tmp * tmp)),
		    ts = Math.exp(- point.y / r),
		    phi = (Math.PI / 2) - 2 * Math.atan(ts),
		    numIter = 15,
		    tol = 1e-7,
		    i = numIter,
		    dphi = 0.1,
		    con;

		while ((Math.abs(dphi) > tol) && (--i > 0)) {
			con = eccent * Math.sin(phi);
			dphi = (Math.PI / 2) - 2 * Math.atan(ts *
			            Math.pow((1.0 - con) / (1.0 + con), 0.5 * eccent)) - phi;
			phi += dphi;
		}

		return new L.LatLng(phi * d, lng);
	}
};

    /*
 * 解决室内数据编辑时，投影变换带来的误差问题
 * zs -20151112
 */
L.Projection.Mercator_ex = {
    MAX_LATITUDE: 85.0840591556,

    R_MINOR: 6356752.314245179,
    R_MAJOR: 6378137,

    project: function (latlng) { // (LatLng) -> Point
        return new L.Point(latlng.lat, latlng.lng);
    },

    unproject: function (point) { // (Point, Boolean) -> LatLng
        return new L.LatLng(point.x, point.y);
    }
};

L.CRS.EPSG3395 = L.extend({}, L.CRS, {
	code: 'EPSG:3395',

	projection: L.Projection.Mercator_ex,//zs

	transformation: (function () {
		var m = L.Projection.Mercator,
		    r = m.R_MAJOR,
		    scale = 0.5 / (Math.PI * r);

		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});


/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.TileLayer = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: L.Browser.mobile,
		updateWhenIdle: L.Browser.mobile
	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = L.latLngBounds(options.bounds);
		}

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		this._container.parentNode.removeChild(this._container);

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (L.Browser.ielt9) {
			for (i in tiles) {
				L.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			L.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_initContainer: function () {
		var tilePane = this._map._panes.tilePane;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-layer');

			this._updateZIndex();

			if (this._animated) {
				var className = 'leaflet-tile-container';

				this._bgBuffer = L.DomUtil.create('div', className, this._container);
				this._tileContainer = L.DomUtil.create('div', className, this._container);

			} else {
				this._tileContainer = this._container;
			}

			tilePane.appendChild(this._container);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_reset: function (e) {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = L.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new L.Point(i, j);

				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (!options.continuousWorld) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			L.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!L.Browser.android) {
			tile.onload = null;
			tile.src = L.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		return tilePoint.multiplyBy(tileSize).subtract(origin);
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (tilePoint) {
		return L.Util.template(this._url, L.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = L.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		if (L.Browser.ielt9 && this.options.opacity !== undefined) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(tilePoint);

		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			L.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== L.Util.emptyImageUrl) {
			L.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	}
});

L.tileLayer = function (url, options) {
	return new L.TileLayer(url, options);
};


/*
 * L.TileLayer.WMS is used for putting WMS tile layers on the map.
 */

L.TileLayer.WMS = L.TileLayer.extend({

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/jpeg',
		transparent: false
	},

	initialize: function (url, options) { // (String, Object)

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams),
		    tileSize = options.tileSize || this.options.tileSize;

		if (options.detectRetina && L.Browser.retina) {
			wmsParams.width = wmsParams.height = tileSize * 2;
		} else {
			wmsParams.width = wmsParams.height = tileSize;
		}

		for (var i in options) {
			// all keys that are not TileLayer options go to WMS params
			if (!this.options.hasOwnProperty(i) && i !== 'crs') {
				wmsParams[i] = options[i];
			}
		}

		this.wmsParams = wmsParams;

		L.setOptions(this, options);
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;

		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (tilePoint) { // (Point, Number) -> String

		var map = this._map,
		    tileSize = this.options.tileSize,

		    nwPoint = tilePoint.multiplyBy(tileSize),
		    sePoint = nwPoint.add([tileSize, tileSize]),

		    nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),
		    se = this._crs.project(map.unproject(sePoint, tilePoint.z)),
		    bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
		        [se.y, nw.x, nw.y, se.x].join(',') :
		        [nw.x, se.y, se.x, nw.y].join(','),

		    url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

		return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
	},

	setParams: function (params, noRedraw) {

		L.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});

L.tileLayer.wms = function (url, options) {
	return new L.TileLayer.WMS(url, options);
};


/*
 * L.TileLayer.Canvas is a class that you can use as a base for creating
 * dynamically drawn Canvas-based tile layers.
 */

L.TileLayer.Canvas = L.TileLayer.extend({
	options: {
		async: false
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}

		for (var i in this._tiles) {
			this._redrawTile(this._tiles[i]);
		}
		return this;
	},

	_redrawTile: function (tile) {
		this.drawTile(tile, tile._tilePoint, this._map._zoom);
	},

	_createTile: function () {
		var tile = L.DomUtil.create('canvas', 'leaflet-tile');
		tile.width = tile.height = this.options.tileSize;
		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	drawTile: function (/*tile, tilePoint*/) {
		// override with rendering code
	},

	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	}
});


L.tileLayer.canvas = function (options) {
	return new L.TileLayer.Canvas(options);
};


/*
 * L.ImageOverlay is used to overlay images over the map (to specific geographical bounds).
 */

L.ImageOverlay = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		opacity: 1
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._image) {
			this._initImage();
		}

		map._panes.overlayPane.appendChild(this._image);

		map.on('viewreset', this._reset, this);

		if (map.options.zoomAnimation && L.Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._reset();
	},

	onRemove: function (map) {
		map.getPanes().overlayPane.removeChild(this._image);

		map.off('viewreset', this._reset, this);

		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	setOpacity: function (opacity) {
	    this.options.opacity = opacity;


		this._updateOpacity();
		return this;
	},

	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path
	bringToFront: function () {
		if (this._image) {
			this._map._panes.overlayPane.appendChild(this._image);
		}
		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.overlayPane;
		if (this._image) {
			pane.insertBefore(this._image, pane.firstChild);
		}
		return this;
	},

	setUrl: function (url) {
		this._url = url;
		this._image.src = this._url;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	_initImage: function () {
		this._image = L.DomUtil.create('img', 'leaflet-image-layer');

		if (this._map.options.zoomAnimation && L.Browser.any3d) {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		L.extend(this._image, {
			galleryimg: 'no',
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onImageLoad, this),
			src: this._url
		});
	},

	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

		image.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},

	_reset: function () {
		var image   = this._image,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);

		L.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_onImageLoad: function () {
		this.fire('load');
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

L.imageOverlay = function (url, bounds, options) {
	return new L.ImageOverlay(url, bounds, options);
};


/*
 * L.Icon is an image-based icon class that you can use with L.Marker for custom markers.
 */

L.Icon = L.Class.extend({
	options: {
		/*
		iconUrl: (String) (required)
		iconRetinaUrl: (String) (optional, used for retina devices if detected)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowRetinaUrl: (String) (optional, used for retina devices if detected)
		shadowSize: (Point)
		shadowAnchor: (Point)
		*/
		className: ''
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img;
		if (!oldIcon || oldIcon.tagName !== 'IMG') {
			img = this._createImg(src);
		} else {
			img = this._createImg(src, oldIcon);
		}
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options,
		    size = L.point(options[name + 'Size']),
		    anchor;

		if (name === 'shadow') {
			anchor = L.point(options.shadowAnchor || options.iconAnchor);
		} else {
			anchor = L.point(options.iconAnchor);
		}

		if (!anchor && size) {
			anchor = size.divideBy(2, true);
		}

		img.className = 'leaflet-marker-' + name + ' ' + options.className;

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		if (L.Browser.retina && this.options[name + 'RetinaUrl']) {
			return this.options[name + 'RetinaUrl'];
		}
		return this.options[name + 'Url'];
	}
});

L.icon = function (options) {
	return new L.Icon(options);
};


/*
 * L.Icon.Default is the blue marker icon used by default in Leaflet.
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (L.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = L.Icon.Default.imagePath;

		if (!path) {
			throw new Error('Couldn\'t autodetect L.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

L.Icon.Default.imagePath = (function () {
	var scripts = document.getElementsByTagName('script'),
	    leafletRe = /[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}());


/*
 * L.Marker is used to display clickable/draggable icons on the map.
 */

L.Marker = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		icon: new L.Icon.Default(),
		title: '',
		alt: '',
		clickable: true,
		draggable: false,
		keyboard: true,
		zIndexOffset: 0,
		opacity: 1,
		riseOnHover: false,
		riseOffset: 250
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	onAdd: function (map) {
		this._map = map;

		map.on('viewreset', this.update, this);

		this._initIcon();
		this.update();
		this.fire('add');

		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		if (this.dragging) {
			this.dragging.disable();
		}

		this._removeIcon();
		this._removeShadow();

		this.fire('remove');

		map.off({
			'viewreset': this.update,
			'zoomanim': this._animateZoom
		}, this);

		this._map = null;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);

		this.update();

		return this.fire('move', { latlng: this._latlng });
	},

	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		this.update();

		return this;
	},

	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup);
		}

		return this;
	},

	update: function () {
		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    map = this._map,
		    animation = (map.options.zoomAnimation && map.options.markerZoomAnimation),
		    classToAdd = animation ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide';

		var icon = options.icon.createIcon(this._icon),
			addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		this._initInteraction();

		if (options.riseOnHover) {
			L.DomEvent
				.on(icon, 'mouseover', this._bringToFront, this)
				.on(icon, 'mouseout', this._resetZIndex, this);
		}

		var newShadow = options.icon.createShadow(this._shadow),
			addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		var panes = this._map._panes;

		if (addIcon) {
			panes.markerPane.appendChild(this._icon);
		}

		if (newShadow && addShadow) {
			panes.shadowPane.appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			L.DomEvent
			    .off(this._icon, 'mouseover', this._bringToFront)
			    .off(this._icon, 'mouseout', this._resetZIndex);
		}

		this._map._panes.markerPane.removeChild(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			this._map._panes.shadowPane.removeChild(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.clickable) { return; }

		// TODO refactor into something shared with Map/Path/etc. to DRY it up

		var icon = this._icon,
		    events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.addClass(icon, 'leaflet-clickable');
		L.DomEvent.on(icon, 'click', this._onMouseClick, this);
		L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		}

		if (L.Handler.MarkerDrag) {
			this.dragging = new L.Handler.MarkerDrag(this);

			if (this.options.draggable) {
				this.dragging.enable();
			}
		}
	},

	_onMouseClick: function (e) {
		var wasDragged = this.dragging && this.dragging.moved();

		if (this.hasEventListeners(e.type) || wasDragged) {
			L.DomEvent.stopPropagation(e);
		}

		if (wasDragged) { return; }

		if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) { return; }

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});
	},

	_onKeyPress: function (e) {
		if (e.keyCode === 13) {
			this.fire('click', {
				originalEvent: e,
				latlng: this._latlng
			});
		}
	},

	_fireMouseEvent: function (e) {

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._icon, this.options.opacity);
		if (this._shadow) {
			L.DomUtil.setOpacity(this._shadow, this.options.opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	}
});

L.marker = function (latlng, options) {
	return new L.Marker(latlng, options);
};


/*
 * L.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based L.Icon)
 * to use with L.Marker.
 */

L.DivIcon = L.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		if (options.html !== false) {
			div.innerHTML = options.html;
		} else {
			div.innerHTML = '';
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
			        (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};


/*
 * L.Popup is used for displaying popups on the map.
 */

L.Map.mergeOptions({
	closePopupOnClick: true
});

L.Popup = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minWidth: 50,
		maxWidth: 300,
		// maxHeight: null,
		autoPan: true,
		closeButton: true,
		offset: [0, 7],
		autoPanPadding: [5, 5],
		// autoPanPaddingTopLeft: null,
		// autoPanPaddingBottomRight: null,
		keepInView: false,
		className: '',
		zoomAnimation: true
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
		this._animated = L.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initLayout();
		}

		var animFade = map.options.fadeAnimation;

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 0);
		}
		map._panes.popupPane.appendChild(this._container);

		map.on(this._getEvents(), this);

		this.update();

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 1);
		}

		this.fire('open');

		map.fire('popupopen', {popup: this});

		if (this._source) {
			this._source.fire('popupopen', {popup: this});
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onRemove: function (map) {
		map._panes.popupPane.removeChild(this._container);

		L.Util.falseFn(this._container.offsetWidth); // force reflow

		map.off(this._getEvents(), this);

		if (map.options.fadeAnimation) {
			L.DomUtil.setOpacity(this._container, 0);
		}

		this._map = null;

		this.fire('close');

		map.fire('popupclose', {popup: this});

		if (this._source) {
			this._source.fire('popupclose', {popup: this});
		}
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	getContent: function () {
		return this._content;
	},

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	_getEvents: function () {
		var events = {
			viewreset: this._updatePosition
		};

		if (this._animated) {
			events.zoomanim = this._zoomAnimation;
		}
		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +
			        (this._animated ? 'animated' : 'hide'),
			container = this._container = L.DomUtil.create('div', containerClass),
			closeButton;

		if (this.options.closeButton) {
			closeButton = this._closeButton =
			        L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';
			L.DomEvent.disableClickPropagation(closeButton);

			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper =
		        L.DomUtil.create('div', prefix + '-content-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);

		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);

		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateContent: function () {
		if (!this._content) { return; }

		if (typeof this._content === 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			while (this._contentNode.hasChildNodes()) {
				this._contentNode.removeChild(this._contentNode.firstChild);
			}
			this._contentNode.appendChild(this._content);
		}
		this.fire('contentupdate');
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    animated = this._animated,
		    offset = L.point(this.options.offset);

		if (animated) {
			L.DomUtil.setPosition(this._container, pos);
		}

		this._containerBottom = -offset.y - (animated ? 0 : pos.y);
		this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = this._containerBottom + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);

		L.DomUtil.setPosition(this._container, pos);
	},

	_adjustPan: function () {
		if (!this.options.autoPan) { return; }

		var map = this._map,
		    containerHeight = this._container.offsetHeight,
		    containerWidth = this._containerWidth,

		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

		if (this._animated) {
			layerPos._add(L.DomUtil.getPosition(this._container));
		}

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = L.point(this.options.autoPanPadding),
		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		L.DomEvent.stop(e);
	}
});

L.popup = function (options, source) {
	return new L.Popup(options, source);
};


L.Map.include({
	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])
		this.closePopup();

		if (!(popup instanceof L.Popup)) {
			var content = popup;

			popup = new L.Popup(options)
			    .setLatLng(latlng)
			    .setContent(content);
		}
		popup._isOpen = true;

		this._popup = popup;
		return this.addLayer(popup);
	},

	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
			popup._isOpen = false;
		}
		return this;
	}
});


/*
 * Popup extension to L.Marker, adding popup-related methods.
 */

L.Marker.include({
	openPopup: function () {
		if (this._popup && this._map && !this._map.hasLayer(this._popup)) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	togglePopup: function () {
		if (this._popup) {
			if (this._popup._isOpen) {
				this.closePopup();
			} else {
				this.openPopup();
			}
		}
		return this;
	},

	bindPopup: function (content, options) {
		var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]);

		anchor = anchor.add(L.Popup.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = L.extend({offset: anchor}, options);

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this.togglePopup, this)
			    .on('remove', this.closePopup, this)
			    .on('move', this._movePopup, this);
			this._popupHandlersAdded = true;
		}

		if (content instanceof L.Popup) {
			L.setOptions(content, options);
			this._popup = content;
		} else {
			this._popup = new L.Popup(options, this)
				.setContent(content);
		}

		return this;
	},

	setPopupContent: function (content) {
		if (this._popup) {
			this._popup.setContent(content);
		}
		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this.togglePopup, this)
			    .off('remove', this.closePopup, this)
			    .off('move', this._movePopup, this);
			this._popupHandlersAdded = false;
		}
		return this;
	},

	getPopup: function () {
		return this._popup;
	},

	_movePopup: function (e) {
		this._popup.setLatLng(e.latlng);
	}
});


/*
 * L.LayerGroup is a class to combine several layers into one so that
 * you can manipulate the group (e.g. add/remove it) as one layer.
 */

L.LayerGroup = L.Class.extend({
	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	clearLayers: function () {
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		this._map = map;
		this.eachLayer(map.addLayer, map);
	},

	onRemove: function (map) {
		this.eachLayer(map.removeLayer, map);
		this._map = null;
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	getLayer: function (id) {
		return this._layers[id];
	},

	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	getLayerId: function (layer) {
		return L.stamp(layer);
	}
});

L.layerGroup = function (layers) {
	return new L.LayerGroup(layers);
};


/*
 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and additional methods
 * shared between a group of interactive layers (like vectors or markers).
 */

L.FeatureGroup = L.LayerGroup.extend({
	includes: L.Mixin.Events,

	statics: {
		EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose'
	},

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		if ('on' in layer) {
			layer.on(L.FeatureGroup.EVENTS, this._propagateEvent, this);
		}

		L.LayerGroup.prototype.addLayer.call(this, layer);

		if (this._popupContent && layer.bindPopup) {
			layer.bindPopup(this._popupContent, this._popupOptions);
		}

		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.off(L.FeatureGroup.EVENTS, this._propagateEvent, this);

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		if (this._popupContent) {
			this.invoke('unbindPopup');
		}

		return this.fire('layerremove', {layer: layer});
	},

	bindPopup: function (content, options) {
		this._popupContent = content;
		this._popupOptions = options;
		return this.invoke('bindPopup', content, options);
	},

	openPopup: function (latlng) {
		// open popup on the first layer
		for (var id in this._layers) {
			this._layers[id].openPopup(latlng);
			break;
		}
		return this;
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new L.LatLngBounds();

		this.eachLayer(function (layer) {
			bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());
		});

		return bounds;
	},

	_propagateEvent: function (e) {
		e = L.extend({
			layer: e.target,
			target: this
		}, e);
		this.fire(e.type, e);
	}
});

L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};


/*
 * L.Path is a base class for rendering vector paths on a map. Inherited by Polyline, Circle, etc.
 */

L.Path = L.Class.extend({
	includes: [L.Mixin.Events],

	statics: {
		// how much to extend the clip area around the map view
		// (relative to its size, e.g. 0.5 is half the screen in each direction)
		// set it so that SVG element doesn't exceed 1280px (vectors flicker on dragend if it is)
		CLIP_PADDING: (function () {
			var max = L.Browser.mobile ? 1280 : 2000,
			    target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;
			return Math.max(0, Math.min(0.5, target));
		})()
	},

	options: {
		stroke: true,
		color: '#0033ff',
		dashArray: null,
		lineCap: null,
		lineJoin: null,
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2,

		clickable: true
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function (map) {
	    this._map = map;

	    if (!this._container) {
	        this._initElements();
	        this._initEvents();
	    }

	    this.projectLatlngs();
	    this._updatePath();

	    if (this._container) {
	        this._map._pathRoot.appendChild(this._container);
	    }

	    this.fire('add');

	    map.on({
	        'viewreset': this.projectLatlngs,
	        'moveend': this._updatePath
	    }, this);
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		map._pathRoot.removeChild(this._container);

		// Need to fire remove event before we set _map to null as the event hooks might need the object
		this.fire('remove');
		this._map = null;

		if (L.Browser.vml) {
			this._container = null;
			this._stroke = null;
			this._fill = null;
		}

		map.off({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	projectLatlngs: function () {
		// do all projection stuff here
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._container) {
			this._updateStyle();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._updatePath();
		}
		return this;
	}
});

L.Map.include({
    //ZS Draw More Screen Size
    _drawMoreRatio:1,

    setDrawMoreScreenRatio: function (ratio) {
        this._drawMoreRatio = ratio;
    },

    _updatePathViewport: function () {
        var p = L.Path.CLIP_PADDING,
		    size = this.getSize(),
		    panePos = L.DomUtil.getPosition(this._mapPane),
		    min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()),
		    max = min.add(size.multiplyBy(1 + p * 2)._round());
        //ZS Draw More Screen Size
        min = new L.Point(min.x - (size.x * this._drawMoreRatio), min.y - (size.y * this._drawMoreRatio));
        max = new L.Point(max.x + (size.x * this._drawMoreRatio), max.y + (size.y * this._drawMoreRatio));
        this._pathViewport = new L.Bounds(min, max);
    }
});


/*
 * Extends L.Path with SVG-specific rendering code.
 */

L.Path.SVG_NS = 'http://www.w3.org/2000/svg';

L.Browser.svg = !!(document.createElementNS && document.createElementNS(L.Path.SVG_NS, 'svg').createSVGRect);

L.Path = L.Path.extend({
	statics: {
		SVG: L.Browser.svg
	},

	bringToFront: function () {
		var root = this._map._pathRoot,
		    path = this._container;

		if (path && root.lastChild !== path) {
			root.appendChild(path);
		}
		return this;
	},

	bringToBack: function () {
		var root = this._map._pathRoot,
		    path = this._container,
		    first = root.firstChild;

		if (path && first !== path) {
			root.insertBefore(path, first);
		}
		return this;
	},

	getPathString: function () {
		// form path string here
	},

	_createElement: function (name) {
		return document.createElementNS(L.Path.SVG_NS, name);
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._initPath();
		this._initStyle();
	},

	_initPath: function () {
		this._container = this._createElement('g');

		this._path = this._createElement('path');

		if (this.options.className) {
			L.DomUtil.addClass(this._path, this.options.className);
		}

		this._container.appendChild(this._path);
	},

	_initStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke-linejoin', 'round');
			this._path.setAttribute('stroke-linecap', 'round');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill-rule', 'evenodd');
		}
		if (this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', this.options.pointerEvents);
		}
		if (!this.options.clickable && !this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', 'none');
		}
		this._updateStyle();
	},

	_updateStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke', this.options.color);
			this._path.setAttribute('stroke-opacity', this.options.opacity);
			this._path.setAttribute('stroke-width', this.options.weight);
			if (this.options.dashArray) {
				this._path.setAttribute('stroke-dasharray', this.options.dashArray);
			} else {
				this._path.removeAttribute('stroke-dasharray');
			}
			if (this.options.lineCap) {
				this._path.setAttribute('stroke-linecap', this.options.lineCap);
			}
			if (this.options.lineJoin) {
				this._path.setAttribute('stroke-linejoin', this.options.lineJoin);
			}
		} else {
			this._path.setAttribute('stroke', 'none');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill', this.options.fillColor || this.options.color);
			this._path.setAttribute('fill-opacity', this.options.fillOpacity);
		} else {
			this._path.setAttribute('fill', 'none');
		}
	},
    
	_pathLastZoom:null,

	_updatePath: function () {
		var str = this.getPathString();
		if (!str) {
			// fix webkit empty string parsing bug
			str = 'M0 0';
		}
		this._path.setAttribute('d', str);

		this._pathString = str;
		this._pathLastZoom = this._map._zoom;
	},

	// TODO remove duplication with L.Map
	_initEvents: function () {
		if (this.options.clickable) {
			if (L.Browser.svg || !L.Browser.vml) {
				L.DomUtil.addClass(this._path, 'leaflet-clickable');
			}

			L.DomEvent.on(this._container, 'click', this._onMouseClick, this);

			var events = ['dblclick', 'mousedown', 'mouseover',
			              'mouseout', 'mousemove', 'contextmenu'];
			for (var i = 0; i < events.length; i++) {
				L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
			}
		}
	},

	_onMouseClick: function (e) {
		if (this._map.dragging && this._map.dragging.moved()) { return; }

		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this.hasEventListeners(e.type)) { return; }

		var map = this._map,
		    containerPoint = map.mouseEventToContainerPoint(e),
		    layerPoint = map.containerPointToLayerPoint(containerPoint),
		    latlng = map.layerPointToLatLng(layerPoint);

		this.fire(e.type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});

		if (e.type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousemove') {
			L.DomEvent.stopPropagation(e);
		}
	}
});

L.Map.include({
	_initPathRoot: function () {
		if (!this._pathRoot) {
			this._pathRoot = L.Path.prototype._createElement('svg');
			this._panes.overlayPane.appendChild(this._pathRoot);

			if (this.options.zoomAnimation && L.Browser.any3d) {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-animated');

				this.on({
					'zoomanim': this._animatePathZoom,
					'zoomend': this._endPathZoom
				});
			} else {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-hide');
			}

			this.on('moveend', this._updateSvgViewport);
			this._updateSvgViewport();
		}
	},

	_animatePathZoom: function (e) {
		var scale = this.getZoomScale(e.zoom),//ZS
		    offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);

		this._pathRoot.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';

		this._pathZooming = true;
	},

	_endPathZoom: function () {
		this._pathZooming = false;
	},

	_updateSvgViewport: function () {

		if (this._pathZooming) {
			// Do not update SVGs while a zoom animation is going on otherwise the animation will break.
			// When the zoom animation ends we will be updated again anyway
			// This fixes the case where you do a momentum move and zoom while the move is still ongoing.
			return;
		}

		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    max = vp.max,
		    width = max.x - min.x,
		    height = max.y - min.y,
		    root = this._pathRoot,
		    pane = this._panes.overlayPane;

		// Hack to make flicker on drag end on mobile webkit less irritating
		if (L.Browser.mobileWebkit) {
			pane.removeChild(root);
		}

		L.DomUtil.setPosition(root, min);

		root.setAttribute('width', width);
		root.setAttribute('height', height);
		root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));

		if (L.Browser.mobileWebkit) {
			pane.appendChild(root);
		}
	}
});


/*
 * Popup extension to L.Path (polylines, polygons, circles), adding popup-related methods.
 */

L.Path.include({

	bindPopup: function (content, options) {

		if (content instanceof L.Popup) {
			this._popup = content;
		} else {
			if (!this._popup || options) {
				this._popup = new L.Popup(options, this);
			}
			this._popup.setContent(content);
		}

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this._openPopup, this)
			    .on('remove', this.closePopup, this);

			this._popupHandlersAdded = true;
		}

		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this._openPopup)
			    .off('remove', this.closePopup);

			this._popupHandlersAdded = false;
		}
		return this;
	},

	openPopup: function (latlng) {

		if (this._popup) {
			// open the popup from one of the path's points if not specified
			latlng = latlng || this._latlng ||
			         this._latlngs[Math.floor(this._latlngs.length / 2)];

			this._openPopup({latlng: latlng});
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	_openPopup: function (e) {
		this._popup.setLatLng(e.latlng);
		this._map.openPopup(this._popup);
	}
});


/*
 * Vector rendering for IE6-8 through VML.
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

L.Browser.vml = !L.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

L.Path = L.Browser.svg || !L.Browser.vml ? L.Path : L.Path.extend({
	statics: {
		VML: true,
		CLIP_PADDING: 0.02
	},

	_createElement: (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement(
				        '<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	}()),

	_initPath: function () {
		var container = this._container = this._createElement('shape');

		L.DomUtil.addClass(container, 'leaflet-vml-shape' +
			(this.options.className ? ' ' + this.options.className : ''));

		if (this.options.clickable) {
			L.DomUtil.addClass(container, 'leaflet-clickable');
		}

		container.coordsize = '1 1';

		this._path = this._createElement('path');
		container.appendChild(this._path);

		this._map._pathRoot.appendChild(container);
	},

	_initStyle: function () {
		this._updateStyle();
	},

	_updateStyle: function () {
		var stroke = this._stroke,
		    fill = this._fill,
		    options = this.options,
		    container = this._container;

		container.stroked = options.stroke;
		container.filled = options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = this._stroke = this._createElement('stroke');
				stroke.endcap = 'round';
				container.appendChild(stroke);
			}
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = L.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			if (options.lineCap) {
				stroke.endcap = options.lineCap.replace('butt', 'flat');
			}
			if (options.lineJoin) {
				stroke.joinstyle = options.lineJoin;
			}

		} else if (stroke) {
			container.removeChild(stroke);
			this._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = this._fill = this._createElement('fill');
				container.appendChild(fill);
			}
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			this._fill = null;
		}
	},

	_updatePath: function () {
		var style = this._container.style;

		style.display = 'none';
		this._path.v = this.getPathString() + ' '; // the space fixes IE empty path string bug
		style.display = '';
	}
});

L.Map.include(L.Browser.svg || !L.Browser.vml ? {} : {
	_initPathRoot: function () {
		if (this._pathRoot) { return; }

		var root = this._pathRoot = document.createElement('div');
		root.className = 'leaflet-vml-container';
		this._panes.overlayPane.appendChild(root);

		this.on('moveend', this._updatePathViewport);
		this._updatePathViewport();
	}
});


/*
 * Vector rendering for all browsers that support canvas.
 */

L.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

L.Path = (L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? L.Path : L.Path.extend({
	statics: {
		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value
		CANVAS: true,
		SVG: false
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._requestUpdate();
		}
		return this;
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._map) {
			this._updateStyle();
			this._requestUpdate();
		}
		return this;
	},

	onRemove: function (map) {
		map
		    .off('viewreset', this.projectLatlngs, this)
		    .off('moveend', this._updatePath, this);

		if (this.options.clickable) {
			this._map.off('click', this._onClick, this);
			this._map.off('mousemove', this._onMouseMove, this);
		}

		this._requestUpdate();

		this._map = null;
	},

	_requestUpdate: function () {
		if (this._map && !L.Path._updateRequest) {
			L.Path._updateRequest = L.Util.requestAnimFrame(this._fireMapMoveEnd, this._map);
		}
	},

	_fireMapMoveEnd: function () {
		L.Path._updateRequest = null;
		this.fire('moveend');
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._ctx = this._map._canvasCtx;
	},

	_updateStyle: function () {
		var options = this.options;

		if (options.stroke) {
			this._ctx.lineWidth = options.weight;
			this._ctx.strokeStyle = options.color;
		}
		if (options.fill) {
			this._ctx.fillStyle = options.fillColor || options.color;
		}
	},

	_drawPath: function () {
		var i, j, len, len2, point, drawMethod;

		this._ctx.beginPath();

		for (i = 0, len = this._parts.length; i < len; i++) {
			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
				point = this._parts[i][j];
				drawMethod = (j === 0 ? 'move' : 'line') + 'To';

				this._ctx[drawMethod](point.x, point.y);
			}
			// TODO refactor ugly hack
			if (this instanceof L.Polygon) {
				this._ctx.closePath();
			}
		}
	},

	_checkIfEmpty: function () {
		return !this._parts.length;
	},

	_updatePath: function () {
		if (this._checkIfEmpty()) { return; }

		var ctx = this._ctx,
		    options = this.options;

		this._drawPath();
		ctx.save();
		this._updateStyle();

		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fill();
		}

		if (options.stroke) {
			ctx.globalAlpha = options.opacity;
			ctx.stroke();
		}

		ctx.restore();

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_initEvents: function () {
		if (this.options.clickable) {
			// TODO dblclick
			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onClick, this);
		}
	},

	_onClick: function (e) {
		if (this._containsPoint(e.layerPoint)) {
			this.fire('click', e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) { return; }

		// TODO don't do on each move
		if (this._containsPoint(e.layerPoint)) {
			this._ctx.canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);

		} else if (this._mouseInside) {
			this._ctx.canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	}
});

L.Map.include((L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? {} : {
	_initPathRoot: function () {
		var root = this._pathRoot,
		    ctx;

		if (!root) {
			root = this._pathRoot = document.createElement('canvas');
			root.style.position = 'absolute';
			ctx = this._canvasCtx = root.getContext('2d');

			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			this._panes.overlayPane.appendChild(root);

			if (this.options.zoomAnimation) {
				this._pathRoot.className = 'leaflet-zoom-animated';
				this.on('zoomanim', this._animatePathZoom);
				this.on('zoomend', this._endPathZoom);
			}
			this.on('moveend', this._updateCanvasViewport);
			this._updateCanvasViewport();
		}
	},

	_updateCanvasViewport: function () {
		// don't redraw while zooming. See _updateSvgViewport for more details
		if (this._pathZooming) { return; }
		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    size = vp.max.subtract(min),
		    root = this._pathRoot;

		//TODO check if this works properly on mobile webkit
		L.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	}
});


/*
 * L.LineUtil contains different utility functions for line segments
 * and polylines (clipping, simplification, distances, etc.)
 */

/*jshint bitwise:false */ // allow bitwise operations for this file

L.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	simplify: function (/*Point[]*/ points, /*Number*/ tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// distance from a point to a segment between two points
	pointToSegmentDistance:  function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	closestPointOnSegment: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},

	// Cohen-Sutherland line clipping algorithm.
	// Used to avoid rendering parts of a polyline that are not currently visible.

	clipSegment: function (a, b, bounds, useLastCode) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			// if a,b is outside the clip window (trivial reject)
			} else if (codeA & codeB) {
				return false;
			// other cases
			} else {
				codeOut = codeA || codeB;
				p = this._getEdgeIntersection(a, b, codeOut, bounds);
				newCode = this._getBitCode(p, bounds);

				if (codeOut === codeA) {
					a = p;
					codeA = newCode;
				} else {
					b = p;
					codeB = newCode;
				}
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max;

		if (code & 8) { // top
			return new L.Point(a.x + dx * (max.y - a.y) / dy, max.y);
		} else if (code & 4) { // bottom
			return new L.Point(a.x + dx * (min.y - a.y) / dy, min.y);
		} else if (code & 2) { // right
			return new L.Point(max.x, a.y + dy * (max.x - a.x) / dx);
		} else if (code & 1) { // left
			return new L.Point(min.x, a.y + dy * (min.x - a.x) / dx);
		}
	},

	_getBitCode: function (/*Point*/ p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}
		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
	}
};


/*
 * L.Polyline is used to display polylines on a map.
 */

L.Polyline = L.Path.extend({
	initialize: function (latlngs, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlngs = this._convertLatLngs(latlngs);
	},

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0,//ZS
		noClip: true //ZS
	},

	projectLatlngs: function () {
		this._originalPoints = [];

		for (var i = 0, len = this._latlngs.length; i < len; i++) {
			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
		}
	},

    getPathString: function () {
        for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
            str += this._getPathPartStr(this._parts[i]);
        }
        return str;
    },

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._latlngs = this._convertLatLngs(latlngs);
		return this.redraw();
	},

	addLatLng: function (latlng) {
		this._latlngs.push(L.latLng(latlng));
		return this.redraw();
	},

	spliceLatLngs: function () { // (Number index, Number howMany)
		var removed = [].splice.apply(this._latlngs, arguments);
		this._convertLatLngs(this._latlngs, true);
		this.redraw();
		return removed;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;

		for (var j = 0, jLen = parts.length; j < jLen; j++) {
			var points = parts[j];
			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];
				var sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = L.LineUtil._sqClosestPointOnSegment(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	getBounds: function () {
		return new L.LatLngBounds(this.getLatLngs());
	},

	_convertLatLngs: function (latlngs, overwrite) {
		var i, len, target = overwrite ? latlngs : [];

		for (i = 0, len = latlngs.length; i < len; i++) {
			if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
				return;
			}
			target[i] = L.latLng(latlngs[i]);
		}
		return target;
	},

	_initEvents: function () {
		L.Path.prototype._initEvents.call(this);
	},

	_getPathPartStr: function (points) {
		var round = L.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
		}
		return str;
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    len = points.length,
		    i, k, segment;

		if (this.options.noClip) {
			this._parts = [points];
			return;
		}

		this._parts = [];

		var parts = this._parts,
		    vp = this._map._pathViewport,
		    lu = L.LineUtil;

		for (i = 0, k = 0; i < len - 1; i++) {
			segment = lu.clipSegment(points[i], points[i + 1], vp, i);
			if (!segment) {
				continue;
			}

			parts[k] = parts[k] || [];
			parts[k].push(segment[0]);

			// if segment goes out of screen, or it's the last one, it's the end of the line part
			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {
				parts[k].push(segment[1]);
				k++;
			}
		}
	},

	// simplify each clipped part of the polyline
	_simplifyPoints: function () {
		var parts = this._parts,
		    lu = L.LineUtil;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = lu.simplify(parts[i], this.options.smoothFactor);
		}
	},

	_updatePath: function () {
	    if (!this._map) { return; }
	    this._clipPoints();
	    //ZS note efficiency optimization
	    //this._simplifyPoints();

	    L.Path.prototype._updatePath.call(this);
	}
});

L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};


/*
 * L.PolyUtil contains utility functions for polygons (clipping, etc.).
 */

/*jshint bitwise:false */ // allow bitwise operations here

L.PolyUtil = {};

/*
 * Sutherland-Hodgeman polygon clipping algorithm.
 * Used to avoid rendering parts of a polygon that are not currently visible.
 */
L.PolyUtil.clipPolygon = function (points, bounds) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = L.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};


/*
 * L.Polygon is used to display polygons on a map.
 */

L.Polygon = L.Polyline.extend({
	options: {
		fill: true
	},

	initialize: function (latlngs, options) {
		L.Polyline.prototype.initialize.call(this, latlngs, options);
		this._initWithHoles(latlngs);
	},

	_initWithHoles: function (latlngs) {
		var i, len, hole;
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._latlngs = this._convertLatLngs(latlngs[0]);
			this._holes = latlngs.slice(1);

			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
				if (hole[0].equals(hole[hole.length - 1])) {
					hole.pop();
				}
			}
		}

		// filter out last point if its equal to the first one
		latlngs = this._latlngs;

		if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {
			latlngs.pop();
		}
	},

	projectLatlngs: function () {
		L.Polyline.prototype.projectLatlngs.call(this);

		// project polygon holes points
		// TODO move this logic to Polyline to get rid of duplication
		this._holePoints = [];

		if (!this._holes) { return; }

		var i, j, len, len2;

		for (i = 0, len = this._holes.length; i < len; i++) {
			this._holePoints[i] = [];

			for (j = 0, len2 = this._holes[i].length; j < len2; j++) {
				this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
			}
		}
	},

	setLatLngs: function (latlngs) {
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._initWithHoles(latlngs);
			return this.redraw();
		} else {
			return L.Polyline.prototype.setLatLngs.call(this, latlngs);
		}
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    newParts = [];

		this._parts = [points].concat(this._holePoints);

		if (this.options.noClip) { return; }

		for (var i = 0, len = this._parts.length; i < len; i++) {
			var clipped = L.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);
			if (clipped.length) {
				newParts.push(clipped);
			}
		}
		this._parts = newParts;
	},

	_getPathPartStr: function (points) {
		var str = L.Polyline.prototype._getPathPartStr.call(this, points);
		return str + (L.Browser.svg ? 'z' : 'x');
	}
});

L.polygon = function (latlngs, options) {
	return new L.Polygon(latlngs, options);
};


/*
 * Contains L.MultiPolyline and L.MultiPolygon layers.
 */

(function () {
	function createMulti(Klass) {

		return L.FeatureGroup.extend({

			initialize: function (latlngs, options) {
				this._layers = {};
				this._options = options;
				this.setLatLngs(latlngs);
			},

			setLatLngs: function (latlngs) {
				var i = 0,
				    len = latlngs.length;

				this.eachLayer(function (layer) {
					if (i < len) {
						layer.setLatLngs(latlngs[i++]);
					} else {
						this.removeLayer(layer);
					}
				}, this);

				while (i < len) {
					this.addLayer(new Klass(latlngs[i++], this._options));
				}

				return this;
			},

			getLatLngs: function () {
				var latlngs = [];

				this.eachLayer(function (layer) {
					latlngs.push(layer.getLatLngs());
				});

				return latlngs;
			}
		});
	}

	L.MultiPolyline = createMulti(L.Polyline);
	L.MultiPolygon = createMulti(L.Polygon);

	L.multiPolyline = function (latlngs, options) {
		return new L.MultiPolyline(latlngs, options);
	};

	L.multiPolygon = function (latlngs, options) {
		return new L.MultiPolygon(latlngs, options);
	};
}());


/*
 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

L.Rectangle = L.Polygon.extend({
	initialize: function (latLngBounds, options) {
		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	setBounds: function (latLngBounds) {
		this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = L.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});

L.rectangle = function (latLngBounds, options) {
	return new L.Rectangle(latLngBounds, options);
};


/*
 * L.Circle is a circle overlay (with a certain radius in meters).
 */

L.Circle = L.Path.extend({
	initialize: function (latlng, radius, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlng = L.latLng(latlng);
		this._mRadius = radius;
	},

	options: {
		fill: true
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		return this.redraw();
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	projectLatlngs: function () {
		var lngRadius = this._getLngRadius(),
		    latlng = this._latlng,
		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);

		this._point = this._map.latLngToLayerPoint(latlng);
		this._radius = Math.max(this._point.x - pointLeft.x, 1);
	},

	getBounds: function () {
		var lngRadius = this._getLngRadius(),
		    latRadius = (this._mRadius / 40075017) * 360,
		    latlng = this._latlng;

		return new L.LatLngBounds(
		        [latlng.lat - latRadius, latlng.lng - lngRadius],
		        [latlng.lat + latRadius, latlng.lng + lngRadius]);
	},

	getLatLng: function () {
		return this._latlng;
	},

	getPathString: function () {
		var p = this._point,
		    r = this._radius;

		if (this._checkIfEmpty()) {
			return '';
		}

		if (L.Browser.svg) {
			return 'M' + p.x + ',' + (p.y - r) +
			       'A' + r + ',' + r + ',0,1,1,' +
			       (p.x - 0.1) + ',' + (p.y - r) + ' z';
		} else {
			p._round();
			r = Math.round(r);
			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);
		}
	},

	getRadius: function () {
		return this._mRadius;
	},

	// TODO Earth hardcoded, move into projection code!

	_getLatRadius: function () {
		return (this._mRadius / 40075017) * 360;
	},

	_getLngRadius: function () {
		return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);
	},

	_checkIfEmpty: function () {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	}
});

L.circle = function (latlng, radius, options) {
	return new L.Circle(latlng, radius, options);
};


/*
 * L.CircleMarker is a circle overlay with a permanent pixel radius.
 */

L.CircleMarker = L.Circle.extend({
	options: {
		radius: 10,
		weight: 2
	},

	initialize: function (latlng, options) {
		L.Circle.prototype.initialize.call(this, latlng, null, options);
		this._radius = this.options.radius;
	},

	projectLatlngs: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
	},

	_updateStyle : function () {
		L.Circle.prototype._updateStyle.call(this);
		this.setRadius(this.options.radius);
	},

	setLatLng: function (latlng) {
		L.Circle.prototype.setLatLng.call(this, latlng);
		if (this._popup && this._popup._isOpen) {
			this._popup.setLatLng(latlng);
		}
		return this;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	}
});

L.circleMarker = function (latlng, options) {
	return new L.CircleMarker(latlng, options);
};


/*
 * Extends L.Polyline to be able to manually detect clicks on Canvas-rendered polylines.
 */

L.Polyline.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p, closed) {
		var i, j, k, len, len2, dist, part,
		    w = this.options.weight / 2;

		if (L.Browser.touch) {
			w += 10; // polyline click tolerance on touch devices
		}

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				if (!closed && (j === 0)) {
					continue;
				}

				dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);

				if (dist <= w) {
					return true;
				}
			}
		}
		return false;
	}
});


/*
 * Extends L.Polygon to be able to manually detect clicks on Canvas-rendered polygons.
 */

L.Polygon.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p) {
		var inside = false,
		    part, p1, p2,
		    i, j, k,
		    len, len2;

		// TODO optimization: check if within bounds first

		if (L.Polyline.prototype._containsPoint.call(this, p, true)) {
			// click on polygon border
			return true;
		}

		// ray casting algorithm for detecting if point is in polygon

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];

			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				p1 = part[j];
				p2 = part[k];

				if (((p1.y > p.y) !== (p2.y > p.y)) &&
						(p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
					inside = !inside;
				}
			}
		}

		return inside;
	}
});


/*
 * Extends L.Circle with Canvas-specific code.
 */

L.Circle.include(!L.Path.CANVAS ? {} : {
	_drawPath: function () {
		var p = this._point;
		this._ctx.beginPath();
		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
	},

	_containsPoint: function (p) {
		var center = this._point,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;

		return (p.distanceTo(center) <= this._radius + w2);
	}
});


/*
 * CircleMarker canvas specific drawing parts.
 */

L.CircleMarker.include(!L.Path.CANVAS ? {} : {
	_updateStyle: function () {
		L.Path.prototype._updateStyle.call(this);
	}
});


/*
 * L.GeoJSON turns any GeoJSON data into a Leaflet layer.
 */

L.GeoJSON = L.FeatureGroup.extend({

	initialize: function (geojson, options) {
		L.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// Only add this if geometry or geometries are set and not null
				feature = features[i];
				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
					this.addData(features[i]);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return; }

		var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);
		layer.feature = L.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	resetStyle: function (layer) {
		var style = this.options.style;
		if (style) {
			// reset any custom styles
			L.Util.extend(layer.options, layer.defaultOptions);

			this._setLayerStyle(layer, style);
		}
	},

	setStyle: function (style) {
		this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

L.extend(L.GeoJSON, {
	geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry.coordinates,
		    layers = [],
		    latlng, latlngs, i, len;

		coordsToLatLng = coordsToLatLng || this.coordsToLatLng;

		switch (geometry.type) {
		case 'Point':
			latlng = coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = coordsToLatLng(coords[i]);
				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
			}
			return new L.FeatureGroup(layers);

		case 'LineString':
			latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
			return new L.Polyline(latlngs, vectorOptions);

		case 'Polygon':
			if (coords.length === 2 && !coords[1].length) {
				throw new Error('Invalid GeoJSON object.');
			}
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.Polygon(latlngs, vectorOptions);

		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.MultiPolyline(latlngs, vectorOptions);

		case 'MultiPolygon':
			latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
			return new L.MultiPolygon(latlngs, vectorOptions);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {

				layers.push(this.geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, pointToLayer, coordsToLatLng, vectorOptions));
			}
			return new L.FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng
		return new L.LatLng(coords[1], coords[0], coords[2]);
	},

	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) { // (Array[, Number, Function]) -> Array
		var latlng, i, len,
		    latlngs = [];

		for (i = 0, len = coords.length; i < len; i++) {
			latlng = levelsDeep ?
			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	},

	latLngToCoords: function (latlng) {
		var coords = [latlng.lng, latlng.lat];

		if (latlng.alt !== undefined) {
			coords.push(latlng.alt);
		}
		return coords;
	},

	latLngsToCoords: function (latLngs) {
		var coords = [];

		for (var i = 0, len = latLngs.length; i < len; i++) {
			coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));
		}

		return coords;
	},

	getFeature: function (layer, newGeometry) {
		return layer.feature ? L.extend({}, layer.feature, {geometry: newGeometry}) : L.GeoJSON.asFeature(newGeometry);
	},

	asFeature: function (geoJSON) {
		if (geoJSON.type === 'Feature') {
			return geoJSON;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geoJSON
		};
	}
});

var PointToGeoJSON = {
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'Point',
			coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
		});
	}
};

L.Marker.include(PointToGeoJSON);
L.Circle.include(PointToGeoJSON);
L.CircleMarker.include(PointToGeoJSON);

L.Polyline.include({
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'LineString',
			coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())
		});
	}
});

L.Polygon.include({
	toGeoJSON: function () {
		var coords = [L.GeoJSON.latLngsToCoords(this.getLatLngs())],
		    i, len, hole;

		coords[0].push(coords[0][0]);

		if (this._holes) {
			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = L.GeoJSON.latLngsToCoords(this._holes[i]);
				hole.push(hole[0]);
				coords.push(hole);
			}
		}

		return L.GeoJSON.getFeature(this, {
			type: 'Polygon',
			coordinates: coords
		});
	}
});

(function () {
	function multiToGeoJSON(type) {
		return function () {
			var coords = [];

			this.eachLayer(function (layer) {
				coords.push(layer.toGeoJSON().geometry.coordinates);
			});

			return L.GeoJSON.getFeature(this, {
				type: type,
				coordinates: coords
			});
		};
	}

	L.MultiPolyline.include({toGeoJSON: multiToGeoJSON('MultiLineString')});
	L.MultiPolygon.include({toGeoJSON: multiToGeoJSON('MultiPolygon')});

	L.LayerGroup.include({
		toGeoJSON: function () {

			var geometry = this.feature && this.feature.geometry,
				jsons = [],
				json;

			if (geometry && geometry.type === 'MultiPoint') {
				return multiToGeoJSON('MultiPoint').call(this);
			}

			var isGeometryCollection = geometry && geometry.type === 'GeometryCollection';

			this.eachLayer(function (layer) {
				if (layer.toGeoJSON) {
					json = layer.toGeoJSON();
					jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
				}
			});

			if (isGeometryCollection) {
				return L.GeoJSON.getFeature(this, {
					geometries: jsons,
					type: 'GeometryCollection'
				});
			}

			return {
				type: 'FeatureCollection',
				features: jsons
			};
		}
	});
}());

L.geoJson = function (geojson, options) {
	return new L.GeoJSON(geojson, options);
};


/*
 * L.DomEvent contains functions for working with DOM events.
 */

L.DomEvent = {
	/* inspired by John Resig, Dean Edwards and YUI addEvent implementations */
	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler, originalHandler, newType;

		if (obj[key]) { return this; }

		handler = function (e) {
			return fn.call(context || obj, e || L.DomEvent._getEvent());
		};

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			return this.addPointerListener(obj, type, handler, id);
		}
       
		if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);
		}

		if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				originalHandler = handler;
				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

				handler = function (e) {
					if (!L.DomEvent._checkMouse(obj, e)) { return; }
					return originalHandler(e);
				};

				obj.addEventListener(newType, handler, false);

			} else if (type === 'click' && L.Browser.android) {
				originalHandler = handler;
				handler = function (e) {
					return L.DomEvent._filterClick(e, originalHandler);
				};

				obj.addEventListener(type, handler, false);
			} else {
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[key] = handler;

		return this;
	},

	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler = obj[key];

		if (!handler) { return this; }

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);
		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
			} else {
				obj.removeEventListener(type, handler, false);
			}
		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[key] = null;

		return this;
	},

	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
		L.DomEvent._skipped(e);

		return this;
	},

	disableScrollPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		return L.DomEvent
			.on(el, 'mousewheel', stop)
			.on(el, 'MozMousePixelScroll', stop);
	},

	disableClickPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(el, L.Draggable.START[i], stop);
		}

		return L.DomEvent
			.on(el, 'click', L.DomEvent._fakeStop)
			.on(el, 'dblclick', stop);
	},

	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	stop: function (e) {
		return L.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	getMousePosition: function (e, container) {
		if (!container) {
			return new L.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new L.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
		L.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_checkMouse: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	_getEvent: function () { // evil magic for IE
		/*jshint noarg:false */
		var e = window.event;
		if (!e) {
			var caller = arguments.callee.caller;
			while (caller) {
				e = caller['arguments'][0];
				if (e && window.Event === e.constructor) {
					break;
				}
				caller = caller.caller;
			}
		}
		return e;
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
			elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 1000ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 1000) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			//return;
			// song.yu
			// android touch click need wait 1s;
			return handler(e);
		}
		L.DomEvent._lastClick = timeStamp;

		return handler(e);
	}
};

L.DomEvent.on = L.DomEvent.addListener;
L.DomEvent.off = L.DomEvent.removeListener;


/*
 * L.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
 */

L.Draggable = L.Class.extend({
	includes: L.Mixin.Events,

	statics: {
		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	initialize: function (element, dragStartTarget) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
	},

	enable: function () {
		if (this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.off(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		this._moved = false;

		if (e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }

		L.DomEvent.stopPropagation(e);

		if (L.Draggable._disabled) { return; }

		L.DomUtil.disableImageDrag();
		L.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new L.Point(first.clientX, first.clientY);
		this._startPos = this._newPos = L.DomUtil.getPosition(this._element);

		L.DomEvent
		    .on(document, L.Draggable.MOVE[e.type], this._onMove, this)
		    .on(document, L.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new L.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }

		L.DomEvent.preventDefault(e);

		if (!this._moved) {
			this.fire('dragstart');

			this._moved = true;
			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

			L.DomUtil.addClass(document.body, 'leaflet-dragging');
			L.DomUtil.addClass((e.target || e.srcElement), 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
	},

	_updatePosition: function () {
		this.fire('predrag');
		L.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag');
	},

	_onUp: function (e) {
		L.DomUtil.removeClass(document.body, 'leaflet-dragging');
		L.DomUtil.removeClass((e.target || e.srcElement), 'leaflet-drag-target');

		for (var i in L.Draggable.MOVE) {
			L.DomEvent
			    .off(document, L.Draggable.MOVE[i], this._onMove)
			    .off(document, L.Draggable.END[i], this._onUp);
		}

		L.DomUtil.enableImageDrag();
		L.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			L.Util.cancelAnimFrame(this._animRequest);
			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
	}
});


/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});


/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

L.Map.mergeOptions({
	dragging: true,

	inertia: !L.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	inertiaThreshold: L.Browser.touch ? 32 : 18, // ms
	easeLinearity: 0.25,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				'dragstart': this._onDragStart,
				'drag': this._onDrag,
				'dragend': this._onDragEnd
			}, this);

			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDrag, this);
				map.on('viewreset', this._onViewReset, this);

				map.whenReady(this._onViewReset, this);
			}
		}
		this._draggable.enable();
	},

	removeHooks: function () {
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
	    var map = this._map;

		if (map._panAnim) {
			map._panAnim.stop();
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function () {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 200) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move')
		    .fire('drag');
	},

	_onViewReset: function () {
		// TODO fix hardcoded Earth values
		var pxCenter = this._map.getSize()._divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.project([0, 180]).x;
	},

	_onPreDrag: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
	    //ZS Test efficiency
	    var t1;
	    var t2;
	    t1 = new Date().getTime();

		var map = this._map,
		    options = map.options,
		    delay = +new Date() - this._lastTime,

		    noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime + delay - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x || !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true
					});
				});
			}
		}

		if (map._panAnim) {
		    map._panAnim.stop();
		}

	    //ZS Test efficiency
		t2 = new Date().getTime();
		debugTools ? $("#show .xy_text").html("<p>" + "平移结束后耗时:" + (t2 - t1) + "毫秒" + "</p>") : "";
	}
});

L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);


/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

L.Map.mergeOptions({
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);


/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

L.Map.mergeOptions({
	scrollWheelZoom: true
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);
		L.DomEvent.on(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll);
		L.DomEvent.off(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(40 - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.preventDefault(e);
		L.DomEvent.stopPropagation(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);


/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

L.extend(L.DomEvent, {

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last,
		    doubleTap = false,
		    delay = 250,
		    touch,
		    pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend,
		    trackedTouches = [];

		function onTouchStart(e) {
			var count;

			if (L.Browser.pointer) {
				trackedTouches.push(e.pointerId);
				count = trackedTouches.length;
			} else {
				count = e.touches.length;
			}
			if (count > 1) {
				return;
			}

			var now = Date.now(),
				delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd(e) {
			if (L.Browser.pointer) {
				var idx = trackedTouches.indexOf(e.pointerId);
				if (idx === -1) {
					return;
				}
				trackedTouches.splice(idx, 1);
			}

			if (doubleTap) {
				if (L.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = { },
						prop;

					// jshint forin:false
					for (var i in touch) {
						prop = touch[i];
						if (typeof prop === 'function') {
							newTouch[i] = prop.bind(touch);
						} else {
							newTouch[i] = prop;
						}
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}
		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;

		// on pointer we need to listen on the document, otherwise a drag starting on the map and moving off screen
		// will not come through to us, so we will lose track of how many touches are ongoing
		var endElement = L.Browser.pointer ? document.documentElement : obj;

		obj.addEventListener(touchstart, onTouchStart, false);
		endElement.addEventListener(touchend, onTouchEnd, false);

		if (L.Browser.pointer) {
			endElement.addEventListener(L.DomEvent.POINTER_CANCEL, onTouchEnd, false);
		}

		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_';

		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
		(L.Browser.pointer ? document.documentElement : obj).removeEventListener(
		        this._touchend, obj[pre + this._touchend + id], false);

		if (L.Browser.pointer) {
			document.documentElement.removeEventListener(L.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id],
				false);
		}

		return this;
	}
});


/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	//static
	POINTER_DOWN: L.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: L.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: L.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {

			L.DomEvent.preventDefault(e);

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

L.Map.mergeOptions({
	touchZoom: L.Browser.touch && !L.Browser.android23,
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
    lastscale: 1,
    lastzoom:1,
    addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]),
		    viewCenter = map._getCenterLayerPoint();

		this._startCenter = p1.add(p2)._divideBy(2);
		this._startDist = p1.distanceTo(p2);

		this._moved = false;
		this._zooming = true;

		this._centerOffset = viewCenter.subtract(this._startCenter);

		if (map._panAnim) {
			map._panAnim.stop();
		}

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]);

		this._scale = p1.distanceTo(p2) / this._startDist;
		this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);

		if (this._scale === 1) { return; }

        //ZS עȥ
		//if (!map.options.bounceAtZoomLimits) {
		//	if ((map.getZoom() === map.getMinZoom() && this._scale < 1) ||
		//	    (map.getZoom() === map.getMaxZoom() && this._scale > 1)) { return; }
	    //}
        //�޼�����ʱ
		if (!map.options.bounceAtZoomLimits) {
		    //console.log(map.getMinZoom() + "-" + map.getScaleZoom(this._scale) + " - " + map.getZoom() + "  " + this._scale);
		    this.lastscale = this._scale;
		    this.lastzoom = map.getScaleZoom(this._scale);
		    if ((this.lastzoom <= map.getMinZoom() && this._scale < 1) ||
	    	    (this.lastzoom >= map.getMaxZoom() && this._scale > 1))
		    {
	    	    return;
	    	}
	    }

		if (!this._moved) {
			L.DomUtil.addClass(map._mapPane, 'leaflet-touching');

			map
			    .fire('movestart')
			    .fire('zoomstart');

			this._moved = true;
		}
		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(
		        this._updateOnMove, this, true, this._map._container);

		L.DomEvent.preventDefault(e);
	},

	_updateOnMove: function () {
		var map = this._map,
		    origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),
		    zoom = map.getScaleZoom(this._scale);

		map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta);
	},

	_onTouchEnd: function () {
	    if (!this._moved || !this._zooming) {
	        this._zooming = false;
	        return;
	    }

	    var map = this._map;

	    this._zooming = false;
	    L.DomUtil.removeClass(map._mapPane, 'leaflet-touching');
	    L.Util.cancelAnimFrame(this._animRequest);

	    L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

	    /* ZS עȥ
	    var origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),

		    oldZoom = map.getZoom(),
		    floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom,
		    roundZoomDelta = (floatZoomDelta > 0 ?
		            Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta)),

		    zoom = map._limitZoom(oldZoom + roundZoomDelta),
		    scale = map.getZoomScale(zoom) / this._scale;
	    map._animateZoom(center, zoom, origin, scale);
        */
	    //ZS �޸� �޼�����
	    var map = this._map,
            origin = this._getScaleOrigin(),
            center = map.layerPointToLatLng(origin),
            zoom = map.getScaleZoom(this._scale);

	    if (!map.options.bounceAtZoomLimits) {
	        //console.log(map.getMinZoom() + "-" + map.getScaleZoom(this._scale) + " - " + map.getZoom() + "  " + this._scale);
	        if ((this.lastzoom <= map.getMinZoom() && this._scale < 1) ||
	    	    (this.lastzoom >= map.getMaxZoom() && this._scale > 1)) {

	            zoom = this.lastzoom;
	            map._onZoomTransitionEnd();
	            return;
	        }
	    }

	    //alert("origin:" + origin + " center:" + center + " startcenter: " +this._startCenter + " zoom:" + zoom + " scale :" + this._scale);
	    try {
	        map._bIsOnZoomTransition = false;//��ΪFalse
	        map._animateZoom(center, zoom, this._startCenter, this._scale);
	        if (map._animatingZoom && !map._bIsOnZoomTransition) {
	            map._onZoomTransitionEnd();//�Զ���Ӵ������������䣬pinch�޼�����ʱͼƬ�ᶳ��
	        }
	    }
	    catch (e) {
	        alert(e);
	    }
	},

	_getScaleOrigin: function () {
		var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
		return this._startCenter.add(centerOffset);
	}
});

L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);


/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

L.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);
        
		L.DomEvent
			.on(document, 'touchmove', this._onMove, this)
			.on(document, 'touchend', this._onUp, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent
			.off(document, 'touchmove', this._onMove, this)
			.off(document, 'touchend', this._onUp, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}


/*
 * L.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

L.Map.mergeOptions({
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._moved = false;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown);
		this._moved = false;
	},

	moved: function () {
		return this._moved;
	},

	_onMouseDown: function (e) {
		this._moved = false;

		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		L.DomEvent
		    .on(document, 'mousemove', this._onMouseMove, this)
		    .on(document, 'mouseup', this._onMouseUp, this)
		    .on(document, 'keydown', this._onKeyDown, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
			L.DomUtil.setPosition(this._box, this._startLayerPoint);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';
			this._map.fire('boxzoomstart');
		}

		var startPoint = this._startLayerPoint,
		    box = this._box,

		    layerPoint = this._map.mouseEventToLayerPoint(e),
		    offset = layerPoint.subtract(startPoint),

		    newPos = new L.Point(
		        Math.min(layerPoint.x, startPoint.x),
		        Math.min(layerPoint.y, startPoint.y));

		L.DomUtil.setPosition(box, newPos);

		this._moved = true;

		// TODO refactor: remove hardcoded 4 pixels
		box.style.width  = (Math.max(0, Math.abs(offset.x) - 4)) + 'px';
		box.style.height = (Math.max(0, Math.abs(offset.y) - 4)) + 'px';
	},

	_finish: function () {
		if (this._moved) {
			this._pane.removeChild(this._box);
			this._container.style.cursor = '';
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent
		    .off(document, 'mousemove', this._onMouseMove)
		    .off(document, 'mouseup', this._onMouseUp)
		    .off(document, 'keydown', this._onKeyDown);
	},

	_onMouseUp: function (e) {

		this._finish();

		var map = this._map,
		    layerPoint = map.mouseEventToLayerPoint(e);

		if (this._startLayerPoint.equals(layerPoint)) { return; }

		var bounds = new L.LatLngBounds(
		        map.layerPointToLatLng(this._startLayerPoint),
		        map.layerPointToLatLng(layerPoint));

		map.fitBounds(bounds);

		map.fire('boxzoomend', {
			boxZoomBounds: bounds
		});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);


/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

L.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex === -1) {
			container.tabIndex = '0';
		}

		L.DomEvent
		    .on(container, 'focus', this._onFocus, this)
		    .on(container, 'blur', this._onBlur, this)
		    .on(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .on('focus', this._addHooks, this)
		    .on('blur', this._removeHooks, this);
	},

	removeHooks: function () {
		this._removeHooks();

		var container = this._map._container;

		L.DomEvent
		    .off(container, 'focus', this._onFocus, this)
		    .off(container, 'blur', this._onBlur, this)
		    .off(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .off('focus', this._addHooks, this)
		    .off('blur', this._removeHooks, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		var key = e.keyCode,
		    map = this._map;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			map.panBy(this._panKeys[key]);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + this._zoomKeys[key]);

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);


/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon);
		}

		this._draggable
			.on('dragstart', this._onDragStart, this)
			.on('drag', this._onDrag, this)
			.on('dragend', this._onDragEnd, this);
		this._draggable.enable();
		L.DomUtil.addClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable
			.off('dragstart', this._onDragStart, this)
			.off('drag', this._onDrag, this)
			.off('dragend', this._onDragEnd, this);

		this._draggable.disable();
		L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function () {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;

		marker
		    .fire('move', {latlng: latlng})
		    .fire('drag');
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});


/*
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

L.Control = L.Class.extend({
	options: {
		position: 'topright'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	getPosition: function () {
		return this.options.position;
	},

	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	getContainer: function () {
		return this._container;
	},

	addTo: function (map) {
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	removeFrom: function (map) {
		var pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		corner.removeChild(this._container);
		this._map = null;

		if (this.onRemove) {
			this.onRemove(map);
		}

		return this;
	},

	_refocusOnMap: function () {
		if (this._map) {
			this._map.getContainer().focus();
		}
	}
});

L.control = function (options) {
	return new L.Control(options);
};


// adds control-related methods to L.Map

L.Map.include({
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	removeControl: function (control) {
		control.removeFrom(this);
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		this._container.removeChild(this._controlContainer);
	}
});


/*
 * L.Control.Zoom is used for the default zoom buttons on the map.
 */

L.Control.Zoom = L.Control.extend({
	options: {
		position: 'topleft',
		zoomInText: '+',
		zoomInTitle: 'Zoom in',
		zoomOutText: '-',
		zoomOutTitle: 'Zoom out'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar');

		this._map = map;

		this._zoomInButton  = this._createButton(
		        this.options.zoomInText, this.options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn,  this);
		this._zoomOutButton = this._createButton(
		        this.options.zoomOutText, this.options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut, this);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	_zoomIn: function (e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function (e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = L.DomEvent.stopPropagation;

		L.DomEvent
		    .on(link, 'click', stop)
		    .on(link, 'mousedown', stop)
		    .on(link, 'dblclick', stop)
		    .on(link, 'click', L.DomEvent.preventDefault)
		    .on(link, 'click', fn, context)
		    .on(link, 'click', this._refocusOnMap, context);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
			className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

L.Map.mergeOptions({
	zoomControl: true
});

L.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new L.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

L.control.zoom = function (options) {
	return new L.Control.Zoom(options);
};



/*
 * L.Control.Attribution is used for displaying attribution on the map (added by default).
 */

L.Control.Attribution = L.Control.extend({
	options: {
		position: 'bottomright',
		prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
		L.DomEvent.disableClickPropagation(this._container);

		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}
		
		map
		    .on('layeradd', this._onLayerAdd, this)
		    .on('layerremove', this._onLayerRemove, this);

		this._update();

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerAdd)
		    .off('layerremove', this._onLayerRemove);

	},

	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	addAttribution: function (text) {
		if (!text) { return; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	removeAttribution: function (text) {
		if (!text) { return; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	},

	_onLayerAdd: function (e) {
		if (e.layer.getAttribution) {
			this.addAttribution(e.layer.getAttribution());
		}
	},

	_onLayerRemove: function (e) {
		if (e.layer.getAttribution) {
			this.removeAttribution(e.layer.getAttribution());
		}
	}
});

L.Map.mergeOptions({
	attributionControl: true
});

L.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		this.attributionControl = (new L.Control.Attribution()).addTo(this);
	}
});

L.control.attribution = function (options) {
	return new L.Control.Attribution(options);
};


/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.Scale = L.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className, container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className + '-line', container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className + '-line', container);
		}
	},

	_update: function () {
		var bounds = this._map.getBounds(),
		    centerLat = bounds.getCenter().lat,
		    halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
		    dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

		    size = this._map.getSize(),
		    options = this.options,
		    maxMeters = 0;

		if (size.x > 0) {
			maxMeters = dist * (options.maxWidth / size.x);
		}

		this._updateScales(options, maxMeters);
	},

	_updateScales: function (options, maxMeters) {
		if (options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}

		if (options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters);

		this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
		this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    scale = this._iScale,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);

			scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
			scale.innerHTML = miles + ' mi';

		} else {
			feet = this._getRoundNum(maxFeet);

			scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
			scale.innerHTML = feet + ' ft';
		}
	},

	_getScaleWidth: function (ratio) {
		return Math.round(this.options.maxWidth * ratio) - 10;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

L.control.scale = function (options) {
	return new L.Control.Scale(options);
};


/*
 * L.Control.Layers is a control to allow users to switch between different layers on the map.
 */

L.Control.Layers = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (baseLayers, overlays, options) {
		L.setOptions(this, options);

		this._layers = {};
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		map
		    .on('layeradd', this._onLayerChange, this)
		    .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerChange)
		    .off('layerremove', this._onLayerChange);
	},

	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		this._update();
		return this;
	},

	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		this._update();
		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);
		delete this._layers[id];
		this._update();
		return this;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (layer, name, overlay) {
		var id = L.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._baseLayersList.innerHTML = '';
		this._overlaysList.innerHTML = '';

		var baseLayersPresent = false,
		    overlaysPresent = false,
		    i, obj;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
	},

	_onLayerChange: function (e) {
		var obj = this._layers[L.stamp(e.layer)];

		if (!obj) { return; }

		if (!this._handlingClick) {
			this._update();
		}

		var type = obj.overlay ?
			(e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'layeradd' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
		if (checked) {
			radioHtml += ' checked="checked"';
		}
		radioHtml += '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    input,
		    checked = this._map.hasLayer(obj.layer);

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = L.stamp(obj.layer);

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		label.appendChild(input);
		label.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			obj = this._layers[input.layerId];

			if (input.checked && !this._map.hasLayer(obj.layer)) {
				this._map.addLayer(obj.layer);

			} else if (!input.checked && this._map.hasLayer(obj.layer)) {
				this._map.removeLayer(obj.layer);
			}
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

L.control.layers = function (baseLayers, overlays, options) {
	return new L.Control.Layers(baseLayers, overlays, options);
};


/*
 * L.PosAnimation is used by Leaflet internally for pan animations.
 */

L.PosAnimation = L.Class.extend({
	includes: L.Mixin.Events,

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._newPos = newPos;

		this.fire('start');

		el.style[L.DomUtil.TRANSITION] = 'all ' + (duration || 0.25) +
		        's cubic-bezier(0,0,' + (easeLinearity || 0.5) + ',1)';

		L.DomEvent.on(el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
		L.DomUtil.setPosition(el, newPos);

		// toggle reflow, Chrome flickers for some reason if you don't do this
		L.Util.falseFn(el.offsetWidth);

		// there's no native way to track value updates of transitioned properties, so we imitate this
		this._stepTimer = setInterval(L.bind(this._onStep, this), 50);
	},

	stop: function () {
		if (!this._inProgress) { return; }

		// if we just removed the transition property, the element would jump to its final position,
		// so we need to make it stay at the current position

		L.DomUtil.setPosition(this._el, this._getPos());
		this._onTransitionEnd();
		L.Util.falseFn(this._el.offsetWidth); // force reflow in case we are about to start a new animation
	},

	_onStep: function () {
		var stepPos = this._getPos();
		if (!stepPos) {
			this._onTransitionEnd();
			return;
		}
		// jshint camelcase: false
		// make L.DomUtil.getPosition return intermediate position value during animation
		this._el._leaflet_pos = stepPos;

		this.fire('step');
	},

	// you can't easily get intermediate values of properties animated with CSS3 Transitions,
	// we need to parse computed style (in case of transform it returns matrix string)

	_transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,

	_getPos: function () {
		var left, top, matches,
		    el = this._el,
		    style = window.getComputedStyle(el);

		if (L.Browser.any3d) {
			matches = style[L.DomUtil.TRANSFORM].match(this._transformRe);
			if (!matches) { return; }
			left = parseFloat(matches[1]);
			top  = parseFloat(matches[2]);
		} else {
			left = parseFloat(style.left);
			top  = parseFloat(style.top);
		}

		return new L.Point(left, top, true);
	},

	_onTransitionEnd: function () {
		L.DomEvent.off(this._el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);

		if (!this._inProgress) { return; }
		this._inProgress = false;

		this._el.style[L.DomUtil.TRANSITION] = '';

		// jshint camelcase: false
		// make sure L.DomUtil.getPosition returns the final position value after animation
		this._el._leaflet_pos = this._newPos;

		clearInterval(this._stepTimer);

		this.fire('step').fire('end');
	}

});


/*
 * Extends L.Map to handle panning animations.
 */

L.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		if (this._panAnim) {
			this._panAnim.stop();
		}

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate}, options.pan);
			}

			// try animating pan or zoom
			var animated = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (animated) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});


/*
 * L.PosAnimation fallback implementation that powers Leaflet pan animations
 * in browsers that don't support CSS3 Transitions.
 */

L.PosAnimation = L.DomUtil.TRANSITION ? L.PosAnimation : L.PosAnimation.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step();
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function () {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		L.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});


/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

if (L.DomUtil.TRANSITION) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation && L.DomUtil.TRANSITION &&
				L.Browser.any3d && !L.Browser.android23 && !L.Browser.mobileOpera;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!L.DomUtil.TRANSITION ? {} : {

    _bIsOnZoomTransition: false,//ZS��ӣ�����pinch�޼��������ж�_onZoomTransitionEnd�Ƿ�ִ��

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
		    this._onZoomTransitionEnd();
		    this._bIsOnZoomTransition = true;
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	},

	_animateZoom: function (center, zoom, origin, scale, delta, backwards) {

		this._animatingZoom = true;

		// put transform transition on all layers with leaflet-zoom-animated class
		L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');

		// remember what center/zoom to set after animation
		this._animateToCenter = center;
		this._animateToZoom = zoom;

		// disable any dragging during animation
		if (L.Draggable) {
		    L.Draggable._disabled = true;
		}

		this.fire('zoomanim', {
			center: center,
			zoom: zoom,
			origin: origin,
			scale: scale,
			delta: delta,
			backwards: backwards
		});
	},

	_onZoomTransitionEnd: function () {

		this._animatingZoom = false;

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._resetView(this._animateToCenter, this._animateToZoom, true, true);

		if (L.Draggable) {
			L.Draggable._disabled = false;
		}
	}
});


/*
	Zoom animation logic for L.TileLayer.
*/

L.TileLayer.include({
	_animateZoom: function (e) {
		if (!this._animating) {
			this._animating = true;
			this._prepareBgBuffer();
		}

		var bg = this._bgBuffer,
		    transform = L.DomUtil.TRANSFORM,
		    initialTransform = e.delta ? L.DomUtil.getTranslateString(e.delta) : bg.style[transform],
		    scaleStr = L.DomUtil.getScaleString(e.scale, e.origin);

		bg.style[transform] = e.backwards ?
				scaleStr + ' ' + initialTransform :
				initialTransform + ' ' + scaleStr;
	},

	_endZoomAnim: function () {
		var front = this._tileContainer,
		    bg = this._bgBuffer;

		front.style.visibility = '';
		front.parentNode.appendChild(front); // Bring to fore

		// force reflow
		L.Util.falseFn(bg.offsetWidth);

		this._animating = false;
	},

	_clearBgBuffer: function () {
		var map = this._map;

		if (map && !map._animatingZoom && !map.touchZoom._zooming) {
			this._bgBuffer.innerHTML = '';
			this._bgBuffer.style[L.DomUtil.TRANSFORM] = '';
		}
	},

	_prepareBgBuffer: function () {

		var front = this._tileContainer,
		    bg = this._bgBuffer;

		// if foreground layer doesn't have many tiles but bg layer does,
		// keep the existing bg layer and just zoom it some more

		var bgLoaded = this._getLoadedTilesPercentage(bg),
		    frontLoaded = this._getLoadedTilesPercentage(front);

		if (bg && bgLoaded > 0.5 && frontLoaded < 0.5) {

			front.style.visibility = 'hidden';
			this._stopLoadingImages(front);
			return;
		}

		// prepare the buffer to become the front tile pane
		bg.style.visibility = 'hidden';
		bg.style[L.DomUtil.TRANSFORM] = '';

		// switch out the current layer to be the new bg layer (and vice-versa)
		this._tileContainer = bg;
		bg = this._bgBuffer = front;

		this._stopLoadingImages(bg);

		//prevent bg buffer from clearing right after zoom
		clearTimeout(this._clearBgBufferTimer);
	},

	_getLoadedTilesPercentage: function (container) {
		var tiles = container.getElementsByTagName('img'),
		    i, len, count = 0;

		for (i = 0, len = tiles.length; i < len; i++) {
			if (tiles[i].complete) {
				count++;
			}
		}
		return count / len;
	},

	// stops loading all tiles in the background layer
	_stopLoadingImages: function (container) {
		var tiles = Array.prototype.slice.call(container.getElementsByTagName('img')),
		    i, len, tile;

		for (i = 0, len = tiles.length; i < len; i++) {
			tile = tiles[i];

			if (!tile.complete) {
				tile.onload = L.Util.falseFn;
				tile.onerror = L.Util.falseFn;
				tile.src = L.Util.emptyImageUrl;

				tile.parentNode.removeChild(tile);
			}
		}
	}
});


/*
 * Provides L.Map with convenient shortcuts for using browser geolocation features.
 */

L.Map.include({
	_defaultLocateOptions: {
		watch: false,
		setView: false,
		maxZoom: Infinity,
		timeout: 10000,
		maximumAge: 0,
		enableHighAccuracy: false
	},

	locate: function (/*Object*/ options) {

		options = this._locateOptions = L.extend(this._defaultLocateOptions, options);

		if (!navigator.geolocation) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
			onError = L.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	stopLocate: function () {
		if (navigator.geolocation) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new L.LatLng(lat, lng),

		    latAccuracy = 180 * pos.coords.accuracy / 40075017,
		    lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat),

		    bounds = L.latLngBounds(
		            [lat - latAccuracy, lng - lngAccuracy],
		            [lat + latAccuracy, lng + lngAccuracy]),

		    options = this._locateOptions;

		if (options.setView) {
			var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
			this.setView(latlng, zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}
});


}(window, document));
///<jscompress sourcefile="rtmap.js" />
//Use something like this to display the labels

/*
 * this library depend on leafletjs ;
 * this public library
 * */
(function(factory){
    if(typeof(define)==="Function"){
        define(factory());
    }else{
        var Rtmap=Window.Rtmap||{};
        factory(Rtmap);
    }
})(function (_page) {
    var classification = {
        airportpoi: {
            18: "机场相关POI",
            isAirportpoi: function (twoclass) {
                if (!twoclass) {
                    return false;
                }
                if (twoclass.toString().indexOf("18") == 0) {
                    return true;
                }
                return false;
            }
        },
        restaurantpoi: {
            10: "餐饮相关",
            isRestaurantPoi: function (twoclass) {
                if (!twoclass) {
                    return false;
                }
                if (twoclass.toString().indexOf("10") == 0) {
                    return true;
                }
                return false;
            }
        },
        businesspoi: {//商业相关
            11: "服饰鞋包",
            12: "购物相关",
            13: "休闲娱乐",
            isBusinessPoi: function (twoclass) {
                if (!twoclass) {
                    return false;
                }
                if (twoclass.toString().indexOf("11") == 0 || twoclass.toString().indexOf("12") == 0 || twoclass.toString().indexOf("13") == 0) {
                    return true;
                }
                return false;
            }
        },
        travelpoi: {//乘机相关
            180101: "国内乘机手续办理",
            180102: "国际乘机手续办理",
            180201: "安检",
            180301: "登机口",
            180502: "行李提取",
            isTravelPoi: function (twoclass) {
                if (!twoclass) {
                    return false;
                }
                if (twoclass.toString().indexOf("180101") == 0 || twoclass.toString().indexOf("180102") == 0 ||
                    twoclass.toString().indexOf("180201") == 0 || twoclass.toString().indexOf("180301") == 0 ||
                    twoclass.toString().indexOf("180502") == 0) {
                    return true;
                }
                return false;
            }
        },
        zoomHash: {
            15: [],
            16: [190206, 200000],
            17: [190206, 180301, 180402, 180201, 180101, 200000],
            18: [190206, 1801, 1802, 1803, 1804, 200000],
            19: [190206, 18, 10, 11, 12, 13, 14, 15, 200000]
        },
        //小图标与文字
        twoClassHash: {
            //电话机
            //150704: "./public/img/tel.png",
            //乘机相关
            //180101: "./public/img/fly.png",
            //180102: "./public/img/fly.png",
            //180103: "./public/img/fly.png",
            //180104: "./public/img/fly.png",
            //180105: "./public/img/fly.png",
            //180106: "./public/img/fly.png",
            //180107: "./public/img/fly.png",
            //180108: "./public/img/fly.png",
            //180109: "./public/img/fly.png",
            //安检海关
            //180201: "./public/img/security.png",
            //180202: "./public/img/customs.png",
            //候机登机
            180301: "./public/img/boarding.png",
            //中转到达
            180402: "./public/img/arrive.png",
            //
            //190101: "./public/img/wc.png",
            //190201: "./public/img/elevator.png",
            //190202: "./public/img/escalator.png",
            //190203: "./public/img/stairway.png",
            190206: "./public/img/doorway.png",
            //190303: "./public/img/power.png",
            190401: "./public/img/information_desk.png",
            190402: "./public/img/information_desk.png",
            //购物相关
            //10: "./public/img/restaurant.png",
            //11: "./public/img/clothstore.png",
            //12: "./public/img/supermarket.png"
        },
        //小图标
        smallIconHash: {
            //电话机
            150704: "./public/img/tel.png",
            //卫生门
            190101: "./public/img/wc.png",
            190201: "./public/img/elevator.png",
            190202: "./public/img/escalator.png",
            190203: "./public/img/stairway_new.png",
            //190206: "./public/img/doorway.png",
            190303: "./public/img/power.png",
        },
        //大图标
        largeIconHash: {
            180101: "./public/img/checkin.png",
            180102: "./public/img/checkin.png",
            180103: "./public/img/checkin.png",
            180104: "./public/img/checkin.png",
            180105: "./public/img/checkin.png",
            180106: "./public/img/fly.png",
            180107: "./public/img/fly.png",
            180108: "./public/img/fly.png",
            180109: "./public/img/ticket.png",
            180201: "./public/img/security.png",
            180202: "./public/img/customs.png",
            180203: "./public/img/borderdefence.png",
            180204: "./public/img/quarantine.png",
            180401: "./public/img/transfer.png",
            180501: "./public/img/luggageelated.png",
            180502: "./public/img/luggageclaim.png",
            180503: "./public/img/luggageelated.png",
            180505: "./public/img/luggageelated.png",
            200105: "./public/img/ticket.png"
        }
    };

    _page.Classification = classification;

    /* 初期化label的一些事件和属性 绑定在原型链上 */
    var Label = L.Class.extend({
        //includes: L.Mixin.Events,
        initialize: function (/*LatLng*/ latLng, /*String*/ label, options, /*Num*/ type) {
            this._latlng = latLng;
            this._text = label;
            this.type = type;
            L.Util.setOptions(this, options);
        },

        options: {
            offset: new L.Point(0, 2)
        },

        rePosition: function (x, y) {
            var _options = { offset: new L.Point(x, y) };
            L.Util.setOptions(this, _options);
        },

        moveToCenter: function () {
            this.getSize();
            var offsetX = this._size.width;
            var offsetY = this._size.height;
            if (this.haveIcon) {//只包含icon时,此标识已过期，为兼容老代码保留
                this.rePosition(-offsetX / 2, offsetY / 2);
                //    var padding_left=this._size.padding_left;
                //                this.rePosition(-padding_left/2,offsetY/2);
            } else if ($(this._container).find("img").length) {//anJ
                if (this._iconStyle == "smallIconWithText") {
                    this.rePosition(-11, offsetY / 2);
                }
                else if (this._iconStyle == "largeIconWithText") {
                    this.rePosition(-11, offsetY / 2);
                }
                else if (this._iconStyle == "smallIcon") {
                    this.rePosition(-11, offsetY / 2);
                }
                else {
                    this.rePosition(-7.5, offsetY / 2);
                }
            } else {
                this.rePosition(-offsetX / 2, offsetY / 2);
            }
            this._reset();
        },

        getCenterPoint: function () {
            if (this._iconStyle == "smallIconWithText") {
                return new L.Point(this._pos.x + this.getSize().width / 2, this._pos.y);
            }
            if (this._iconStyle == "largeIconWithText") {
                return new L.Point(this._pos.x + this.getSize().width / 2, this._pos.y);
            }
            if (this._iconStyle == "smallIcon") {
                return this._pos;;
            }
            return this._pos;
        },

        getSize: function () {
            if (!this._size) {
                //var labelWidth = parseFloat($(this._container).css("width"));
                //var labelHeight = parseFloat($(this._container).css("height"));
                var labelWidth = this._container.clientWidth;
                var labelHeight = this._container.clientHeight;
                this._size = {
                    width: labelWidth,
                    height: labelHeight,
                    padding_left: 0
                }
            }
            return this._size;
        },

        onAdd: function (map) {
            this._map = map;
            if (!this._container) {
                this._initLayout();
            }
            map.getPanes().overlayPane.appendChild(this._container);
            var haveImage = Rtmap.Style.getImageConfig(this.two_class);//this._text
            if (haveImage) {
                this.haveIcon = true;
                this._text = null;
                this._container.innerHTML = '<img src="' + haveImage + '" width="18px" height="18px">';
            } else {
                this.haveIcon = false;
                this._container.innerHTML = this._text;
            }

            map.on('viewreset', this._reset, this);
            this._reset();
        },

        onRemove: function (map) {
            map.getPanes().overlayPane.removeChild(this._container);
            map.off('viewreset', this._reset, this);
        },

        _reset: function () {
            var pos = this._map.latLngToLayerPoint(this._latlng);
            this._pos = pos;
            var op = new L.Point(pos.x + this.options.offset.x, pos.y - this.options.offset.y);
            L.DomUtil.setPosition(this._container, op);
        },

        addClass: function (className) {
            $(this._container).addClass(className);
        },

        _initLayout: function () {
            if (_page.Config.getOption().PoiStart) {
                //this.star=_page.Config.getOption().PoiStart[this.class_extension];
                this.star = _page.Config.getOption().PoiStart[this._text] || 0;
            } else {
                this.star = 0;
            }
            this._container = L.DomUtil.create('div', 'rtmap_room_name');
            if (_page.Config.getOption().showIcon) {
                var poiClass = _page.Config.getOption().PoiClass[this.class_extension];
                if (poiClass) {
                    this.haveIcon = true;
                    $(this._container).addClass(poiClass);
                }
            }
            var font_color = _page.Style.getGlobalConfig("font_color");
            if (font_color) {
                $(this._container).css({ color: font_color });
            }
        },

        //图标样式
        _iconStyle: "none",

        //为每个label存一个私有属性，存的是当前layer的
        _nowLayer: null,

        //设置显示样式
        setDisplayStyle: function () {
            /* 二级分类显示 */
            this.filterByZoom(this._map.getZoom());
            /* end */
            if (_page.Config.getOption().labelStyle != "circle-point") {
                this._iconStyle = "none";
                this.moveToCenter();
                return;
            }
            if (this.two_class) {
                if (classification.twoClassHash[this.two_class]) {
                    //图标加文字
                    var str = "<img src=" + classification.twoClassHash[this.two_class] + " width='22px'/>" + this._container.textContent;
                    this._container.innerHTML = str;
                    this._iconStyle = "smallIconWithText";
                }
                else if (classification.largeIconHash[this.two_class]) {
                    //使用大图标加文字
                    this._container.innerHTML = '<img src="' + classification.largeIconHash[this.two_class] + '" width="22px" height="22px" style="position: absolute;" >' + '<div>' + this._text + '</div>';
                    this._iconStyle = "largeIconWithText";
                }

                else if (classification.smallIconHash[this.two_class]) {
                    //使用小图标(无文字)
                    this._container.innerHTML = '<img src="' + classification.smallIconHash[this.two_class] + '" width="22px" height="22px">';
                    this._iconStyle = "smallIcon";
                }
            }
            this.moveToCenter();
        },
        //根据配置的比例尺过滤
        filterByZoom: function (zoom) {
            var getClass = classification.zoomHash[zoom];
            if (getClass) {
                var needShow = false;
                if (this.two_class) {
                    var classify = this.two_class.toString();
                    for (var i = 0; i < getClass.length; i++) {

                        if (classify.indexOf(getClass[i]) == 0) {
                            needShow = true;
                            break;
                        }
                    }
                }
                if (needShow) {
                    this.iconLabelShow();
                } else {
                    this.iconLabelHide();
                }
            } else {
                this.iconLabelShow();
            }
        },

        _labelHideStatus: false,

        iconLabelHide: function () {
            this._labelHideStatus = true;
        },

        iconLabelShow: function () {
            this._labelHideStatus = false;
        },

        _geoBound: null,
        //获取边框范围(用于空间检索与标注避让范围调试用)
        getBounds: function () {
            //if (this.testRect) {
            //    Rtmap.Scene.getMap().removeLayer(this.testRect);
            //    this.testRect = null;
            //    this._geoBound = null;
            //}
            if (!this._geoBound) {
                var centerPos = this.getCenterPoint();
                var labelWidth = this._container.clientWidth;
                var labelHeight = this._container.clientHeight;
                var labelBoundsSW = this._map.layerPointToLatLng([centerPos.x - labelWidth / 2, centerPos.y - labelHeight / 2]);
                var labelBoundsNE = this._map.layerPointToLatLng([centerPos.x + labelWidth / 2, centerPos.y + labelHeight / 2]);
                this._geoBound = L.latLngBounds(labelBoundsSW, labelBoundsNE);
                //this.testRect = L.rectangle([labelBoundsSW, labelBoundsNE], { color: "#ff7800", weight: 1 }).addTo(Rtmap.Scene.getMap());
            }
            return this._geoBound;
        },

        setZoomVisble: function (zoom, visble) {
            var zoomProp = "zoom" + zoom + "visble";
            this[zoomProp] = visble;
        },

        getZoomVisble: function (zoom) {
            var zoomProp = "zoom" + zoom + "visble";
            return this[zoomProp];
        }
    });

    _page.Control = (function () {
        var resultListData = null;
        var markers = [];
        var marker = null;
        var backAction = null;
        var clearOld = true;
        var searchVal = null;

        var _localControl = null;

        var SearchModel = (function () {
            var searchControl = null;
            var searchPageIndex = 1;
            var responsePageCount;
            var currentSearchPoi = null;//
            var searchConstructor = L.Control.extend({
                option: {
                    position: "topright"
                },
                bindEvent: function () {
                    var self = this;
                    var d = this.html;
                    $(d).find(".searchBtn").click(function (event) {
                        event.stopPropagation();
                        _triggerEvent("searchBtn", [event]);
                        searchVal = $(d).find(".searchInput").val().trim();
                        responsePageCount = null;
                        clearOld = true;
                        searchPageIndex = 1;
                        ajax_search();
                    });

                    $(d).find(".back").click(function (event) {
                        event.stopPropagation();
                        backAction ? backAction() : "";
                    });
                    Rtmap.Scene.on("mapDrag", function () {
                        $(d).find(".searchInput").blur();
                    });
                    Rtmap.Scene.on("mapAction", function () {
                        //$(d).find(".categoryList").slideUp();
                        $(d).find(".category_box").slideUp();
                    });
                    Rtmap.Scene.on("poiClick", function (data, layer) {
                        $(d).find(".searchInput").blur();
                        //$(d).find(".categoryList").slideUp();
                        $(d).find(".category_box").slideUp();
                    });

                    $(d).find(".searchInput").keyup(function (event) {
                        event.stopPropagation();
                        if ($(d).find(".searchInput").val().length > 0) {
                            $(d).find(".clearInput").show();
                            $(d).find(".searchHistoryBox").hide();
                        } else {
                            $(d).find(".clearInput").hide();
                            if (getHistorys().length > 0) {
                                $(d).find(".searchHistoryBox").show();
                            }
                        };
                        if (event.keyCode == "13") {
                            searchVal = $(d).find(".searchInput").val().trim();
                            responsePageCount = null;
                            clearOld = true;
                            searchPageIndex = 1;
                            ajax_search();
                        }
                    });
                    $(d).find(".searchInput").click(function (event) {
                        event.stopPropagation();
                    });
                    $(d).find(".clearInput").click(function (event) {
                        event.stopPropagation();
                        _clearSearchResult();
                    });

                    $(d).find(".categoryBtn").click(function (event) {
                        event.stopPropagation();
                        $(d).find(".searchInput").blur();
                        //$(d).find(".categoryList").slideToggle();
                        $(d).find(".category_box").slideToggle();
                        _triggerEvent("categoryBtn", [event]);
                    });

                    $(d).find(".categoryList li").click(function (event) {
                        event.stopPropagation();
                        searchVal = $(this).attr("searchData");
                        _clearResultList();
                        //anj
                        twoClassSearch("category", $(this));
                        //                        ajax_search("category", $(this).attr("class"));//category可以不用写
                        _clearResultList();
                        //$(d).find(".categoryList").slideUp();
                        $(d).find(".category_box").slideUp();
                    });

                    $(d).find(".clearHistoryBtn").click(function () {
                        clearHistorys();
                    });

                    $(d).find(".clearHistoryBtn").bind("touchstart", function () {
                        event.stopPropagation();
                        clearHistorys();
                    });

                    $(d).find(".searchInput").bind("touchstart", function (event) {
                        event.stopPropagation();
                    });


                    $(d).find(".searchInput").focus(function (event) {
                        if (!$(this).val()) {
                            setTimeout(function () {
                                showHistory();
                            }, 200);
                        }
                        //$(d).find(".categoryList").slideUp();
                        $(d).find(".category_box").slideUp();
                        _triggerEvent("searchFocus", [event]);
                    });

                    $(d).find(".slideupHistoryBtn").bind("touchstart", function (event) {
                        event.stopPropagation();
                        event.preventDefault();
                        $(d).find(".searchInput").blur();
                    });

                    $(d).find(".searchInput").blur(function (event) {
                        setTimeout(function () {
                            $(d).find(".searchHistoryBox").hide();
                        }, 200);
                    });

                    $(d).find(".searchBtn").bind("touchstart", function (event) {
                        event.stopPropagation();
                        _triggerEvent("searchBtn", [event]);
                        searchVal = $(d).find(".searchInput").val().trim();
                        ajax_search();
                    });
                    $(d).find(".resultListBox").bind("mousewheel", function () {
                        event.stopPropagation();
                    });
                    $(d).find(".resultListBox").bind("touchstart", function () {
                        event.stopPropagation();
                    });
                    $(d).find(".resultListBox").bind("touchmove", function () {
                        event.stopPropagation();
                    });
                    $(d).find(".resultListBox").bind("touchend", function () {
                        event.stopPropagation();
                    });
                    $(d).find(".resultListBox ul").scroll(function (e) {
                        event.stopPropagation();
                        var h = $(this).height();
                        if (this.scrollHeight == h + this.scrollTop) {
                            if (!this.bottomAlert) {
                                $(this).append(this.bottomAlert);
                            }
                            searchPageIndex++;
                            clearOld = false;
                            if (searchPageIndex <= responsePageCount)//夫
                                ajax_search();
                        }
                    });

                    function showHistory() {
                        var ul = $("<ul/>");
                        var ary = getHistorys();
                        if (ary.length < 1) {
                            $(d).find(".searchHistoryBox").hide();
                            return;
                        }
                        for (i = ary.length - 1; i > -1; i--) {
                            var text = ary[i];
                            var li = $("<li/>", { text: text, "class": "history_item" });
                            ul.append(li);
                            li.click(function () {
                                searchVal = $(this).text();
                                $(d).find(".searchInput").blur();
                                _clearResultList();
                                $(d).find(".searchInput").val(searchVal);
                                $(d).find(".clearInput").show();
                                ajax_search();
                            });
                        }
                        $(d).find(".searchHistoryBox ul").remove();
                        $(d).find(".searchHistoryBox").show().prepend(ul);
                    }

                    function showResultList(data) {
                        var listBox = $(d).find(".resultListBox");
                        listBox.show();
                        var ul = listBox.find("ul");
                        if (clearOld) {
                            ul.html("");
                            ul[0].scrollTop = 0;
                        };
                        for (var i = 0; i < data.length; i++) {
                            var li = $("<li/>", {});
                            var str = '<span class="poi_name">' + data[i].name + '</span>' +
                                '<span class="floor">' + data[i].floor.toUpperCase() + '</span>';
                            li.append(str);
                            ul.append(li);
                            bindEvent(li, data[i]);
                        };

                        function bindEvent(li, data) {
                            li.click(function () {
                                event.stopPropagation();
                                var nowFloor = Rtmap.Scene.getNowFloor();
                                if (data.floor.toLowerCase() != nowFloor) {
                                    _triggerEvent("changeToNearFloor", [data.floor]);
                                    Rtmap.Scene.changeFloorTo(data.floor);
                                };
                                _markerOneResult(data);
                            });
                        };
                        backAction = _clearSearchResult
                    }

                    function _markerOneResult(data) {
                        marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                        var redIconUrl = _page.Style.getGlobalConfig("focus_icon_url");
                        var _icon = L.icon({
                            iconUrl: redIconUrl,
                            iconRetinaUrl: redIconUrl,
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                            shadowSize: [68, 95],
                            shadowAnchor: [22, 94]
                        });
                        marker = Rtmap.Scene.createMarker({ x: data.x, y: data.y, icon: _icon });
                        marker.selected = true;
                        _clearMarkers();
                        Rtmap.Scene.moveTo({ x: data.x, y: data.y }, 19);
                        var listBox = $(d).find(".resultListBox");
                        listBox.hide();
                        backAction = function () {
                            listBox.show();
                            backAction = _clearSearchResult
                        };
                        currentSearchPoi = {};
                        currentSearchPoi.x = data.x;
                        currentSearchPoi.y = data.y;
                        currentSearchPoi.floor = data.floor;
                        currentSearchPoi.poi_no = data.poi_no;
                        _page.Search.FocusResult = currentSearchPoi;
                        _triggerEvent("markerSearchToMap", [[data], [marker]])
                    }
                    function ajax_search(searchType) {
                        var val = searchVal;
                        var e = ["电梯"];
                        var ary = self.getCategoryList().concat(e);
                        if (ary.indexOf(val) > -1) {
                            searchType = "category";
                        }
                        if (val == "") { return; }
                        if (!searchType) {
                            addHistory(val);
                        }
                        // anJ 增加了className  arguments[1]
                        _page.Search.request({ searchPageIndex: searchPageIndex, keyword: val, searchType: searchType, className: (arguments[1] || "") }, function (filterData, originData, jsonData) {
                            resultListData = filterData;
                            responsePageCount = originData.pagecount;
                            if (searchPageIndex > responsePageCount) return;//若超出数据的分页索引数，则不显示重复结查List
                            if (originData.poilist && originData.poilist.length > 0) {
                                if (searchType == "category") {
                                    var floor = Rtmap.Scene.getNowFloor();
                                    var thisFloorData = resultListData[floor];
                                    if (thisFloorData) {
                                        // anJ 增加参数className
                                        _markerMultiResult(thisFloorData, jsonData.className);
                                    } else {
                                        if (!(originData.floor_result && originData.floor_result.length > 0)) {
                                            return;
                                        };
                                        var pFloor = getNearFloor(originData.floor_result, floor);
                                        var nearFloor = pFloor > 0 ? "f" + pFloor : "b" + (-pFloor);
                                        _triggerEvent("changeToNearFloor", [nearFloor]);
                                        Rtmap.Scene.changeFloorTo(nearFloor, function () {
                                            // anJ 增加参数className
                                            ajax_search("category", jsonData.className);
                                        });
                                        responsePageCount = null;
                                        //_markerMultiResult(resultListData[nearFloor]);
                                        function getNearFloor(floorAry, nowFloor) {
                                            var nowFloor_Int = parseFloor(nowFloor);
                                            for (var i = 0; i < floorAry.length; i++) {
                                                floorAry[i] = parseFloor(floorAry[i]);
                                            }

                                            function parseFloor(floor) {
                                                floor = floor.toLowerCase();
                                                floor = floor.replace(/b/g, "-");
                                                floor = floor.replace(/f/g, "");
                                                floor = parseFloat(floor);
                                                return floor;
                                            };
                                            floorAry.sort(function (a, b) { return a - b; });
                                            var nearFloorIndex = getGapPlace(0);
                                            function getGapPlace(count) {
                                                var prevIndex = floorAry.indexOf(nowFloor_Int + count);
                                                var nextIndex = floorAry.indexOf(nowFloor_Int - count);
                                                if (prevIndex > -1) {
                                                    return prevIndex;
                                                } else if (nextIndex > -1) {
                                                    return nextIndex;
                                                } else {
                                                    return getGapPlace(count += 0.5);
                                                };
                                            }
                                            return floorAry[nearFloorIndex];
                                        };
                                    }
                                } else {
                                    showResultList(originData.poilist);
                                    self.showBackBtn();
                                }
                                //console.log(originData.pagecount,originData.pageindex,originData.pagesize);
                            } else {
                                _clearSearchResult();
                                self.hideBackBtn();
                            }
                        });
                    }
                    //anj
                    function twoClassSearch(searchType, obj) {
                        var classData = obj.attr("searchData");
                        if (classData) {
                            if (classData.indexOf("_") != -1) {
                                classData = classData.split("_");
                            } else {
                                classData = [classData];
                            }
                        } else {
                            console.log("no such data");
                        }
                        _page.Search.searchTwoClass(classData, function (filterData, originData) {
                            resultListData = filterData;
                            responsePageCount = originData.pagecount;
                            if (originData.poilist && originData.poilist.length > 0) {
                                if (searchType == "category") {
                                    var floor = Rtmap.Scene.getNowFloor();
                                    var thisFloorData = resultListData[floor];
                                    if (thisFloorData) {
                                        // anJ 增加参数className
                                        _markerMultiResult(thisFloorData);
                                    } else {
                                        if (!(originData.floor_result && originData.floor_result.length > 0)) {
                                            return;
                                        };
                                        var pFloor = getNearFloor(originData.floor_result, floor);
                                        var nearFloor = pFloor > 0 ? "f" + pFloor : "b" + (-pFloor);
                                        _triggerEvent("changeToNearFloor", [nearFloor]);
                                        Rtmap.Scene.changeFloorTo(nearFloor, function () {
                                            // anJ 增加参数className
                                            twoClassSearch("category", obj);
                                        });
                                        responsePageCount = null;

                                        function getNearFloor(floorAry, nowFloor) {
                                            var nowFloor_Int = parseFloor(nowFloor);
                                            for (var i = 0; i < floorAry.length; i++) {
                                                floorAry[i] = parseFloor(floorAry[i]);
                                            }

                                            function parseFloor(floor) {
                                                floor = floor.toLowerCase();
                                                floor = floor.replace(/b/g, "-");
                                                floor = floor.replace(/f/g, "");
                                                floor = parseFloat(floor);
                                                return floor;
                                            };
                                            floorAry.sort(function (a, b) { return a - b; });
                                            var nearFloorIndex = getGapPlace(0);
                                            function getGapPlace(count) {
                                                var prevIndex = floorAry.indexOf(nowFloor_Int + count);
                                                var nextIndex = floorAry.indexOf(nowFloor_Int - count);
                                                if (prevIndex > -1) {
                                                    return prevIndex;
                                                } else if (nextIndex > -1) {
                                                    return nextIndex;
                                                } else {
                                                    return getGapPlace(count += 0.5);
                                                };
                                            }
                                            return floorAry[nearFloorIndex];
                                        };
                                    }
                                } else {
                                    showResultList(originData.poilist);
                                    self.showBackBtn();
                                }
                                //console.log(originData.pagecount,originData.pageindex,originData.pagesize);
                            } else {
                                _clearSearchResult();
                                self.hideBackBtn();
                            }
                        });
                    }
                },
                showBackBtn: function () {
                    $(this.html).find(".rtmap_search_box").addClass("result");
                },
                hideBackBtn: function () {
                    $(this.html).find(".rtmap_search_box").removeClass("result");
                },
                getCategoryList: function () {
                    var ary = [];
                    $(this.html).find(".categoryList li").each(function () {
                        var searchData = $(this).attr("searchData");
                        ary.push(searchData);
                    });
                    return ary;
                },
                onAdd: function () {
                    var d = L.DomUtil.create('div', '');
                    d.innerHTML = '' +
                        '<div class="rtmap_search_box">' +
                        '<div class="back"><i class="fa fa-chevron-left"></i></div>' +
                        '<div class="input_box">' +
                        '<input type="text" class="rtmap_search_input searchInput"/>' +
                        '<i class="fa fa-close clear_input_btn clearInput"></i>' +
                        '<div class="search_history_box searchHistoryBox">' +
                        '<div class="history_btn_bar">' +
                        '<div class="slideup_history slideupHistoryBtn"><i class="fa fa-angle-up"></i></div>' +
                        '<div class="clear_history_btn clearHistoryBtn">清空历史</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '<i class="fa fa-search search_btn searchBtn"></i>' +
                        '<i class="fa fa-th-list search_category categoryBtn"></i>' +
                        '<div class="category_box" style="display: none;">' +
                        '<ul class="categoryList">' +
                            '<li class="wc" searchData="190101">卫生间</li>' +
                            '<li class="doorway" searchData="190206">出入口</li>' +
                            '<li class="elevator" searchData="190201">直梯</li>' +
                            '<li class="ladder" searchData="190202">扶梯</li>' +
                            '<li class="information_desk" searchData="190401_190402">问讯</li>' +
                            '<li class="restaurant" searchData="10%">餐饮</li>' +
                            '<li class="business" searchData="11%_12%_13%_14%_15%_16%">商业</li>' +
                            '<li class="power" searchData="190303">充电设备</li>' +
                        '</ul>' +
                        '</div>' +
                        '<div class="resultListBox">' +
                        '<ul></ul>' +
                        '</div>' +
                        '</div>' +
                        '<div class="yellow_notice"></div>';//+'<div class="air_view"></div>'
                    this.html = d;
                    this.bindEvent();
                    return d;
                }
            });


            function _render() {
                var map = Rtmap.Scene.getMap();
                searchControl = new searchConstructor();
                map.addControl(searchControl)
            };

            function getHistorys() {
                var searchHistory = localStorage.getItem("searchHistory");
                var nowAry = searchHistory ? searchHistory.split(",") : [];
                return nowAry;
            }

            function clearHistorys() {
                localStorage.setItem("searchHistory", "");
            }

            function _clearSearchResult() {
                _clearResultList();
                _clearMarkers();
                _triggerEvent("clearSearchResult");
                searchVal = null;
                currentSearchPoi = null;
                _page.Search.FocusResult = null;
                if (marker) {
                    marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                    marker = null;
                }
                Rtmap.Scene.SelectMarker ? Rtmap.Scene.removeLayer(Rtmap.Scene.SelectMarker, true) : "";
                Rtmap.Scene.SelectMarker = null;
            };

            function _clearResultList() {
                responsePageCount = null;
                searchPageIndex = 1;
                clearOld = true;
                $(searchControl.html).find(".resultListBox").hide();
                searchControl.hideBackBtn();
                $(searchControl.html).find(".searchInput").val("");
                $(searchControl.html).find(".clearInput").hide();
                var ul = $(searchControl.html).find(".resultListBox ul");
                ul.html("");
                var marker = Rtmap.Scene.SelectMarker;
                marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                Rtmap.Scene.SelectMarker = null;
                _triggerEvent("clearResultList");
            };

            function addHistory(val) {
                var searchHistory = localStorage.getItem("searchHistory");
                var nowAry = searchHistory ? searchHistory.split(",") : [];
                for (var i = 0; i < nowAry.length; i++) {
                    if (nowAry[i] == val) {
                        return;
                    }
                }
                nowAry.push(val);
                //just show 5 items;
                if (nowAry.length > 5) {
                    nowAry.splice(0, nowAry.length - 5);
                }
                try {
                    localStorage.setItem("searchHistory", nowAry);
                } catch (e) {
                    console.log("please turn off '无痕浏览'!");
                }
            }

            function _markerMultiResult(thisFloorResult) {
                _clearResultList();
                _clearMarkers();
                var latlngs = [];
                // start anJ
                //                var redIconUrl=_page.Style.getGlobalConfig("focus_icon_url");
                //                var blueIconUrl= _page.Style.getGlobalConfig("normal_icon_url");
                //                var normal = (arguments[1] || "normal");
                var redIconUrl = _page.Style.getGlobalConfig("focus_icon_url");//(normal && normal != "normal" ? normal + "_red" : "focus") +
                var blueIconUrl = _page.Style.getGlobalConfig("normal_icon_url");
                //end anJ
                var _redIcon = L.icon({
                    iconUrl: redIconUrl,
                    iconRetinaUrl: redIconUrl,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    shadowSize: [68, 95],
                    shadowAnchor: [22, 94]
                });
                var _blueIcon = L.icon({
                    iconUrl: blueIconUrl,
                    iconRetinaUrl: blueIconUrl,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    shadowSize: [68, 95],
                    shadowAnchor: [22, 94]
                });
                markers.length = 0;
                Rtmap.PoiLabelFactory.resetIconStatus();
                for (var i = 0; i < thisFloorResult.length; i++) {
                    var x = thisFloorResult[i].x;
                    var y = thisFloorResult[i].y;
                    //防止查询POI中心点不一致
                    var poi = Rtmap.Scene.getPoiByNum(thisFloorResult[i].floor, thisFloorResult[i].poi_no);
                    if (poi) {
                        x = poi.feature.properties.x_coord;
                        y = poi.feature.properties.y_coord;
                    }
                    Rtmap.PoiLabelFactory.hideLabel(thisFloorResult[i].poi_no, x, y);
                    if (i == 0) {
                        var _icon = _redIcon;
                    } else {
                        var _icon = _blueIcon;
                    }
                    var itemMarker = Rtmap.Scene.createMarker({ icon: _icon, fillOpacity: 1, opacity: 1, fillColor: "red", color: "#ddd", size: 10, x: x, y: y });
                    markers.push(itemMarker);
                    itemMarker.on("click", function () {
                        for (var i = 0; i < markers.length; i++) {
                            markers[i].setIcon(_blueIcon);
                            delete markers[i].selected;
                        };
                        this.setIcon(_redIcon);
                        this.selected = true;
                    });
                    if (i == 0) {
                        itemMarker.selected = true;
                    }
                    var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
                    latlngs.push(latlng);
                }
                //anJ
                var map = Rtmap.Scene.getMap();
                // fit bounds
                if (latlngs.length > 1) {
                    //var polyline = L.polyline(latlngs, { color: 'red' });
                    //map.fitBounds(polyline.getBounds());
                } else if (thisFloorResult.length == 1) {
                    Rtmap.Scene.moveTo({ x: thisFloorResult[0].x, y: thisFloorResult[0].y }, map.zoom);//anJ 原来是定值19
                }
                marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                Rtmap.Scene.removeLayer(marker, true);
                _triggerEvent("markerSearchToMap", [thisFloorResult, markers]);
            };

            function _clearMarkers() {
                for (var i = 0; i < markers.length; i++) {
                    Rtmap.Scene.removeLayer(markers[i], true);
                }
            }

            var Events = {};

            function _triggerEvent(action, ary) {
                if (Events[action]) {
                    for (var i = 0; i < Events[action].length; i++) {
                        Events[action][i].apply(self, ary);
                    }
                }
            }

            return {
                render: _render,
                on: function (action, func) {
                    if (!Events[action]) {
                        Events[action] = [];
                    }
                    Events[action].push(func);
                },
                clearResultList: _clearResultList,
                hideCategory: function () {
                    //$(searchControl.html).find(".categoryList").slideUp();
                    $(searchControl.html).find(".category_box").slideUp();
                },
                clearSearchResult: _clearSearchResult,
                getCurrentSearchPoi: function () {
                    return currentSearchPoi;
                }
            }
        })();

        var FloorChange = (function () {
            var FloorControl = null;
            function _render() {
                FloorControl = L.Control.extend({
                    openstatus: false,
                    _bindEvent: function () {
                        var self = this;
                        this.listScroll.bind("mousewheel", function () {
                            event.stopPropagation();
                        });
                        this.listScroll.scroll(function () {
                            _checkAngleStatus();
                        });
                        this.listScroll.bind("touchstart", function () {
                            event.stopPropagation();
                        });
                        this.listScroll.bind("touchmove", function (event) {
                            event.stopPropagation();
                        });
                        this.listScroll.bind("touchend", function () {
                            event.stopPropagation();
                        });
                        function _checkAngleStatus() {
                            var top = self.listScroll[0].scrollTop,
                                scorllHeight = self.listScroll[0].scrollHeight;
                            offsetHeight = self.listScroll[0].offsetHeight;
                            realyHeight = scorllHeight - offsetHeight;
                            if (top == realyHeight) {
                                $(".topAngle .fa").removeClass("disable");
                                $(".bottomAngle .fa").addClass("disable");
                                if (top == 0 && realyHeight == 0) {
                                    $(".topAngle .fa").addClass("disable");
                                    $(".bottomAngle .fa").addClass("disable");
                                }
                            } else if (top == 0) {
                                $(".topAngle .fa").addClass("disable");
                                $(".bottomAngle .fa").removeClass("disable");
                            } else {
                                $(".topAngle .fa").removeClass("disable");
                                $(".bottomAngle .fa").removeClass("disable");

                            };
                        };
                        this.floorBtn.click(function (event) {
                            event.stopPropagation();
                            event.preventDefault();
                            self.openstatus = !self.openstatus;
                            self.changeList.slideToggle(300);
                            if (self.openstatus) {
                                var activeLi = self.listScroll.find("li.active");
                                var t = activeLi[0].offsetTop;
                                var target = t - 80,
                                    start = self.listScroll[0].scrollTop;
                                var oneStep = (target - start) / 30;
                                var now = start;

                                function doit() {
                                    now += oneStep;
                                    self.listScroll[0].scrollTop = now;
                                    if (Math.abs(now - target) <= Math.abs(oneStep)) {
                                        self.listScroll[0].scrollTop = target;
                                        _checkAngleStatus();
                                        return;
                                    }
                                    _checkAngleStatus();
                                    requestAnimationFrame(doit);
                                };
                                doit();
                            };
                        });

                        Rtmap.Scene.on("changeFloor", function (f) {
                            self.floorBtn.text(f.toUpperCase());
                            self.listScroll.find("li.active").removeClass("active");
                            self.listScroll.find("li." + f).addClass("active");
                            self.changeList.slideUp();
                            self.openstatus = false;
                        });
                        Rtmap.Scene.on("mapAction", function () {
                            self.changeList.slideUp();
                            self.openstatus = false;
                        });
                    },
                    setData: function (ary) {
                        var ul = this.listScroll.find(".floor_list");
                        ul.html("");
                        this.dataLength = ary.length;

                        for (var i = 0; i < ary.length; i++) {
                            var floor = ary[i].floor.toLocaleLowerCase();
                            var li = $("<li/>", { text: floor.toUpperCase(), class: floor.toLowerCase() });
                            var initFloor = Rtmap.Scene.getNowFloor();
                            if (floor == initFloor) {
                                li.addClass("active");
                            }
                            bindEvent(li, floor);
                            ul.append(li);
                        }

                        function bindEvent(li, floor) {
                            li.click(function (event) {
                                window.locationModel = "free";//转为自由模式
                                Rtmap.Control.disableLocal();
                                event.stopPropagation();
                                var nowFloor = Rtmap.Scene.getNowFloor();
                                if (floor == nowFloor) {
                                    return;
                                };
                                Rtmap.Scene.changeFloorTo(floor);
                            });
                        }
                    },
                    options: {

                    },
                    onAdd: function () {
                        var d = L.DomUtil.create('div', '');
                        d.innerHTML = '' +
                            '<div class="floor_change_box">' +
                            '<div class="rtmap_floor_change_list">' +
                            '<div class="top_angle topAngle"><i class="fa fa-angle-up"></i></div>' +
                            '<div class="list_scroll">' +
                            '<ul class="floor_list">' +
                            '</ul>' +
                            '</div>' +
                            '<div class="bottom_angle bottomAngle"><i class="fa fa-angle-down"></i></div>' +
                            '</div>' +
                            '<div class="rtmap_floor_btn">' +
                            '<i class="fa fa-spinner fa-spin"></i>' +
                            '</div>' +
                            '</div>';
                        var list_scroll = $(d).find(".list_scroll");
                        var floor_btn = $(d).find(".rtmap_floor_btn");
                        this.floorBtn = floor_btn;
                        this.listScroll = list_scroll;
                        this.changeList = $(d).find(".rtmap_floor_change_list");
                        this._bindEvent();
                        $(d).parent().addClass("flo");
                        return d;
                    }
                });

                var f = new FloorControl({
                    position: "bottomleft"
                });
                var map = Rtmap.Scene.getMap();
                map.addControl(f)
                return f;
            };

            return {
                render: _render
            }
        })();

        return {
            showScale: function () {
                var scale = L.control.scale({
                    position: "bottomleft",
                    imperial: false,
                    className: "fa",
                });
                var map = Rtmap.Scene.getMap();
                map.addControl(scale)
                var con = scale.getContainer();
                var jqueryDom = $(con);
                jqueryDom.addClass("rtmap_scale");
                var b = jqueryDom.parent();
                b.addClass("rtmap_scale_box");
            },
            showZoom: function () {
                var z = L.control.zoom({
                    position: "bottomright",
                    zoomInText: "+",
                    zoomOutText: "-"
                });
                var map = Rtmap.Scene.getMap();
                map.addControl(z)
                var con = z.getContainer();
                var jqueryDom = $(con);
                jqueryDom.addClass("rtmap_zoom");
                var b = jqueryDom.parent();
                b.addClass("rtmap_zoom_box");

                var outZ = $(".leaflet-control-zoom-out");
                var inZ = $(".leaflet-control-zoom-in");
                outZ.bind("touchstart", function (event) {
                    if ($(this).attr("class").indexOf("leaflet-disabled") > -1) {
                        event.preventDefault();
                        event.stopPropagation();
                    };
                });
                inZ.bind("touchstart", function (event) {
                    if ($(this).attr("class").indexOf("leaflet-disabled") > -1) {
                        event.preventDefault();
                        event.stopPropagation();
                    };
                });
            },
            showLocal: function (handler) {
                var Local = L.Control.extend({
                    _enable: true,
                    setEnable: function (enable) {
                        if (this._enable == enable)
                            return;
                        this._enable = enable;
                        var local = $(this._container);
                        if (this._enable) {
                            local.css({ "background": "rgba(255,255,255,0) url(public/img/control.png) center center no-repeat", "background-size": "cover" });
                        }
                        else {
                            local.css({ "background": "rgba(255,255,255,0) url(public/img/control_disable.png) center center no-repeat", "background-size": "cover" });
                        }
                    },
                    options: {

                    },
                    onAdd: function () {
                        var controlDiv = L.DomUtil.create('i', 'fa fa-crosshairs');
                        $(controlDiv).click(function () {
                            //if (!_localControl._enable) return;
                            handler();
                            var abc = $(this);
                            abc.css({ "pointer-events": "none" });
                            setTimeout(function () {
                                abc.css({ "pointer-events": "auto" })
                            }, 2000);

                        });
                        $(controlDiv).dblclick(function () {
                            return false;
                        });
                        $(controlDiv).addClass("rtmap_local");
                        this.html = controlDiv;
                        return controlDiv;
                    }
                });

                var l = new Local({
                    position: "bottomright"
                });
                var map = Rtmap.Scene.getMap();
                map.addControl(l)
                _localControl = l;
            },

            disableLocal: function () {
                _localControl ? _localControl.setEnable(false) : "";
            },

            enableLocal: function () {
                _localControl ? _localControl.setEnable(true) : "";
            },

            showSearch: function () {
                SearchModel.render();
                return SearchModel;
            },
            showFloorChange: function () {
                return FloorChange.render();
            },
        }
    })();

    /*
     *  this module use to create name label;
     */
    _page.PoiLabelFactory = (function () {
        var LabelList = [];
        var _clearList = [];

        var _groupLayer = null;
        var _labelCache = {};

        //放大系数
        var zoomRatio;
        var zoomfactor;
        var map;

        function _getRatio() {
            map = _page.Scene.getMap();
            var zoomLevelCount = map.options.maxZoom - map.options.minZoom;
            var currentZoomLevel = Math.round(map._zoom) - map.options.minZoom;
            zoomfactor = (Math.pow(2, currentZoomLevel)); //最小比例尺放大系数
            if ((currentZoomLevel / zoomLevelCount) <= 0.2) {
                zoomRatio = 1.6;//当前比例尺放大系数
            }
            else if ((currentZoomLevel / zoomLevelCount) <= 0.4) {
                zoomRatio = 1.5;//当前比例尺放大系数
            }
            else if ((currentZoomLevel / zoomLevelCount) <= 0.6) {
                zoomRatio = 1.4;//当前比例尺放大系数
            }
            else if ((currentZoomLevel / zoomLevelCount) <= 0.8) {
                zoomRatio = 1.2;//当前比例尺放大系数
            }
            else {
                zoomRatio = 1.0;//当前比例尺放大系数
            }
        }

        //是否局部刷新
        function _isPartialRefresh() {
            map = _page.Scene.getMap();
            //大比例尺时，换为局部刷新
            if (map._zoom > (map.options.minZoom + 2)) {
                return true;
            }
            else {
                return false;
            }
        }

        function _getInfo(Label, scaleFactor) {
            if (!scaleFactor) {
                scaleFactor = 1;
            }
            var centerP = Label.getCenterPoint() || {};
            var lb = Label.getSize() || {};
            return {
                x: centerP.x,
                y: centerP.y,
                height: lb.height * scaleFactor,
                width: lb.width * scaleFactor
            }
        };

        function _checkHit(A, B) {
            if ((Math.abs(B.x - A.x) < (A.width / 2 + B.width / 2)) && (Math.abs(B.y - A.y) < (A.height / 2 + B.height / 2))) {
                return true;
            }
            return false;
        };

        function _removeCache(zoom, label) {
            for (var j = 0; j < _labelCache[zoom].length; j++) {
                if (_labelCache[zoom][j] == LabelList[i]) {
                    _labelCache[zoom].splice(j, 1);
                    break;
                }
            }
        }

        //第一次加载数据时计算label压盖情况
        function _findOverlapLabels(label) {
            _getRatio();
            //zoomfactor(地图最小比例尺时的放大系数);
            //zoomRatio(地图当前比例尺的放大系数)
            var minZoomVisble = true;
            //label.filterByZoom(Math.round(map._zoom));

            for (var i = 0; i < LabelList.length; i++) {
                if (label == LabelList[i]) continue;
                //计算最小级别时的标注压盖情况，因为初始化加载时默认会将地图放大一级所以算第一级时，放大系数乘以2;
                if (_checkHit(_getInfo(LabelList[i], zoomfactor), _getInfo(label, zoomfactor))) {
                    label.OL_Array ? "" : label.OL_Array = [];
                    label.OL_Array.push(LabelList[i]);
                    if (LabelList[i].minZoomVisble) {
                        if (!label.haveIcon || LabelList[i].haveIcon || label._labelHideStatus) {
                            minZoomVisble = false;
                        } else {
                            //从缓存中移除
                            _removeCache(map.options.minZoom, LabelList[i]);
                        }
                    }
                    //判断当前级别是否压盖
                    if (_checkHit(_getInfo(LabelList[i], zoomRatio), _getInfo(label, zoomRatio))) {   //anJ 系数缩小到1.5
                        if (!LabelList[i].show) continue;
                        if (!label.haveIcon || LabelList[i].haveIcon || label._labelHideStatus) {//图标显示优先
                            //隐藏
                            $(label._container).addClass("hide");
                            label.show = false;
                        } else {
                            //从缓存中移除
                            _removeCache(map.options.minZoom, LabelList[i]);
                            $(LabelList[i]._container).addClass("hide");
                            LabelList[i].show = false;
                        }
                    }
                }
            }

            /*隐藏不该在该级别出现的poi 并且最小级别时不显示 */
            if (label._labelHideStatus || Math.round(map._zoom) == map.options.minZoom) {
                $(label._container).addClass("hide");
                label.show = false;
            }

            //缓存最小级别时可见标注
            if (minZoomVisble) {
                if (!_labelCache[map.options.minZoom]) {
                    _labelCache[map.options.minZoom] = [];
                }
                _labelCache[map.options.minZoom].push(label);
                label.setZoomVisble(map.options.minZoom, true);
                label.minZoomVisble = true;
            }
            else {
                label.minZoomVisble = false;
                label.setZoomVisble(map.options.minZoom, false);
            }
            //缓存当前级别可见要标注
            if (label.show) {
                if (!_labelCache[map._zoom]) {
                    _labelCache[map._zoom] = [];
                }
                _labelCache[map._zoom].push(label);
                //标记当前级别可见
                label.setZoomVisble(map._zoom, true);
            }
        }
        return {
            getLabelLayers: function () {
                return LabelList;
            },
            getLabelByPoiNum: function (poiNum) {
                var length = LabelList.length;
                while (length--) {
                    if (LabelList[length].poiNum == poiNum) {
                        return LabelList[length];
                    }
                }
            },
            getLabelGroupLayer: function () {
                return _groupLayer;
            },
            getLabelCache: function () {
                return _labelCache;
            },
            setLableEnvirement: function (labelCache, labellist, labelGrouplayer) {
                _labelCache = labelCache;
                LabelList = labellist;
                _groupLayer = labelGrouplayer;
            },
            eachLabel: function (func) {
                for (var i = 0; i < LabelList.length; i++) {
                    func(LabelList[i]);
                }
            },
            removeLabelCache: function (label, zoom) {
                var labels = _labelCache[zoom];
                if (labels) {
                    for (var i = 0; i < labels.length; i++) {
                        if (label == labels[i])
                            labels.splice(i, 1);
                    }
                }
            },
            clearAll: function () {
                _page.Scene._removeLayers(LabelList);
                LabelList = [];
                _clearList = [];
                _labelCache = {};
            },
            allLabelsHidden: false,
            hideLabel: function (poiNum, x, y) {
                for (var i = 0; i < LabelList.length; i++) {
                    if (LabelList[i].poiNum == poiNum) {
                        LabelList[i].iconLabelHide();
                        return;
                    }
                }
            },
            hideAllLabels: function () {
                _page.Scene._hideLayers(LabelList);
                allLabelsHidden = true;
            },
            prettyShow: function () {
                var map = _page.Scene.getMap();
                //分级显示图层顺序
                _page.Scene.filterLayersByZoom();
                //最小级别时不显示
                if (LabelList.length == 0 || parseInt(_page.Scene.getMap()._zoom) == map.options.minZoom) {
                    return;
                }
                //是否局部刷新
                var isPartialRefresh = _isPartialRefresh();
                _getRatio();
                //适当外扩
                var bound = map.getBounds().pad(0.1);
                var currentZoom = Math.round(_page.Scene.getMap()._zoom);

                //若当前级别缓存存在，且当前级别为最小级别
                if (_labelCache[currentZoom]) {
                    var labelCacheList = _labelCache[currentZoom];
                    for (var i = 0; i < labelCacheList.length; i++) {
                        var label = labelCacheList[i];
                        label.filterByZoom(currentZoom);
                        label.show = true;
                        //anJ 是否隐藏图标
                        if (label._labelHideStatus) {
                            $(label._container).addClass("hide");
                            label.show = false;
                        } else {
                            //局部刷新时，不在当前视图范围内
                            if (isPartialRefresh && !bound.contains(label._latlng)) {
                                $(label._container).addClass("hide");
                                label.show = false;
                                continue;
                            }
                            $(label._container).removeClass("hide");
                        }
                    }
                }
                else {//不存在则重新计算
                    _labelCache[currentZoom] = [];
                    for (var i = 0; i < LabelList.length; i++) {
                        var label = LabelList[i];
                        label.filterByZoom(currentZoom);
                        if (label._labelHideStatus) {
                            $(label._container).addClass("hide");
                            label.show = false;
                            continue;
                        }
                        var OL_Array = label.OL_Array;//获取当前级别压盖缓存
                        if (!OL_Array) {//与其它POI都不压盖
                            _labelCache[currentZoom].push(label);
                            $(label._container).removeClass("hide");
                            label.show = true;
                            continue;
                        }
                        var bOverlap = false;
                        for (var j = 0; j < OL_Array.length; j++) {
                            var label_OL = OL_Array[j];
                            if (label_OL == label) continue;
                            if (_checkHit(_getInfo(label, zoomRatio), _getInfo(label_OL, zoomRatio))) { //anJ 系数从2.0缩小到1.5
                                if (label_OL.show) {
                                    if ((label.haveIcon && !label_OL.haveIcon) || label.getZoomVisble(currentZoom - 1)) {//图标优先显示
                                        $(label_OL._container).addClass("hide");
                                        label_OL.show = false;
                                        this.removeLabelCache(label_OL, currentZoom);
                                    }
                                    if ((!label.haveIcon && label_OL.haveIcon) || !label.getZoomVisble(currentZoom - 1)) {
                                        bOverlap = true;
                                        break;
                                    }
                                } else {
                                    //$(label_OL._container).addClass("hide");
                                    //label_OL.show = false;
                                }
                            }
                        }

                        //是否存在压盖
                        if (!bOverlap) {
                            _labelCache[currentZoom].push(label);
                            label.setZoomVisble(currentZoom, true);

                            $(label._container).removeClass("hide");
                            label.show = true;
                        }
                        else {
                            $(label._container).addClass("hide");
                            label.show = false;
                        }
                    }
                    //局部刷新
                    if (isPartialRefresh) {
                        for (var k = 0; k < _labelCache[currentZoom].length; k++) {
                            var _label = _labelCache[currentZoom][k];
                            if (!bound.contains(_label._latlng)) {
                                $(_label._container).addClass("hide");
                                _label.show = false;
                            }
                        }
                    }
                    delete _labelCache[currentZoom];//删除缓存，此种方式
                }
                //标注是否显示标记
                allLabelsHidden = false;
            },
            addLabel: function (jsonData) {
                var labelTitle = new Label(jsonData.latlng, jsonData.name, {}, jsonData.type);
                labelTitle.poiNum = jsonData.poiNum;
                labelTitle.two_class = jsonData.two_class;
                labelTitle.class_extension = jsonData.class_extension;
                labelTitle.layer = jsonData.layer;
                LabelList.push(labelTitle);

                if (_groupLayer == null) {
                    _groupLayer = L.layerGroup();
                    _page.Scene.addLayer(_groupLayer);
                }
                _groupLayer.addLayer(labelTitle);
                labelTitle._nowLayer = arguments[1];
                labelTitle.setDisplayStyle();
                labelTitle.show = true;
                _findOverlapLabels(labelTitle);
            },
            resetIconStatus: function () {
                for (var i = 0; i < LabelList.length; i++) {
                    LabelList[i].iconLabelShow();
                }
            }
        }
    })();

    /*
     * Scene
     * */
    _page.Scene = (function () {

        function checkMap() {
            if (!_map) {
                throw new Error("you need create Map first!");
            }
        }

        var _map = null;
        var _parentDOM = null;
        var POI_layer = null;
        var POI_layer_childs = {};
        var TypeData_Layer = {};
        var BK_layer = null;
        var FN_layer = null;
        var _nowFloor = null;
        var _buildBounds = null;
        var otherMarker = {};

        var _shoppingLayers = [];
        var _trafficLayers = [];

        var _Events = {
            _call: function (key, ary) {
                var events = this[key];
                if (events) {
                    for (var i = 0; i < events.length; i++) {
                        events[i].apply(this, ary);
                    };
                }
            },
            changeFloor: [],
            BKClick: [],
            poiClick: []
        };

        var _layersCache = {};//楼层数据缓存
        var _allowPoiClick = true;//是否允许POI点击

        function _getBuildBounds(data) {
            var f = data.features;
            var aryX = [];
            var aryY = [];
            for (var i = 0; i < f.length; i++) {
                var temp = f[i];
                if (temp.geometry.type == "MultiPolygon") {
                    var coords = temp.geometry.coordinates[0][0];
                    for (var j = 0; j < coords.length; j++) {
                        aryX.push(coords[j][0]);
                        aryY.push(coords[j][1]);
                    }
                }
                else {
                    for (var k = 0; k < temp.geometry.coordinates[0].length; k++) {
                        var coords = temp.geometry.coordinates[0][k];
                        for (var j = 0; j < coords.length; j++) {
                            aryX.push(coords[0]);
                            aryY.push(coords[1]);
                        }
                    }
                }
            }
            aryX.sort(function (a, b) {
                return parseFloat(a) - parseFloat(b);
            });
            aryY.sort(function (a, b) {
                return parseFloat(a) - parseFloat(b);
            });
            var x = (aryX[0] + aryX[aryX.length - 1]) / 2;
            var y = (aryY[0] + aryY[aryY.length - 1]) / 2;
            var d = {
                left: aryX[0],
                right: aryX[aryX.length - 1],
                bottom: aryY[0],
                top: aryY[aryY.length - 1],
                centerX: x,
                centerY: y
            };
            return d;
        }

        var fistrLoad = true;

        //f-楼层，callback-绘制
        function _renderFloor(f, callback, fmark) {
            //加载数据
            _nowFloor = f;
            if (_layersCache[f]) {
                //若已缓存过
                POI_layer = _layersCache[f].poi_layer;
                POI_layer_childs = _layersCache[f].poi_layer_childs;
                BK_layer = _layersCache[f].bk_layer;
                FN_layer = _layersCache[f].fn_layer;
                TypeData_Layer = _layersCache[f].typedata_layers;

                BK_layer ? Rtmap.Scene.addLayer(BK_layer) : "";
                BK_layer ? BK_layer.hide = false : "";
                FN_layer ? Rtmap.Scene.addLayer(FN_layer) : "";
                FN_layer ? FN_layer.hide = false : "";
                for (var layer in TypeData_Layer) {
                    if (TypeData_Layer[layer].addToMap) {
                        Rtmap.Scene.addLayer(TypeData_Layer[layer]);
                        TypeData_Layer[layer].hide = false;
                    }
                }
                POI_layer ? Rtmap.Scene.addLayer(POI_layer) : "";
                POI_layer ? POI_layer.hide = false : "";
                Rtmap.Scene.filterLayersByZoom();
                //添加注记
                Rtmap.PoiLabelFactory.setLableEnvirement(_layersCache[f].labelCache, _layersCache[f].labelLayers, _layersCache[f].labelGrouplayer);
                for (var i = 0; i < _layersCache[f].labelLayers.length; i++) {
                    if (!_layersCache[f].labelLayers[i]) continue;
                    Rtmap.Scene.addLayer(_layersCache[f].labelLayers[i]);
                    _layersCache[f].labelLayers[i].setDisplayStyle();
                }
                Rtmap.PoiLabelFactory.hideAllLabels();
                Rtmap.PoiLabelFactory.prettyShow();
                _Events._call("drawedMap", [f, fmark])
                callback ? callback() : "";
            }
            else {
                var temp = {};
                var BKData, FNData, PoiData;
                var TypeData = {};
                Rtmap.DataProvider.getBK({ floor: f }, function (data) {
                    BKData = data;
                    _buildBounds ? "" : _buildBounds = _getBuildBounds(data);
                    //第一次加载完BK层后设置地图范围
                    if (fistrLoad) {
                        if (_fitGeoBounds())
                            fistrLoad = false;
                    }
                    Rtmap.Scene.createBK(BKData);
                    Rtmap.DataProvider.getFN({ floor: f }, function (data) {
                        FNData = data;
                        Rtmap.Scene.createFN(FNData);
                        Rtmap.DataProvider.getPoi({ floor: f }, function (data) {
                            PoiData = data;
                            //var t1 = new Date().getTime();
                            Rtmap.Scene.createPoi(PoiData);
                            //var t2 = new Date().getTime();
                            //console.log((t2 - t1) / 1000.00);
                        });

                        Rtmap.DataProvider.getTypeData({ floor: f }, "infrastructure", function (data) {
                            TypeData.InfrastructureData = data;
                            Rtmap.Scene.createTypeData(TypeData.InfrastructureData, "infrastructure");
                        });

                        //停车场
                        //Rtmap.DataProvider.getTypeData({ floor: f }, "parking", function (data) {
                        //    TypeData.ParkingData = data;
                        //    Rtmap.Scene.createTypeData(TypeData.ParkingData, "parking");
                        //});

                        Rtmap.DataProvider.getTypeData({ floor: f }, "traffic", function (data) {
                            TypeData.TrafficData = data;
                            Rtmap.Scene.createTypeData(TypeData.TrafficData, "traffic", true);
                            _Events._call("drawedMap", [f, fmark])
                            callback ? callback() : "";

                            //缓存当前楼层数据
                            _layersCache[f] = {
                                layers: TypeData_Layer,
                                bk_layer: BK_layer,
                                fn_layer: FN_layer,
                                poi_layer: POI_layer,
                                poi_layer_childs: POI_layer_childs,
                                typedata_layers: TypeData_Layer,
                                labelCache: _page.PoiLabelFactory.getLabelCache(),
                                labelLayers: _page.PoiLabelFactory.getLabelLayers(),
                                labelGrouplayer: _page.PoiLabelFactory.getLabelGroupLayer()
                            };
                        });
                    });
                });
            }
        };

        function _bindEventToMap() {
            _map.on("move", function (a, b, c) {
                _Events._call("mapAction")
            });
            _map.on("click", function () {
                _Events._call("mapAction")
                _Events._call("mapClick")
            });
            _map.on("drag", function (a, b, c) {
                _Events._call("mapAction")
                _Events._call("mapDrag")
                return false;
            });
            //判断是否超出范围
            function rePosition() {
                var b = _map.getCenter();
                var bounds = _page.Scene.getBuildBounds();
                var latlng = L.CRS.EPSG3395.projection.project(b);
                var finalX = latlng.x;
                var finalY = latlng.y;
                var slopOver = false;
                if (latlng.x < bounds.left) {
                    finalX = bounds.left;
                    slopOver = true;
                } else if (latlng.x > bounds.right) {
                    finalX = bounds.right;
                    slopOver = true;
                }
                if (latlng.y > bounds.top) {
                    finalY = bounds.top;
                    slopOver = true;
                } else if (latlng.y < bounds.bottom) {
                    finalY = bounds.bottom;
                    slopOver = true;
                }
                if (slopOver) {
                    _page.Scene.moveTo({ x: finalX, y: finalY });
                }
            }
            _map.on("dragend", function (a, b) {
                rePosition();
            });

            _map.on("zoomstart", function () {
                _page.PoiLabelFactory.hideAllLabels();
                window.clearTimeout(window.zoomLabelRefreshTimer);
            });

            function zoomLabelRefresh() {
                _page.PoiLabelFactory.prettyShow();
                window.clearTimeout(window.zoomLabelRefreshTimer);
            };

            function dragLabelRefresh() {
                map = _page.Scene.getMap();
                //大比例尺时，换为局部刷新
                var ratio = parseInt((map.options.maxZoom - map.options.minZoom) / 2);
                if (map.options.maxZoom - parseInt(map._zoom) <= ratio) {
                    _page.PoiLabelFactory.prettyShow();
                }
            };

            window.zoomLabelRefresh = zoomLabelRefresh;
            window.dragLabelRefresh = dragLabelRefresh;
            _map.on("zoomend", function () {
                //window.zoomLabelRefreshTimer = window.setTimeout("zoomLabelRefresh()", 500);
                _page.PoiLabelFactory.prettyShow();
            });

            _map.on('dragstart', function () {
                //window.clearTimeout(window.dragLabelRefreshTimer);
            });

            _map.on('dragend', function () {
                //window.dragLabelRefreshTimer = window.setTimeout("dragLabelRefresh()", 500);
                map = _page.Scene.getMap();
                //大比例尺时，换为局部刷新
                if (map._zoom > (map.options.minZoom + 2)) {
                    _page.PoiLabelFactory.prettyShow();
                }
            });

            if (debugTools) {
                $("#show").show();
            }
        }

        function _clearAll() {
            _page.PoiLabelFactory.clearAll();
            POI_layer ? _map.removeLayer(POI_layer) : "";
            BK_layer ? _map.removeLayer(BK_layer) : "";
            FN_layer ? _map.removeLayer(FN_layer) : "";
            for (var i in otherMarker) {
                if (otherMarker[i].length > 0) {
                    for (var j = 0; j < otherMarker[i].length; j++) {
                        _map.removeLayer(otherMarker[i][j]);
                    }
                }
            }
            for (var k in TypeData_Layer) {
                _map.removeLayer(TypeData_Layer[k]);
            }
            TypeData_Layer = {};
            POI_layer = null;
            BK_layer = null;
            FN_layer = null;
        }
        function _on(action, callback) {
            if (!_Events[action]) {
                _Events[action] = [];
            }
            _Events[action].push(callback);
        }
        function _getNowFloor() {
            return _nowFloor;
        }
        function _getPoiByNum(floor, num) {
            //var layerId=POI_layer_childs[floor][num];
            //var poiLayer = POI_layer.getLayer(layerId);
            //return poiLayer;
            for (var i in TypeData_Layer) {
                var childLayers = TypeData_Layer[i].getLayers();
                for (var j = 0; j < childLayers.length; j++) {
                    if (childLayers[j].poiNo == num)
                        return childLayers[j];
                }
            }
        }

        function _getPoiByName(floor, name) {
            for (var i in TypeData_Layer) {
                var childLayers = TypeData_Layer[i].getLayers();
                for (var j = 0; j < childLayers.length; j++) {
                    if (childLayers[j].feature.properties.name_chinese == name)
                        return childLayers[j];
                }
            }
        }

        function _changeFloorTo(f, dashboardMark,callback) {
            _page.Scene.clearAll();
            f = f.toLowerCase();
            _renderFloor(f, callback, dashboardMark);
            _Events._call("changeFloor", arguments);
        }

        function _initMap(_option, callback) {
            if (_map) { return; }
            var that = this;
            var option = _option || {};
            option.crs = option.crs || L.CRS.EPSG3395;
            option.center = option.center || [-50, 115];
            option.zoom = option.zoom || 1;
            option.zoomControl = option.zoomControl || false;
            var center = L.CRS.EPSG3395.projection.unproject(new L.Point(115, -35));
            var drawMoreRatio = 1;//地图多绘制屏幕比例
            var inertia = false;
            var noMoveStart = false;
            Rtmap.Scene.maxZoom = 22;
            if (navigator.userAgent.indexOf("iPhone") != -1) {
                noMoveStart = false;
                inertia = true;
                //地图多绘制屏幕比例
                drawMoreRatio = 0.8;
            } else {
                noMoveStart = true;
                inertia = false;
                //地图多绘制屏幕比例
                drawMoreRatio = 0.0;
            }

            _map = new L.Map(option.parentDOM, {
                crs: L.CRS.EPSG3395,
                center: center,
                zoom: 16,
                minZoom: 16,
                maxZoom: 22,
                zoomControl: false,
                attributionControl: false,
                bounceAtZoomLimits: false,
                doubleClickZoom: false,
                inertia: inertia,//惯性平滑
                noMoveStart: noMoveStart
            });
            _map._drawMoreRatio = drawMoreRatio;
            _bindEventToMap();
            _parentDOM = $("#" + option.parentDOM);
            return this;
        }

        function _panBy(ary) {
            _map.panBy(ary);
        }

        function _createMarker(json) {
            var latlng;
            if (json.Lat && json.Lng) {
                var latlng = new L.Point(json.Lat, json.Lng);
            } else if (json.x && json.y) {
                var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(json.x, json.y));
            } else {
                return false;
            }
            var marker;
            if (json.type == "circle") {
                json.color = json.color || "#1e6ac0";
                json.fillColor = json.fillColor || "#1e6ac0";
                marker = L.circleMarker(latlng, json).addTo(_map);
            } else {
                var blueIconUrl = _page.Style.getGlobalConfig("normal_icon_url");
                var _blueIcon = L.icon({
                    iconUrl: blueIconUrl,
                    iconRetinaUrl: blueIconUrl,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    shadowSize: [68, 95],
                    shadowAnchor: [22, 94]
                });
                json.icon = json.icon || _blueIcon;
                marker = L.marker(latlng, json).addTo(_map);
            }
            json.floor = json.floor || Rtmap.Scene.getNowFloor().toLowerCase();
            if (!otherMarker[json.floor]) {
                otherMarker[json.floor] = [];
            }
            otherMarker[json.floor].push(marker);
            return marker;
        }

        function _createLine(json, option) {
            var latlngs = [];
            if (json.PointA.Lat && json.PointA.Lng) {
                var latlngA = new L.Point(json.pointA.Lat, json.pointA.Lng);
                var latlngB = new L.Point(json.pointB.Lat, json.pointB.Lng);
                latlngs.push(latlngA, latlngB);
            } else if (json.PointA.x && json.PointA.y) {
                var latlngA = L.CRS.EPSG3395.projection.unproject(new L.Point(json.PointA.x, json.PointA.y));
                var latlngB = L.CRS.EPSG3395.projection.unproject(new L.Point(json.PointB.x, json.PointB.y));
                latlngs.push(latlngA, latlngB);
            } else {
                return false;
            }
            var polyline = L.polyline(latlngs, { color: 'red' }).addTo(_map);
            if (!otherMarker[json.floor]) {
                otherMarker[json.floor] = [];
            }
            otherMarker[json.floor].push(polyline);
            return polyline;
        }

        _on("changeFloor", function (floor) {
            if (!otherMarker[floor]) {
                return;
            }
            for (var i = 0; i < otherMarker[floor].length; i++) {
                _map.addLayer(otherMarker[floor][i]);
            }
        });

        //专题数据空间查询(针对点)
        function _spatialQueryTypeData(latlng) {
            //var t1 = new Date().getTime();
            var labelLayers = Rtmap.PoiLabelFactory.getLabelLayers();
            for (var i = 0; i < labelLayers.length; i++) {
                var label = labelLayers[i];
                if (label._nowLayer._latlng && label.show) {
                    var bound = label.getBounds();
                    if (bound.contains(latlng)) {
                        //var testRect = L.rectangle([bound.getSouthWest(), bound.getNorthEast()], { color: "#ff7800", weight: 1 }).addTo(Rtmap.Scene.getMap());
                        //var t2 = new Date().getTime();
                        //console.log((t2 - t1) / 1000.00);
                        return label._nowLayer;
                    }
                }
            }
            //var t2 = new Date().getTime();
            //console.log((t2 - t1) / 1000.00);
        }

        function _fitGeoBounds(geo) {
            if (geo) {
                _map.fitBounds(geo.getBounds().pad(0.5));
                return true;
            } else {
                _map.options.minZoom = 17;
                if (_buildBounds.left && _buildBounds.top) {
                    var pointA = new L.Point(_buildBounds.left, _buildBounds.top);
                    var pointB = new L.Point(_buildBounds.right, _buildBounds.bottom);
                    var latlngA = L.CRS.EPSG3395.projection.unproject(pointA);
                    var latlngB = L.CRS.EPSG3395.projection.unproject(pointB);
                    var line = L.polyline([latlngA, latlngB]);
                    var d = _map.getBoundsZoom(line.getBounds(), false);
                    _map.fitBounds(line.getBounds().pad(0.5), {
                        zoom: 16
                    });
                    _map.options.minZoom = d - 1;
                    Rtmap.Scene.minZoom = d - 1;
                    return true;
                }
            }
            return false;
        }

        return {
            clearAll: _clearAll,
            on: _on,
            getNowFloor: _getNowFloor,
            getPoiByNum: _getPoiByNum,
            getPoiByName:_getPoiByName,
            changeFloorTo: _changeFloorTo,
            initMapContext: _initMap,
            panBy: _panBy,
            createMarker: _createMarker,
            createLine: _createLine,
            eachPoiNameLayer: function (callback) {
                _page.PoiLabelFactory.eachLabel(callback)
            },
            getMap: function () {
                return _map;
            },
            //设置当前场景
            setSceneModel: function (modelName, callBack) {
                if (modelName == "flying") {
                    //Rtmap.Scene.moveTo({ x: 604, y: -530 }, Rtmap.Scene.getMap().zoom);
                    //Rtmap.Scene.changeFloorTo("f3");
                    Rtmap.Scene.ScenceModel = modelName;
                }
                if (modelName == "shopping") {
                    //Rtmap.Scene.moveTo({ x: 585, y: -519 }, Rtmap.Scene.getMap().zoom);
                    //Rtmap.Scene.changeFloorTo("f3");
                }
                if (modelName == "parking") {
                    Rtmap.Scene.moveTo({ x: 608, y: -402 }, Rtmap.Scene.getMap().zoom);
                    Rtmap.Scene.changeFloorTo("f1");
                }
                Rtmap.Scene.ScenceModel = modelName;
                callBack();
            },
            setAllowPoiClick: function (isAllow) {
                _allowPoiClick = isAllow;
            },
            fitBounds: _fitGeoBounds,
            _getParentDOM: function () {
                return _parentDOM;
            },
            getBuildBounds: function () {
                return _buildBounds;
            },
            getCenter: function () {
                return { x: _buildBounds.centerX, y: _buildBounds.centerY }
            },
            moveToCenter: function (zoom) {
                var c = this.getCenter();
                var center = L.CRS.EPSG3395.projection.unproject(new L.Point(c.x, c.y));
                _map.setView(center, zoom);
            },
            moveTo: function (json, zoom) {
                var latlng;
                if (typeof (json.Lat) != "undefined" && typeof (json.Lng) != "undefined") {
                    var latlng = new L.Point(json.Lat, json.Lng);
                } else if (typeof (json.x) != "undefined" && typeof (json.y) != "undefined") {
                    var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(json.x, json.y));
                } else {
                    return false;
                }
                _map.setView(latlng, zoom);
            },
            setZoom: function (num) {
                _map.setZoom(num);

            },
            addLayer: function (Layer) {
                _map.addLayer(Layer);
            },
            getLayer: function () {
                return POI_layer;
            },
            getFNLayer: function () {
                return FN_layer;
            },
            getBKLayer: function () {
                return BK_layer;
            },
            getTypeDataLayer: function () {
                return TypeData_Layer;
            },
            removeMarker: function (Layer) {
                Layer.animate ? Layer.animate.stop() : "";
                Layer ? _map.removeLayer(Layer) : "";
            },
            removeLayer: function (Layer, removeFromCache) {
                if (removeFromCache) {
                    for (var i in otherMarker) {
                        if (otherMarker[i].length > 0) {
                            for (var j = 0; j < otherMarker[i].length; j++) {
                                if (otherMarker[i][j] == Layer) {
                                    otherMarker[i].splice(j, 1);
                                }
                            }
                        }
                    }
                }
                Layer ? _map.removeLayer(Layer) : "";
            },
            _removeLayers: function (Layers) {
                for (var i = 0; i < Layers.length; i++) {
                    Layers[i] ? _map.removeLayer(Layers[i]) : "";
                }
            },
            _hideLayers: function (/*array*/Layers) {
                for (var i = 0; i < Layers.length; i++) {
                    if (!Layers[i].show) continue;
                    $(Layers[i]._container).addClass("hide");
                    //$(Layers[i]._container).hide();
                    Layers[i].show = false;
                }
            },
            _showLayers: function (/*array*/Layers) {
                var length = Layers.length;
                for (var i = 0; i < length; i++) {
                    if (Layers[i].show) continue;
                    $(Layers[i]._container).removeClass("hide");
                    //$(Layers[i]._container).show();
                    Layers[i].show = true;
                }
            },
            createFN: function (FNData) {
                checkMap();
                FN_layer = L.geoJson(FNData, {
                    style: {},
                    filter: function (f, layer) {
                        if (f.properties.style > 20)
                            return false;
                        else
                            return true;
                    },
                    coordsToLatLng: function (coords) {
                        var point = L.point(coords[0], coords[1]);
                        var d = L.CRS.EPSG3395.projection.unproject(point);
                        return d;
                    },
                    onEachFeature: function (f, layer) {
                        var layerStyle = f.properties.style;
                        layer.setStyle(_page.Style.getStyleByPoiType(layerStyle));
                    }
                }).addTo(_map);
                FN_layer.on("click", function (e) {
                    if (_allowPoiClick) {
                        //检索点状图层标注（解决点状图层无法选中的问题）
                        var layer = _spatialQueryTypeData(e.latlng);
                        _Events._call("poiClick", [e, layer])
                    }
                });
            },
            createBK: function (BKData) {
                checkMap();
                BK_layer = L.geoJson(BKData, {
                    style: {},
                    coordsToLatLng: function (coords) {
                        var point = L.point(coords[0], coords[1]);
                        var d = L.CRS.EPSG3395.projection.unproject(point);
                        return d;
                    },
                    onEachFeature: function (f, layer) {
                        var layerStyle = f.properties.style;
                        layer.setStyle(_page.Style.getStyleByPoiType(layerStyle));
                    }
                }).addTo(_map);
                BK_layer.on("click", function (e) {
                    if (_allowPoiClick) {
                        _Events._call("BKClick", [e]);
                        //检索点状图层标注（解决点状图层无法选中的问题）
                        var layer = _spatialQueryTypeData(e.latlng);
                        _Events._call("poiClick", [e, layer])
                    }
                });
            },
            createPoi: function (poiData) {
                checkMap();
                if (!poiData) {
                    throw new Error("createPoi function need arguments!");
                    return;
                }
                var nullGeoCount = 0;
                for (var i = 0; i < poiData.features.length; i++) {
                    var f = poiData.features[i];
                    if (!f.geometry) {
                        nullGeoCount++;
                    };
                }
                function _bindEventToLayer(f, layer) {
                    var poiStyle = f.properties.style;
                    layer.on({
                        click: function (data) {
                            if (_allowPoiClick) {
                                _Events._call("poiClick", [data, layer])
                            }
                        }
                    });
                };
                var iCount = 0;
                POI_layer = L.geoJson(poiData, {
                    crs: L.CRS.EPSG3395,
                    style: {},
                    coordsToLatLng: function (coords) {
                        var point = L.point(coords[0], coords[1]);
                        var d = L.CRS.EPSG3395.projection.unproject(point);
                        return d;
                    },
                    onEachFeature: function (f, layer) {
                        var name = f.properties['name_chinese'];
                        var type = f.properties["style"];
                        var poiNum = f.properties.poi_no;
                        var layerId = layer._leaflet_id;
                        if (name && name != "") {
                            var point = L.point(f.properties.x_coord, f.properties.y_coord);
                            var latlng = L.CRS.EPSG3395.projection.unproject(point);
                            _page.PoiLabelFactory.addLabel({
                                latlng: latlng,
                                name: name,
                                type: type,
                                poiNum: poiNum,
                                two_class: f.properties.two_class,
                                layer: layer,
                                class_extension: f.properties.class_extension
                            }, layer); //anJ 传入layer
                        }
                        var poiStyle = f.properties.style;
                        //乘机相关换成黄底
                        if (Rtmap.Classification.travelpoi.isTravelPoi(f.properties.two_class)) {
                            layer.setStyle({
                                type: 5,                 //poi
                                fillColor: "#e8c377",       //填充颜色
                                color: "#af7d0c",           //边框颜色
                                weight: 0.5,                  //边框宽度
                                opacity: 1,                  //边框透明度
                                fillOpacity: 1,              //填充透明度,
                                hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                    fillColor: "#dddddd",
                                    color: "#e9bbba",
                                    weight: 0.5,
                                    opacity: 1,
                                    fillOpacity: 1
                                }
                            });
                        }
                            //机场相关POI
                        else if (Rtmap.Classification.airportpoi.isAirportpoi(f.properties.two_class)) {
                            layer.setStyle({
                                type: 5,                 //poi
                                fillColor: "#d0dee2",       //填充颜色
                                color: "#8eadc1",           //边框颜色
                                weight: 0.5,                  //边框宽度
                                opacity: 1,                  //边框透明度
                                fillOpacity: 1,              //填充透明度,
                                hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                    fillColor: "#dddddd",
                                    color: "#e9bbba",
                                    weight: 0.5,
                                    opacity: 1,
                                    fillOpacity: 1
                                }
                            });
                        }
                            //商业相关POI
                        else if (Rtmap.Classification.businesspoi.isBusinessPoi(f.properties.two_class)) {
                            layer.setStyle({
                                type: 5,                 //poi
                                fillColor: "#d8e0ca",       //填充颜色
                                color: "#97a869",           //边框颜色
                                weight: 0.5,                  //边框宽度
                                opacity: 1,                  //边框透明度
                                fillOpacity: 1,              //填充透明度,
                                hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                    fillColor: "#dddddd",
                                    color: "#e9bbba",
                                    weight: 0.5,
                                    opacity: 1,
                                    fillOpacity: 1
                                }
                            });
                        }
                            //餐饮相关POI
                        else if (Rtmap.Classification.restaurantpoi.isRestaurantPoi(f.properties.two_class)) {
                            layer.setStyle({
                                type: 5,                 //poi
                                fillColor: "#efe5ce",       //填充颜色
                                color: "#c9a659",           //边框颜色
                                weight: 0.5,                  //边框宽度
                                opacity: 1,                  //边框透明度
                                fillOpacity: 1,              //填充透明度,
                                hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                    fillColor: "#dddddd",
                                    color: "#e9bbba",
                                    weight: 0.5,
                                    opacity: 1,
                                    fillOpacity: 1
                                }
                            });
                        }
                        else {
                            layer.setStyle(_page.Style.getStyleByPoiType(poiStyle));
                        }
                        layer.poiNo = poiNum;
                        _bindEventToLayer(f, layer);
                    }
                });//.addTo(_map);
                TypeData_Layer["POI"] = POI_layer;
                POI_layer.hide = true;
                //是否为捕获模式
                if (Page.capturemode)
                    Rtmap.FeatureSelect.initCenterPoint();
            },
            createTypeData: function (typeData, typeName, show) {
                checkMap();
                if (!typeData) {
                    throw new Error("createTypeData function need arguments!");
                    return;
                }
                var nullGeoCount = 0;
                for (var i = 0; i < typeData.features.length; i++) {
                    var f = typeData.features[i];
                    if (!f.geometry) {
                        nullGeoCount++;
                    };
                }
                function _bindEventToLayer(f, layer) {
                    var poiStyle = f.properties.style;
                    layer.on({
                        click: function (data) {
                            if (_allowPoiClick) {
                                _Events._call("poiClick", [data, layer])
                            }
                        }
                    });
                };
                var iCount = 0;
                var type_layer = L.geoJson(typeData, {
                    crs: L.CRS.EPSG3395,
                    style: {},
                    coordsToLatLng: function (coords) {
                        var point = L.point(coords[0], coords[1]);
                        var d = L.CRS.EPSG3395.projection.unproject(point);
                        return d;
                    },
                    onEachFeature: function (f, layer) {
                        var name = f.properties['name_chinese'];
                        var type = f.properties["style"];
                        var poiNum = f.properties.poi_no;
                        if (!POI_layer_childs[f.properties["floor"]]) {
                            POI_layer_childs[f.properties["floor"]] = {};
                        }
                        var layerId = layer._leaflet_id;
                        POI_layer_childs[f.properties["floor"]][poiNum] = layerId;
                        if (name && name != "") {
                            var point = L.point(f.properties.x_coord, f.properties.y_coord);
                            var latlng = L.CRS.EPSG3395.projection.unproject(point);
                            _page.PoiLabelFactory.addLabel({
                                latlng: latlng,
                                name: name,
                                type: type,
                                poiNum: poiNum,
                                two_class: f.properties.two_class,
                                layer: layer,
                                class_extension: f.properties.class_extension
                            }, layer); //anJ 传入layer
                        }
                        var poiStyle = f.properties.style;
                        //点图层无此方法
                        if (layer.setStyle) {
                            //乘机相关换成黄底
                            if (Rtmap.Classification.travelpoi.isTravelPoi(f.properties.two_class)) {
                                layer.setStyle({
                                    type: 5,                 //poi
                                    fillColor: "#e8c377",       //填充颜色
                                    color: "#af7d0c",           //边框颜色
                                    weight: 0.5,                  //边框宽度
                                    opacity: 1,                  //边框透明度
                                    fillOpacity: 1,              //填充透明度,
                                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                        fillColor: "#dddddd",
                                        color: "#e9bbba",
                                        weight: 0.5,
                                        opacity: 1,
                                        fillOpacity: 1
                                    }
                                });
                            }
                            else if (Rtmap.Classification.airportpoi.isAirportpoi(f.properties.two_class)) { //机场相关POI
                                layer.setStyle({
                                    type: 5,                 //poi
                                    fillColor: "#d0dee2",       //填充颜色
                                    color: "#8eadc1",           //边框颜色
                                    weight: 0.5,                  //边框宽度
                                    opacity: 1,                  //边框透明度
                                    fillOpacity: 1,              //填充透明度,
                                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                                        fillColor: "#dddddd",
                                        color: "#e9bbba",
                                        weight: 0.5,
                                        opacity: 1,
                                        fillOpacity: 1
                                    }
                                });
                            }
                            else {
                                layer.setStyle(_page.Style.getStyleByPoiType(poiStyle));
                            }
                        }
                        if (show) _bindEventToLayer(f, layer);
                        layer.poiNo = poiNum;
                        layer.dataType = typeName;
                    }
                })//.addTo(_map);
                if (show) {
                    type_layer.addTo(_map);
                    type_layer.addToMap = true;
                }
                //_map.indexLayer(type_layer);
                TypeData_Layer[typeName] = type_layer;
                return type_layer;
            },
            //根据比例尺筛选图层
            filterLayersByZoom: function () {
                map = _page.Scene.getMap();
                var fnLayer = _page.Scene.getFNLayer();
                if (map._zoom < 16.2) {
                    if (fnLayer && !fnLayer.hide) {
                        map.removeLayer(fnLayer);
                        fnLayer.hide = true;
                    }
                }
                else {
                    if (fnLayer && fnLayer.hide) {
                        map.addLayer(fnLayer);
                        fnLayer.hide = false;
                    }
                    Rtmap.TrackFactory.resetTrackLine();
                }
                if (map._zoom <= 17.2) {
                    var typeDataLayers = _page.Scene.getTypeDataLayer();
                    if (typeDataLayers["POI"] && !typeDataLayers["POI"].hide) {
                        map.removeLayer(typeDataLayers["POI"]);
                        typeDataLayers["POI"].hide = true;
                    }

                    if (typeDataLayers["traffic"] && !typeDataLayers["traffic"].hide) {
                        map.removeLayer(typeDataLayers["traffic"]);
                        typeDataLayers["traffic"].hide = true;
                    }
                    Rtmap.TrackFactory.resetTrackLine();
                }
                else if (map._zoom > 17.2) {
                    var typeDataLayers = _page.Scene.getTypeDataLayer();
                    if (typeDataLayers["POI"] && typeDataLayers["POI"].hide) {
                        map.addLayer(typeDataLayers["POI"]);
                        typeDataLayers["POI"].hide = false;
                    }

                    if (typeDataLayers["traffic"] && typeDataLayers["traffic"].hide) {
                        map.addLayer(typeDataLayers["traffic"]);
                        typeDataLayers["traffic"].hide = false;
                    }
                    Rtmap.TrackFactory.resetTrackLine();
                }
            }
        }
    })();

    _page.Style = (function () {
        var globalConfig = {
            canvas_color: "#fcffd5",
            focus_icon_url: "./public/img/red.png",
            font_color: "#000000",
            normal_icon_url: "./public/img/blue.png",
            start_icon_url: "./public/img/start.png",
            end_icon_url: "./public/img/end.png",
            /* start anJ*/
            wc_icon_url: "./public/img/wc.png",
            atm_icon_url: "./public/img/atm.png",
            cashier_desk_icon_url: "./public/img/cashier_desk.png",
            information_desk_icon_url: "./public/img/information_desk.png",
            elevator_icon_url: "./public/img/elevator.png",
            ladder_icon_url: "./public/img/escalator.png",
            stairway_icon_url: "./public/img/stairway.png",
            doorway_icon_url: "./public/img/doorway.png",
            restaurant_icon_url: "./public/img/restaurant.png",
            business_icon_url: "./public/img/supermarket.png",
            power_icon_url: "./public/img/supermarket.png",
            wc_red_icon_url: "./public/img/wc.png",
            atm_red_icon_url: "./public/img/atm.png",
            cashier_desk_red_icon_url: "./public/img/cashier_desk.png",
            information_desk_red_icon_url: "./public/img/information_desk.png",
            elevator_red_icon_url: "./public/img/elevator.png",
            ladder_red_icon_url: "./public/img/escalator.png",
            stairway_red_icon_url: "./public/img/stairway.png",
            doorway_red_icon_url: "./public/img/doorway.png",
            /* end anJ*/
        };
        var imageConfig = {
        };
        var _styleList = {
            3: {
                fillColor: "#efefef",
                color: "#333",
                weight: 3,
                opacity: 1,
                fillOpacity: 1
            },
            4: {
                fillColor: "#d5ebab",
                color: "#9bceb2",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
            },
            5: {
                fillColor: "#fdc8c4",
                color: "#f4c3b4",
                weight: 1,
                opacity: 1,
                fillOpacity: 1,
                hover: {
                    fillColor: "#ffb1ac",
                    color: "#f4c3b4",
                    weight: 1,
                    opacity: 1
                }
            },
            6: {
                fillColor: "#ffeda0",
                color: "#ffeda0",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
            },
            7: {
                fillColor: "#d5b9e9",
                color: "#678d88",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
            },
            8: {
                fillColor: "#ddd",
                color: "#999",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
            },
            12: {
                fillColor: "#ffeda0",
                color: "#ffeda0",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
            }
        };
        return {
            getStyleByPoiType: function (num) {
                if (num == 5) {
                    //TODO:
                }
                return _styleList[num];
            },
            setPoiDefaultStyle: function (num, option) {
                _styleList[num] ? "" : _styleList[num] = {};
                for (var i in option) {
                    _styleList[num][i] = option[i];
                }
            },
            setGlobalConfig: function (option) {
                for (var i in option) {
                    option[i] ? globalConfig[i] = option[i] : "";
                }
            },
            getGlobalConfig: function (name) {
                return globalConfig[name];
            },
            setImageConfig: function (option) {
                for (var i in option) {
                    option[i] ? imageConfig[i] = option[i] : "";
                }
            },
            getImageConfig: function (name) {
                return imageConfig[name];
            }
        }
    })();

    /*
     * this module use to load and cache map data;
     */
    _page.DataProvider = (function () {
        var Cache = {};
        var option = {
            service: "WFS",
            version: "1.0.0",
            request: "getFeature",
            typeName: "rtmap:map_poi_862700010020300001_f1",
            maxFeatures: 5000,
            outputFormat: "text/javascript"
        }

        var Events = {};
        var floorsInfo = null;
        var getFloorsHandler;

        function setFloorsInfo(floorInfo) {
            floorsInfo = floorInfo;
            getFloorsHandler ? getFloorsHandler(floorInfo) : "";
        }

        function getFloorsInfo(handler) {
            if (floorsInfo) {
                handler(floorsInfo);
            } else {
                getFloorsHandler = handler;
            }
        }

        function _triggerEvent(action, ary) {
            if (Events[action]) {
                for (var i = 0; i < Events[action].length; i++) {
                    Events[action][i].apply(this, ary);
                }
            }
        }

        function encodeJsonOld(text) {
            var a = 0;
            for (var i = 0; i < buildid.length; i++) {
                a += parseInt(buildid[i]);
            };
            var n = a % 10 + 10;
            var t = "";
            for (var i = 0; i < text.length; i++) {
                var z = i % n;
                var f = z ^ text[i].charCodeAt(0);
                t += String.fromCharCode(f);
            }
            try {
                var json = JSON.parse(t);
            } catch (e) {
                console.error("");
            }
            return json;
        }

        function encodeJson(text) {
            var size = text.length;
            var code = text[0].charCodeAt(0);
            var index = (size - 24) % code;
            index == 0 ? index += 1 : "";
            var tempText = text.substr(index + 1, 24);
            var _buildid;
            try {
                _buildid = atob(tempText);
            }
            catch (e) {
                //if no feature 
                var jsonData = {};
                jsonData.type = "FeatureCollection";
                jsonData.features = [];
                jsonData.totalFeatures = 0;
                return jsonData;
            }
            Rtmap.Config.setup({ buildId: _buildid });
            var buildid = Rtmap.Config.getOption().buildId;
            var regExp = new RegExp(tempText);
            text = text.replace(regExp, "");
            var a = 0;
            for (var i = 0; i < buildid.length; i++) {
                a += parseInt(buildid[i]);
            };
            var n = a % 10 + 10;
            var t = "";
            for (var i = 0; i < text.length; i++) {
                var z = i % n;
                var f = z ^ text[i].charCodeAt(0);
                t += String.fromCharCode(f);
            }
            try {
                var json = JSON.parse(t);
            } catch (e) {
                console.error("");
            }
            return json;
        }

        function _jsonpGet(jsonData, callback) {
            var requestData = {};
            var option = _page.Config.getOption();
            requestData.key = option.Key;
            var token = _page.Config.getOption().Token;
            token ? requestData.access_token = token : "";
            requestData.buildid = option.buildId;
            requestData.floor = jsonData.floor || option.defaultFloor;
            requestData.maptype = jsonData.type;
            requestData.codeType = 2;
            var timeStamp = new Date().getTime();
            if (Cache[jsonData.type] && Cache[jsonData.type][jsonData.floor]) {
                var data = Cache[jsonData.type][jsonData.floor];
                callback(data);
                return;
            }
            _triggerEvent("beforeGetPoi", [timeStamp])
            $.ajax({
                timeout: 60000,
                type: "POST",
                //url:"http://123.57.74.38:8080/rtmap_lbs_api/v1/rtmap/floor_geojson",
                url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/floor_geojson",
                //url:"http://localhost:8080/rtmap_lbs_api/v1/rtmap/floor_geojson",
                //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/floor_geojson",
                data: JSON.stringify(requestData),
                dataType: "text"
            }).done(function (data) {
                if (requestData.floor != Rtmap.Scene.getNowFloor()) {
                    return;
                }
                data = encodeJson(data);
                if (data.result && data.result.error_code != "0") {
                    alert(data.result.error_msg);
                } else {
                    if (!Cache[jsonData.type]) {
                        Cache[jsonData.type] = {};
                    }
                    Cache[jsonData.type][jsonData.floor] = data;
                    callback(data);
                }
            }).error(function () {
                var after = new Date().getTime();
                _triggerEvent("afterGetPoi", [timeStamp, after])
            }).complete(function (e) {
                var after = new Date().getTime();
                _triggerEvent("afterGetPoi", [timeStamp, after])
            });
        }

        function _jsonpGetCDN(jsonData, callback) {
            var requestData = {};
            var option = _page.Config.getOption();
            requestData.key = option.Key;
            var token = _page.Config.getOption().Token;
            token ? requestData.access_token = token : "";
            requestData.buildid = option.buildId;
            requestData.floor = jsonData.floor || option.defaultFloor;
            requestData.maptype = jsonData.type;
            requestData.codeType = 2;
            var timeStamp = new Date().getTime();
            if (Cache[jsonData.type] && Cache[jsonData.type][jsonData.floor]) {
                var data = Cache[jsonData.type][jsonData.floor];
                callback(data);
                return;
            }
            _triggerEvent("beforeGetPoi", [timeStamp])
            $.ajax({
                timeout: 60000,
                type: "GET",
                //url:"http://123.57.74.38:8080/rtmap_lbs_api/v1/rtmap/floor_geojson",
                //url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/floor_geojson",
                //url: "http://res.rtmap.com/map/" + option.buildId + "_" + jsonData.floor + "_" + jsonData.type + ".txt",
                url: "http://res.rtmap.com/map/data3/" + option.buildId + "_" + jsonData.floor + "_" + jsonData.type + ".json",
                //url: "http://localhost:50150/data/" + option.buildId + "_" + jsonData.floor + "_" + jsonData.type + ".json",
                //url: "http://maps.rtmap.com:8080/webmap_beta/data/" + option.buildId + "_" + jsonData.floor + "_" + jsonData.type + ".json",
                //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/floor_geojson",
                //data: JSON.stringify(requestData),
                //headers: { 'Accept-Encoding': 'gzip' },
                dataType: "json"
            }).done(function (data) {
                if (requestData.floor != Rtmap.Scene.getNowFloor()) {
                    return;
                }
                //data = encodeJson(data);
                if (data.result && data.result.error_code != "0") {
                    alert(data.result.error_msg);
                } else {
                    if (!Cache[jsonData.type]) {
                        Cache[jsonData.type] = {};
                    }
                    Cache[jsonData.type][jsonData.floor] = data;
                    callback(data);
                }
            }).error(function () {
                var after = new Date().getTime();
                _triggerEvent("afterGetPoi", [timeStamp, after])
            }).complete(function (e) {
                var after = new Date().getTime();
                _triggerEvent("afterGetPoi", [timeStamp, after])
            });
        }

        function _getPositionInfo(beacons, callback) {
            if (beacons.length > 25) {
                beacons.sort(function (A, B) {
                    return Math.abs(parseInt(A.rssi)) - Math.abs(parseInt(B.rssi));
                });
                beacons = beacons.splice(0, 25);
            }
            var timeStamp = new Date().getTime();
            _triggerEvent("beforeGetPosition", [timeStamp])
            $.ajax({
                type: "GET",
                url: "http://42.96.128.76:9060/rtmap_lbs_api/v1/beacon_lbsinfo",
                data: { key: _page.Config.getOption().Key, beacons: JSON.stringify(beacons) },
                jsonp: "callback",
                jsonpCallback: "jsonpCallback",
                dataType: "jsonp",
            }).done(function (data) {
                if (data.result.error_code != "0") {
                    callback(data.result.error_msg);
                    return;
                } else {
                    alert(data.result.error_msg);
                    callback ? callback(null, data) : "";
                }
            }).error(function (data) {
            }).complete(function () {
                _triggerEvent("afterGetPosition", [timeStamp])
            });
        }

        function _getBuildInfo(beacons, callback) {
            var requestData = {};
            requestData.key = _page.Config.getOption().Key;
            var token = _page.Config.getOption().Token;
            token ? requestData.access_token = token : "";
            requestData.buildid = beacons.buildId || _page.Config.getOption().buildId;
            requestData.map_version = $("#map_version").attr("value");
            beacons.length ? requestData.beacons = JSON.stringify(beacons) : "";
            var timeStamp = new Date().getTime();
            _triggerEvent("beforGetBuildInfo", [timeStamp]);
            $.ajax({
                type: "POST",
                url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/build_detail",
                //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/build_detail",//test url
                data: JSON.stringify(requestData),
                dataType: "json",
            }).done(function (data) {
                if (data.result.error_code == "0") {
                    _page.Config.setup({ vendorDetailUrl: data.build_detail.url });
                    setFloorsInfo(data.build_detail.floorinfo);
                    callback ? callback(null, data.build_detail) : "";
                } else {
                    alert(data.result.error_msg);
                    callback ? callback("get Data error") : "";
                }
            }).complete(function () {
                _triggerEvent("afterGetBuildInfo", [timeStamp])
            });
        };

        return {
            getPosition: _getPositionInfo,
            getBuildInfo: _getBuildInfo,
            on: function (action, func) {
                if (!Events[action]) {
                    Events[action] = [];
                }
                Events[action].push(func);
            },
            getTypeData: function (json, type, callback) {
                _jsonpGetCDN({ "type": type, floor: json.floor }, function (data) {
                    callback(data);
                });
            },
            getPoi: function (json, callback) {
                //_jsonpGetCDN({ "type": "poi", floor: json.floor }, function (data) {
                _jsonpGetCDN({ "type": "shopping", floor: json.floor }, function (data) {
                    if (data.features.length == 0) {
                        //if (data.totalFeatures < 1 || !data.totalFeatures) {
                        /*
                        getFloorsInfo(function (data) {
                            var floor = Page.URL.getParameter("floor");
                            if (data[0].floor.toUpperCase() != json.floor.toUpperCase()) {
                                if (floor)
                                    Page.Controller.DialogLabel.show("楼层" + json.floor + "没有数据，为您切换到楼层" + data[0].floor + "！", 2000);
                                Rtmap.Scene.changeFloorTo(data[0].floor);
                            }
                            else {
                                Page.Controller.DialogLabel.show("当前建筑物没有数据，请联系智慧图工作人员！", 2000);
                            }
                        });
                        */
                    } else {
                        callback(data);
                    };
                });
            },
            getFN: function (json, callback) {
                //_jsonpGetCDN({ "type": "fn", floor: json.floor }, callback);
                _jsonpGetCDN({ "type": "basic", floor: json.floor }, callback);
            },
            getBK: function (json, callback) {
                //_jsonpGet({ "type": "bk", floor: json.floor }, callback);
                _jsonpGetCDN({ "type": "bk", floor: json.floor }, callback);
            },
            clearCache: function (type, floor) {
                if (Cache[type] && Cache[type][floor]) {
                    Cache[type][floor] = {};
                }
            },
            cacheAbutFloor: function (json, callback) {
                var f = json.floor;
                var hash = { "f": 1, "b": -1 };
                var floor = hash[f.substr(0, 1)] * f.substr(1);
                var prev = floor - 1;
                var next = floor + 1;
                var c = prev > 0 ? "f" : "b";
                var n = next < 0 ? "b" : "f";
                function filter(str) {
                    if (str == "b0") { return "b1" }
                    if (str == "f0") { return "f1" }
                    return str;
                }

                var finalFloorPrev = filter(c + Math.abs(prev));
                var finalFloorNext = filter(n + Math.abs(next));

                Rtmap.DataProvider.getBK({ floor: finalFloorNext }, function (data) {
                    Rtmap.DataProvider.getFN({ floor: finalFloorNext }, function (data) {
                        Rtmap.DataProvider.getPoi({ floor: finalFloorNext }, function (data) {
                            callback ? callback() : "";
                        });
                    });
                });
                Rtmap.DataProvider.getBK({ floor: finalFloorPrev }, function (data) {
                    Rtmap.DataProvider.getFN({ floor: finalFloorPrev }, function (data) {
                        Rtmap.DataProvider.getPoi({ floor: finalFloorPrev }, function (data) {
                            callback ? callback() : "";
                        });
                    });
                });
            }
        }
    })();

    /*
     * use to create Track
     * */
    _page.TrackFactory = (function () {
        var _Start = {
            Poi: null,
            Marker: null,
            floor: null,
            x_coord: null,
            y_coord: null
        }
        var _End = {
            Poi: null,
            Marker: null,
            floor: null
        }
        var routePoint = null;
        var Events = {};
        var _routePoiArray = null;//返回的所有路径点
        var _PoiList = {};
        var _startLine = null;
        var _trackLine = null;
        var _endLine = null;
        var _extendLine = null;//同一楼层中的另外一段导航线
        var _currentTrackLine = null;//路书切换时的当前路径线
        var _to_floor_marker = null;//电梯，楼梯切换提示marker;
        var _from_floor_marker = null;//电梯，楼梯切换提示marker;
        var _to_floor_ext_marker = null;//扩展电梯，楼梯切换提示marker(同一楼层，存在两段线的时候);
        var _from_floor_ext_marker = null;//扩展电梯，楼梯切换提示marker(同一楼层，存在两段线的时候);

        var _to_floor_popup = null;
        var ajaxRequest = null;
        var haveTrack = false;
        var _ajaxRequestResult = null;

        function _addStartMarker(startPointType) {
            var iconUrl = _page.Style.getGlobalConfig("start_icon_url");
            var iconRetinaUrl = _page.Style.getGlobalConfig("start_icon_url");
            if (startPointType) {
                if (startPointType == "car") {
                    iconUrl = "./public/img/car.png";
                    iconRetinaUrl = "./public/img/car.png";
                }
            }
            var _startIcon = L.icon({
                iconUrl: iconUrl,
                iconRetinaUrl: iconRetinaUrl,
                iconSize: [40, 40],
                iconAnchor: [20, 40],//caoyy 起点居中
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            });
            var point = new L.Point(_Start.x_coord, _Start.y_coord);
            var latlng = L.CRS.EPSG3395.projection.unproject(point);
            _Start.Marker ? _page.Scene.removeLayer(_Start.Marker) : "";
            _Start.Marker = L.marker(latlng, { icon: _startIcon });//.addTo(_map);
            if (_Start.floor == _page.Scene.getNowFloor()) {
                _page.Scene.addLayer(_Start.Marker);
            }
        }

        function _addEndMarker(layer, endPointType) {
            var iconUrl = _page.Style.getGlobalConfig("end_icon_url");
            var iconRetinaUrl = _page.Style.getGlobalConfig("end_icon_url");
            if (endPointType) {
                if (endPointType == "car") {
                    iconUrl = "./public/img/car.png";
                    iconRetinaUrl = "./public/img/car.png";
                }
            }
            var _endIcon = L.icon({
                iconUrl: iconUrl,
                iconRetinaUrl: iconRetinaUrl,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                shadowSize: [0, 0],
                shadowAnchor: [22, 94]
            });
            var point = new L.Point(_End.x_coord, _End.y_coord);
            var latlng = L.CRS.EPSG3395.projection.unproject(point);
            _End.Marker ? _page.Scene.removeLayer(_End.Marker) : "";
            _End.Marker = L.marker(latlng, { icon: _endIcon });//.addTo(_map);
            if (_End.floor == _page.Scene.getNowFloor()) {
                _page.Scene.addLayer(_End.Marker);
            };
            //清除橡皮筋
            Page.wechat.clearLocationTargetLine ? Page.wechat.clearLocationTargetLine() : "";
        }

        function _triggerEvent(action, ary) {
            if (Events[action]) {
                for (var i = 0; i < Events[action].length; i++) {
                    Events[action][i].apply(this, ary);
                }
            }
        }

        function _requestTrackFromNewServer(callback) {
            function createRequestHeaderJson() {
                var temp = {};
                temp.key = _page.Config.getOption().Key;
                var token = _page.Config.getOption().Token;
                token ? temp.access_token = token : "";
                var x_start = _Start.x_coord,
                    y_start = _Start.y_coord,
                    x_end = _End.x_coord,
                    y_end = _End.y_coord;

                temp.buildid = _page.Config.getOption().buildId;
                temp.pointlist = [
                    { floor: _Start.floor, x: x_start, y: -y_start },
                    { floor: _End.floor, x: x_end, y: -y_end }
                ];
                routePoint ? temp.route_pointlist = routePoint : "";
                return JSON.stringify(temp);
            }
            if (_Start.Poi && _End.Poi && (_Start.Poi != _End.Poi)) {
                var requestHeader = createRequestHeaderJson();
                _triggerEvent("beforeRequest");
                _clearTrackLine();
                $.ajax({
                    timeout: 6000,
                    type: "POST",
                    url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v2/rtmap/navigation",
                    //url: "http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v2/rtmap/navigation",// test url
                    data: requestHeader,
                }).done(function (data) {
                    if (data.result.error_code == "0") {
                        var ary = data.pointlist;
                        _routePoiArray = data.pointlist;
                        var length = ary.length;
                        while (length--) {
                            var temp = ary[length];
                            temp.x_indoor = parseInt(temp.x) / 1000;
                            temp.y_indoor = parseInt(temp.y) / 1000;
                        }
                        _PoiList = _parsePath(ary);
                        _PoiList ? _triggerEvent("successTrack", [_PoiList, data.distance]) : "";
                        window.Page.loading ? window.Page.loading.show() : "";//开启进度条
                        if (_Start.floor != _page.Scene.getNowFloor()) {
                            _page.Scene.changeFloorTo(_Start.floor);
                        } else {
                            _drawPath();
                        }
                        //清除当前聚焦线
                        if (_currentTrackLine && _currentTrackLine.hasfit) {
                            _clearCTrackLine();
                        }
                    } else {
                        //ZS 去除导航出错提示
                        //alert(data.result.error_msg);
                    }
                    _ajaxRequestResult = data;
                    //回调函数
                    callback ? callback(data) : "";
                }).error(function (data) {
                    callback ? callback(data) : "";
                }).complete(function () {
                    _triggerEvent("afterRequest")
                });
            } else if (haveTrack) {
                _clearTrackLine();
                haveTrack = false;
            }
        }

        function _createNewFloorData() {
            return {
                to_floor: null,
                endPOI: null,
                points: []
            };
        };

        function _parsePath(ary) {
            var poiPath = {};
            var tempFloor = null;
            var latlngs = [];
            var cursor = 0;
            var prevFloor = null;
            var prevPOI = null;
            for (var i = 0; i < ary.length; i++) {
                var temp = ary[i];
                var point = new L.Point(temp.x_indoor, -temp.y_indoor);
                var poi_latlng = L.CRS.EPSG3395.projection.unproject(point);

                if (temp.floor.toLowerCase() != tempFloor) {//new floor;
                    if (prevFloor) {
                        prevFloor.next_floor = temp.floor.toLowerCase();
                        prevFloor.endPOI = {
                            name: prevPOI,
                            poiInfo: temp,
                            lastPoiInfo: ary[i - 1]
                        };
                    }
                    tempFloor = temp.floor.toLowerCase();
                    if (!poiPath[tempFloor]) {
                        poiPath[tempFloor] = _createNewFloorData()
                        poiPath[tempFloor].floor = tempFloor;
                        prevFloor ? poiPath[tempFloor].prev_floor = prevFloor.floor : "";
                        prevFloor = poiPath[tempFloor];
                    }
                    else {
                        //同一楼层有两段导航线的情况
                        poiPath[tempFloor].extend_points = [];
                        //同一楼层时增加一个PATH点
                        var extendRoute = tempFloor + "-" + "1";
                        poiPath[tempFloor].extendRoute = extendRoute;
                        poiPath[extendRoute] = _createNewFloorData()
                        poiPath[extendRoute].floor = tempFloor;
                        poiPath[extendRoute].extend_points = poiPath[tempFloor].points;
                        prevFloor ? poiPath[extendRoute].prev_floor = prevFloor.floor : "";
                        prevFloor = poiPath[extendRoute];
                        poiPath[poiPath[extendRoute].prev_floor].next_floor = extendRoute;
                    }
                }
                prevPOI = temp.poi_name;

                if (i == 0) {
                    var point = new L.Point(_Start.x_coord, _Start.y_coord);
                    var startLatlng = L.CRS.EPSG3395.projection.unproject(point);
                    startLatlng.rt_attr = 0;
                    poiPath[tempFloor].points.push(startLatlng);
                }

                //添加到衍生点集合，同一楼层有两段导航线的情况
                if (poiPath[tempFloor].extend_points) {
                    poiPath[tempFloor].extend_points.push(poi_latlng);
                    //同一楼层时增加一个PATH点
                    var extendRoute = poiPath[tempFloor].extendRoute;
                    poiPath[extendRoute].points.push(poi_latlng);
                }
                else {
                    poiPath[tempFloor].points.push(poi_latlng);
                }

                if (i == ary.length - 1) {
                    var point = new L.Point(_End.x_coord, _End.y_coord);
                    var endLatlng = L.CRS.EPSG3395.projection.unproject(point);
                    endLatlng.rt_attr = 1;
                    poiPath[tempFloor].points.push(endLatlng);
                }
            }
            return poiPath;
        }

        function _drawPath(floorMark) {
            var f = _page.Scene.getNowFloor();
            if (!_PoiList[f]) {
                _triggerEvent("drawPath");
                return;
            };
            var ary = _PoiList[f].points;
            _trackLine ? _page.Scene.removeLayer(_trackLine) : "";
            _startLine ? _page.Scene.removeLayer(_startLine) : "";
            _endLine ? _page.Scene.removeLayer(_endLine) : "";
            _extendLine ? _page.Scene.removeLayer(_extendLine) : "";
            _extendLine = null;
            _to_floor_popup ? _page.Scene.removeLayer(_to_floor_popup) : "";
            _to_floor_marker ? _page.Scene.removeLayer(_to_floor_marker) : "";
            _from_floor_marker ? _page.Scene.removeLayer(_from_floor_marker) : "";
            _to_floor_ext_marker ? _page.Scene.removeLayer(_to_floor_ext_marker) : "";
            _from_floor_ext_marker ? _page.Scene.removeLayer(_from_floor_ext_marker) : "";

            if (ary[0].rt_attr == 0) {//customer add point
                var a = ary[0],
                b = ary[1];
                _startLine = L.polyline([a, b], { color: "#1b1b60", dashArray: [5, 5], weight: 6, opacity: 0.8, className: "wha" });
                _page.Scene.addLayer(_startLine);
                var ary = ary.concat();
                ary.splice(0, 1);
            }
            if (ary[ary.length - 1].rt_attr == 1) {//customer add point
                var a = ary[ary.length - 2],
                    b = ary[ary.length - 1];
                if (_PoiList[f].extend_points) {
                    var ary_Extend = _PoiList[f].extend_points;
                    a = ary_Extend[ary_Extend.length - 2];
                    b = ary_Extend[ary_Extend.length - 1];
                }
                _endLine = L.polyline([a, b], { color: "#1b1b60", dashArray: [5, 5], weight: 6, opacity: 0.8, className: "wha" });
                _page.Scene.addLayer(_endLine);
                var ary = ary.concat();
                ary.splice(ary.length - 1, 1);
            }
            _trackLine = L.polyline(ary, { color: "#1b1b60", weight: 6, opacity: 0.8, className: "wha" });
            _trackLine.setText("＞", {
                repeat: !0,
                offset: 3,
                attributes: {
                    "letter-spacing": "20px",
                    fill: "white",
                    "font-weight": "normal",
                    "font-size": "7"
                }
            });
            _page.Scene.addLayer(_trackLine);

            if (_PoiList[f].extend_points) {
                floorMark ? "" : floorMark = f + "-1";
                var ary_Extend = _PoiList[f].extend_points;
                _extendLine = L.polyline(ary_Extend, { color: "#1b1b60", weight: 6, opacity: 0.8, className: "wha" });
                _extendLine.setText("＞", {
                    repeat: !0,
                    offset: 3,
                    attributes: {
                        "letter-spacing": "20px",
                        fill: "white",
                        "font-weight": "normal",
                        "font-size": "7"
                    }
                });
                _page.Scene.addLayer(_extendLine);
                //
                var imageUrl = _getImagePath();
                var myIcon = _createIcon(imageUrl);
                _from_floor_ext_marker = L.marker(_extendLine.getLatLngs()[0], { icon: myIcon });
                _page.Scene.addLayer(_from_floor_ext_marker);

                var imageUrl2 = null;
                var myIcon2 = null;
                var endPoint = _PoiList[floorMark].endPOI;
                if (endPoint) {
                    endPoint.poiInfo ? imageUrl2 = _getImagePath(endPoint.poiInfo) : imageUrl2 = _getImagePath();
                    myIcon2 = _createIcon(imageUrl2);
                    _to_floor_ext_marker = L.marker(_extendLine.getLatLngs()[_extendLine.getLatLngs().length - 1], { icon: myIcon2 });
                    _page.Scene.addLayer(_to_floor_ext_marker);
                    _to_floor_ext_marker.bindPopup(endPoint.poiInfo.desc, { autoPan: false }).openPopup();
                }
                else {
                    imageUrl2 = _getImagePath();
                    myIcon2 = _createIcon(imageUrl2);
                    _to_floor_ext_marker = L.marker(_extendLine.getLatLngs()[_extendLine.getLatLngs().length - 1], { icon: myIcon2 });
                    _page.Scene.addLayer(_to_floor_ext_marker);
                }

            }
        
            //切换楼层起点
            if (_trackLine && _trackLine._map) {
                var endPoint = _PoiList[f].endPOI;
                if (endPoint) {
                    if (endPoint.poiInfo) {
                        var imageUrl = _getImagePath(endPoint.poiInfo);
                        var myIcon = _createIcon(imageUrl);
                        var point = new L.Point(endPoint.lastPoiInfo.x_indoor, -endPoint.lastPoiInfo.y_indoor);
                        var poi_latlng = L.CRS.EPSG3395.projection.unproject(point);
                        _to_floor_marker = L.marker(_trackLine.getLatLngs()[_trackLine.getLatLngs().length - 1], { icon: myIcon });
                        _page.Scene.addLayer(_to_floor_marker);
                        _to_floor_marker.bindPopup(endPoint.poiInfo.desc, { autoPan: false }).openPopup();
                    }
                }

                if (_End.floor.toUpperCase() != _Start.floor.toUpperCase() &&
                    Rtmap.Scene.getNowFloor().toUpperCase() != _Start.floor.toUpperCase()) {//起终点不在一个楼层，当前楼层为终点，且存在两条导航线时
                    var imageUrl = _getImagePath();
                    var myIcon = _createIcon(imageUrl);
                    _from_floor_marker = L.marker(_trackLine.getLatLngs()[0], { icon: myIcon });
                    _page.Scene.addLayer(_from_floor_marker);
                }
            }

            haveTrack = true;
            //
            if (!floorMark && _PoiList[f].extend_points) {
                _triggerEvent("drawPath", [_PoiList, _trackLine]);
                return;
            }
            //若传入标志
            if (floorMark && floorMark.indexOf("-") > 0 && _extendLine)
                _triggerEvent("drawPath", [_PoiList, _extendLine]);
            else
                _triggerEvent("drawPath", [_PoiList, _trackLine]);
        }

        function _clearAllLayer() {
            _to_floor_popup ? _page.Scene.removeLayer(_to_floor_popup) : "";
            _clearStartPoi();
            _clearEndPoi();
            _clearTrackLine();
            _clearCTrackLine();
        }

        function _clearAllUI() {
            _Start.Marker ? _page.Scene.removeLayer(_Start.Marker) : "";
            _End.Marker ? _page.Scene.removeLayer(_End.Marker) : "";
            _trackLine ? _page.Scene.removeLayer(_trackLine) : "";
            _startLine ? _page.Scene.removeLayer(_startLine) : "";
            _endLine ? _page.Scene.removeLayer(_endLine) : "";
            _extendLine ? _page.Scene.removeLayer(_extendLine) : "";
            _to_floor_marker ? _page.Scene.removeLayer(_to_floor_marker) : "";
            _from_floor_marker ? _page.Scene.removeLayer(_from_floor_marker) : "";
        }

        _page.Scene.on("drawedMap", function (floor,floorMark) {
            //_PoiList[floor] ? _drawPath() : "";
            _clearAllUI();
            _PoiList[floor] ? _drawPath(floorMark) : "";
            //按比例过滤数据
            _page.Scene.filterLayersByZoom();
            //redraw overlayer
            if (_Start.Marker && floor == _Start.floor) {
                _page.Scene.addLayer(_Start.Marker);
            }
            if (_End.Marker && floor == _End.floor) {
                _page.Scene.addLayer(_End.Marker);
            }
            //清除橡皮筋
            Page.wechat.clearLocationTargetLine ? Page.wechat.clearLocationTargetLine() : "";
            //清除当前聚焦线
            if (_currentTrackLine && _currentTrackLine.hasfit) {
                _clearCTrackLine();
            }
        });

        _page.Scene.on("changeFloor", function (floor, floorMark) {
            //clear all overlayer,bounds.top first
            //_clearAllUI();
            //_PoiList[floor] ? _drawPath(floorMark) : "";
            ////redraw overlayer
            //if (_Start.Marker && floor == _Start.floor) {
            //    _page.Scene.addLayer(_Start.Marker);
            //}
            //if (_End.Marker && floor == _End.floor) {
            //    _page.Scene.addLayer(_End.Marker);
            //}
            ////清除橡皮筋
            //Page.wechat.clearLocationTargetLine ? Page.wechat.clearLocationTargetLine() : "";
            ////清除当前聚焦线
            //_clearCTrackLine();
        });

        function _clearStartPoi() {
            _Start.Marker ? _page.Scene.removeLayer(_Start.Marker) : "";
            for (var i in _Start) {
                _Start[i] = null;
            }
        };

        function _clearEndPoi() {
            _End.Marker ? _page.Scene.removeLayer(_End.Marker) : "";
            for (var i in _End) {
                _End[i] = null;
            }
        };

        function _clearTrackLine() {
            _trackLine ? _page.Scene.removeLayer(_trackLine) : "";
            _startLine ? _page.Scene.removeLayer(_startLine) : "";
            _endLine ? _page.Scene.removeLayer(_endLine) : "";
            _extendLine ? _page.Scene.removeLayer(_extendLine) : "";
            routePoint = null;
            _to_floor_marker ? _page.Scene.removeLayer(_to_floor_marker) : "";
            _from_floor_marker ? _page.Scene.removeLayer(_from_floor_marker) : "";
            _to_floor_ext_marker ? _page.Scene.removeLayer(_to_floor_ext_marker) : "";
            _from_floor_ext_marker ? _page.Scene.removeLayer(_from_floor_ext_marker) : "";
        };

        //重置路径线,防止被其它图层压盖
        function _resetTrackLine() {
            if (_trackLine && _trackLine._map) {
                _page.Scene.removeLayer(_trackLine);
                _page.Scene.addLayer(_trackLine);
            }
            if (_startLine && _startLine._map) {
                _page.Scene.removeLayer(_startLine);
                _page.Scene.addLayer(_startLine);
            }
            if (_endLine && _endLine._map) {
                _page.Scene.removeLayer(_endLine);
                _page.Scene.addLayer(_endLine);
            }
            if (_extendLine && _extendLine._map) {
                _page.Scene.removeLayer(_extendLine);
                _page.Scene.addLayer(_extendLine);
            }
            //
            if (_currentTrackLine && _currentTrackLine._map) {
                _page.Scene.removeLayer(_currentTrackLine);
                _page.Scene.addLayer(_currentTrackLine);
            }
        };

        function _redrawCTrackLine(startPoi, endPoi, floor) {
            _clearCTrackLine();
            var startPoiIndex, endPoiIndex;
            for (var i = 0; i < _routePoiArray.length; i++) {
                if (_routePoiArray[i].floor == startPoi.floor &&
                    _routePoiArray[i].x == startPoi.x &&
                    _routePoiArray[i].y == startPoi.y) {
                    startPoiIndex = i;
                }

                if (_routePoiArray[i].floor == endPoi.floor &&
                  _routePoiArray[i].x == endPoi.x &&
                  _routePoiArray[i].y == endPoi.y) {
                    endPoiIndex = i;
                }
            }
            var array = [];
            for (var i = startPoiIndex; i <= endPoiIndex; i++) {
                var point = new L.Point(_routePoiArray[i].x_indoor, -_routePoiArray[i].y_indoor);
                var latlng = L.CRS.EPSG3395.projection.unproject(point);
                array.push(latlng);
            }
            _currentTrackLine = L.polyline(array, { color: "#E80A0A", weight: 6, opacity: 0.7, className: "wha" });
            if (_page.Scene.getNowFloor().toUpperCase() == floor.toUpperCase()) {
                window.setTimeout(function () {
                    if (_currentTrackLine) {
                        _page.Scene.getMap().fitBounds(_currentTrackLine.getBounds().pad(0.2));
                        _page.Scene.addLayer(_currentTrackLine);
                        _currentTrackLine.hasfit = true;
                    }
                    window.Page.loading ? window.Page.loading.hide() : "";//关闭进度条
                }, 700);
            }
        };

        function _getCTrackLine() {
            return _currentTrackLine;
        }

        //绘制当路径段
        function _drawCTrackLine(startPoi, endPoi, floor) {
            //不合适
            window.locationModel = "free";
            Rtmap.Control.disableLocal();//默认置灰
            if (_page.Scene.getNowFloor().toUpperCase() != floor.toUpperCase()) {
                window.Page.loading ? window.Page.loading.show() : "";//开启进度条
                _page.Scene.changeFloorTo(floor, null, function () {
                    _redrawCTrackLine(startPoi, endPoi, floor);
                });
            }
            else {
                _redrawCTrackLine(startPoi, endPoi, floor);
            }
        };

        //绘制当路径段
        function _clearCTrackLine() {
            if (_currentTrackLine && _currentTrackLine._map) {
                _page.Scene.removeLayer(_currentTrackLine);
                _currentTrackLine = null;
            }
        };

        //创建icon
        function _createIcon(imageUrl) {
            var myIcon = L.icon({
                iconUrl: imageUrl,
                iconRetinaUrl: imageUrl,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            return myIcon;
        }

        //获取楼层切换上下图标
        function _getImagePath(poiInfo) {
            if (poiInfo) {
                var flag = "up";
                if (poiInfo.desc) {
                    if (poiInfo.desc.indexOf("上行") > 0) {
                        flag = "up";
                    }
                    if (poiInfo.desc.indexOf("下行") > 0) {
                        flag = "down";
                    }
                }
                if (poiInfo.poi_name.indexOf("电梯") > -1) {
                    return "./public/img/elevator_" + flag + ".png";
                }
                else if (poiInfo.poi_name.indexOf("扶梯") > -1) {
                    return "./public/img/escalator_" + flag + ".png";

                } else if (poiInfo.poi_name.indexOf("楼梯") > -1) {
                    return "./public/img/stair_" + flag + ".png";
                }
            }
            return "./public/img/elevator.png";
        }

        return {
            on: function (action, func) {
                if (!Events[action]) {
                    Events[action] = [];
                }
                Events[action].push(func);
            },
            getStartPoi: function () {
                return _Start;
            },
            getEndPoi: function () {
                return _End;
            },
            setStartPoi: function (PoiLayer, startPointType) {
                if (!PoiLayer && Rtmap.Search.FocusResult) {//
                    _Start.floor = Rtmap.Search.FocusResult.floor.toLowerCase();
                    _Start.x_coord = Rtmap.Search.FocusResult.x;
                    _Start.y_coord = Rtmap.Search.FocusResult.y;
                    _Start.Poi = Rtmap.Search.FocusResult;
                }
                else {
                    var properties = PoiLayer.feature ? PoiLayer.feature.properties : "";
                    _Start.Poi = PoiLayer;
                    if (properties) {
                        _Start.floor = Rtmap.Scene.getNowFloor().toLowerCase()//properties.floor.toLowerCase();
                        _Start.x_coord = properties.x_coord;
                        _Start.y_coord = properties.y_coord;
                    } else {
                        _Start.floor = PoiLayer.floor.toLowerCase();
                        _Start.x_coord = PoiLayer.x;
                        _Start.y_coord = PoiLayer.y;
                    }
                }
                var marker = Rtmap.Scene.SelectMarker;
                marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                Rtmap.Scene.SelectMarker = null;
                _addStartMarker(startPointType);
                if (_Start.Poi == _End.Poi) {
                    _clearEndPoi();
                }
                //_requestTrackFromOpen2();
                _requestTrackFromNewServer();
            },
            setStartPoiXY: function (floor, x, y, callback) {
                _Start.floor = floor.toLowerCase();
                _Start.x_coord = x;
                _Start.y_coord = y;
                _Start.Poi = {};
                _Start.Poi.floor = floor.toLowerCase();
                _Start.Poi.x = x;
                _Start.Poi.y = y;
                _addStartMarker();
            },
            clearStartPoi: _clearStartPoi,
            clearEndPoi: _clearEndPoi,
            getTrackStatus: function () {
                return haveTrack;
            },
            setRoutePoints: function (ary) {
                routePoint = ary;
            },
            setEndPoi: function (PoiLayer, endPointType) {
                if (!PoiLayer && Rtmap.Search.FocusResult) {//
                    _End.floor = Rtmap.Search.FocusResult.floor.toLowerCase();
                    _End.x_coord = Rtmap.Search.FocusResult.x;
                    _End.y_coord = Rtmap.Search.FocusResult.y;
                    _End.Poi = Rtmap.Search.FocusResult.y;
                }
                else {
                    var properties = PoiLayer.feature ? PoiLayer.feature.properties : "";
                    _End.Poi = PoiLayer;
                    if (properties) {
                        _End.floor = Rtmap.Scene.getNowFloor().toLowerCase()//properties.floor.toLowerCase();
                        _End.x_coord = properties.x_coord;
                        _End.y_coord = properties.y_coord;
                    } else {
                        _End.floor = PoiLayer.floor.toLowerCase();
                        _End.x_coord = PoiLayer.x;
                        _End.y_coord = PoiLayer.y;
                    }
                }
                var marker = Rtmap.Scene.SelectMarker;
                marker ? Rtmap.Scene.removeLayer(marker, true) : "";
                Rtmap.Scene.SelectMarker = null;
                _addEndMarker(PoiLayer, endPointType);
                if (_Start.Poi == _End.Poi) {
                    _clearStartPoi();
                }
                if (!_Start.Poi && !endPointType) {
                    if (!Page.wechat.getLocaler()) {
                        //_triggerEvent("needStartPoi");
                    }
                    else {
                        //若存在实时定位信息
                        var local = Page.wechat.getLocaler();
                        _Start.Poi = local;
                        _Start.floor = local.floor.toLowerCase();
                        _Start.x_coord = local.x;
                        _Start.y_coord = local.y;
                    }
                }
                //_requestTrackFromOpen2();
                _requestTrackFromNewServer();
            },
            setEndPoiXY: function (floor, x, y, callback) {
                _End.floor = floor.toLowerCase();
                _End.x_coord = x;
                _End.y_coord = y;
                _End.Poi = {};
                _End.Poi.x = x;
                _End.Poi.y = y;
                _End.floor.y = floor.toLowerCase();
                _addEndMarker();
                if (!_Start.Poi) {
                    if (!Page.wechat.getLocaler()) {
                        //_triggerEvent("needStartPoi");
                    }
                    else {
                        //若存在实时定位信息
                        var local = Page.wechat.getLocaler();
                        _Start.Poi = local;
                        _Start.floor = local.floor.toLowerCase();
                        _Start.x_coord = local.x;
                        _Start.y_coord = local.y;
                    }
                }
                _requestTrackFromNewServer(callback);
            },
            getRoutePoints: function () {
                return _routePoiArray;
            },
            getRequestData:function(){
                return _ajaxRequestResult;
            },
            resetTrackLine: _resetTrackLine,
            drawCTrackLine: _drawCTrackLine,
            getCTrackLine:_getCTrackLine,
            requestTrackFromServer: _requestTrackFromNewServer,
            clearCTrackLine: _clearCTrackLine,
            clearPath: function () {
                _clearAllLayer();
                _PoiList = {};
                haveTrack = false;
                _triggerEvent("clearPath");
            },
            clearAll: function () {
                _clearStartPoi();
                _clearEndPoi();
                this.clearPath();
            }
        }
    })();

    _page.Search = (function () {
        var searchPoint = {};
        var Events = {}
        function _triggerEvent(action, ary) {
            if (Events[action]) {
                for (var i = 0; i < Events[action].length; i++) {
                    Events[action][i].apply(this, ary);
                }
            }
        }

        function _searchFromNewServer(jsonData, callback) {
            var requestData = {};
            requestData.key = Rtmap.Config.getOption().Key;
            var token = _page.Config.getOption().Token;
            token ? requestData.access_token = token : "";
            requestData.buildid = Rtmap.Config.getOption().buildId;
            requestData.keywords = jsonData.keyword;
            requestData.floor = Rtmap.Scene.getNowFloor().toUpperCase();
            requestData.pagesize = "30";
            requestData.pageindex = jsonData.searchPageIndex;
            if (searchPoint.x && searchPoint.y) {
                var point = searchPoint;
            } else {
                var point = Rtmap.Scene.getCenter();
            }
            requestData.refer_point = { x: point.x.toString(), y: point.y.toString() }
            var requestTime = new Date().getTime();
            _triggerEvent("beforeSearch", [requestTime]);
            $.ajax({
                type: "POST",
                url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/search_keywords",
                //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/search_keywords",
                data: JSON.stringify(requestData),
            }).done(function (data) {
                if (data.result.error_code == "0") {
                    var finalData = filterData(data.poilist || []);
                    callback ? callback(finalData, data, jsonData) : ""; //anJ 多传参数jsonData
                } else {
                    alert(data.result.error_msg);
                }
            }).complete(function (data) {
                try {
                    var response = JSON.parse(data.responseText);
                    response.searchType = jsonData.searchType;
                } catch (e) {
                    console.log(e);
                }
                _triggerEvent("afterSearch", [response, requestTime]);
            });
        }

        function filterData(ary) {
            var finalData = {};
            var length = ary.length;
            for (var i = 0; i < length; i++) {
                var temp = ary[i];
                var floor = temp.floor.toLocaleLowerCase();
                if (!finalData[floor]) {
                    finalData[floor] = [];
                }
                finalData[floor].push(temp);
            }
            return finalData;
        }

        function _searchTwoClass(twoClassName, callback) {
            var transData = {};
            transData.buildid = Rtmap.Config.getOption().buildId;
            transData.key = Rtmap.Config.getOption().Key;
            transData.pagesize = "999";
            transData.pageindex = "1";
            transData.floor = Rtmap.Scene.getNowFloor().toUpperCase();
            transData.classid = twoClassName;
            var centerPoint = Rtmap.Scene.getMap().getBounds().getCenter();
            transData.refer_point = { x: centerPoint.lat.toString(), y: centerPoint.lng.toString() }
            $.ajax({
                url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/search_classification",
                type: "post",
                dataType: "json",
                data: JSON.stringify(transData),
                success: function (data) {
                    if (data.result.error_code == "0") {
                        var finalData = filterData(data.poilist || []);
                        callback ? callback(finalData, data) : ""; //anJ 多传参数jsonData
                    } else {
                        alert(data.result.error_msg);
                    }
                }
            })
        }

        return {
            request: _searchFromNewServer,
            searchTwoClass: _searchTwoClass,
            on: function (action, func) {
                if (!Events[action]) {
                    Events[action] = [];
                }
                Events[action].push(func);
            },
            setSearchPoint: function (x, y) {
                searchPoint.x = x;
                searchPoint.y = y;
            }
        }
    })();

    _page.Animate = (function () {
        function Animate(callback) {
            var stop = false;
            var clear = false;
            function loop() {
                var oldTime = new Date().getTime();
                L.Util.requestAnimFrame(function () {
                    var time = new Date().getTime();
                    callback(time - oldTime);
                    if (!stop && !clear) {
                        loop();
                    }
                });
            };

            this.run = function () {
                stop = false;
                loop();
            };

            this.stop = function () {
                stop = true;
            };

            this.clear = function () {
                clear = true;
            };
        };
        return Animate;
    })();

    _page.Config = (function () {
        var _option = {
            buildId: null,
            service: "WFS",
            version: "1.0.0",
            request: "getFeature",
            maxFeatures: 5000,
            outputFormat: "text/javascript",
            defalutFloor: "f1",
            key: null,
            labelStyle: "standard"//standard(标准),circle-point(圆点),none(不显示标注)
        };

        return {
            setup: function (option) {
                for (var i in option) {
                    _option[i] = option[i];
                }
            },
            getOption: function () {
                return _option;
            }
        }
    })();

    _page.Location = (function () {
        var _Events = {
            _call: function (key, ary) {
                var events = this[key];
                if (events) {
                    for (var i = 0; i < events.length; i++) {
                        events[i].apply(this, ary);
                    };
                }
            },
        };

        var startHandler = null;
        var data = { "userID": "000000000001", "buildID": "860100010040500017", "floor": "F10", "errorInfo": "定位成功", "error": 0, "timestampPDR": 1448530660, "timestamp": 1448530660, "altitude": 0.0, "longitude": 0.0, "latitude": 0.0, "inOutDoorFlg": 0, "gpsAccuracy": 0.0, "floorID": 20100, "coordX": 8917, "coordY": -22051, "accuracy": 12, "x": 8.917, "y": -22.051 }

        return {
            _setLocationData: function (jsonData) {// android SDK call this function
                _Events._call("haveLocation", [jsonData]);
            },
            _startHandler: function (msg) {
                startHandler ? startHandler(msg) : "";
            },
            _stopHandler: function (msg) {
                stopHandler ? stopHandler(msg) : "";
            },
            start: function (handler) {
                if (window.SDK_Location) {
                    startHandler = handler;
                    SDK_Location.start();
                } else {
                    handler("This function need Rtmap Native APP SDK!");
                }
            },
            stop: function (handler) {
                if (window.SDK_Location) {
                    stopHandler = handler;
                    SDK_Location.stop();
                } else {
                    handler("This function need Rtmap Native APP SDK!");
                }
            },
            on: function (action, func) {
                if (!_Events[action]) {
                    _Events[action] = [];
                }
                _Events[action].push(func);
            }
        }
    })();

    //use to select or capture feature in map
    _page.FeatureSelect = (function () {
        var FeatureSelect = L.Class.extend(({
            includes: L.Mixin.Events,
            options: {
                icon: L.divIcon({
                    iconSize: [64, 64],
                    iconAnchor: [32, 32],
                    className: 'leaflet-feature-selector'//'leaflet-feature-selector'
                }),
                selectSize: [64, 64],
                featureGroup: null
            },

            initialize: function (map, options) {
                L.setOptions(this, options);
                this._map = map;
                this.options.selectSize = L.point(this.options.selectSize);
            },

            enable: function () {
                if (this._enabled) {
                    return;
                }

                L.Handler.prototype.enable.call(this);
                this._center = this._map.getCenter();
                this.layers = {};
                this._marker = L.marker(this._center).addTo(this._map);
                this._map.on('zoomend', this._zoomEnd, this);
                this._map.on('drag', this._drag, this);
                this._map.on('dragend', this._dragEnd, this);

                this.options.featureGroup.on('layeradd', function (evt) {
                    this._checkIntersections();
                }, this);
                this.options.featureGroup.on('layerremove', function (evt) {
                    this._handleNoIntersection(evt.layer);
                    this._checkIntersections();
                }, this);
                return;
            },

            disable: function () {
                if (!this._enabled) {
                    return;
                }
                L.Handler.prototype.disable.call(this);
                this._map.off('zoomend', this._zoomEnd, this);
                this._map.off('drag', this._drag, this);
                this._map.off('dragend', this._dragEnd, this);
                this._map.removeLayer(this._marker);
            },

            addHooks: function () {
                var map = this._map;

                if (map) {
                    L.DomUtil.disableTextSelection();
                    map.getContainer().focus();
                }

                this._map._container.style.cursor = 'default';
            },

            removeHooks: function () {
                if (this._map) {
                    L.DomUtil.enableTextSelection();
                }
                this._map._container.style.cursor = '';
            },

            _handleIntersection: function (layer) {
                if (!this.layers[L.stamp(layer)]) {
                    this.layers[L.stamp(layer)] = layer;
                    this.justSelected.push(layer);
                }
            },

            _handleNoIntersection: function (layer) {
                if (this.layers[L.stamp(layer)]) {
                    delete this.layers[L.stamp(layer)];
                    this.justUnselected.push(layer);
                }
            },

            _checkIntersections: function (e) {
                if (!e) return;
                var centerPoint = this._map.options.crs.project(this._center),//this._map.project(e.latlng),
                    selectBounds, selectBoundsCoords;
                this.justSelected = [];
                this.justUnselected = [];

                var crs = this._map.options.crs;//L.CRS.EPSG3395;

                var point1 = L.point(centerPoint.x + this.options.selectSize.x / 2, centerPoint.y - this.options.selectSize.y / 2);
                var point2 = L.point(centerPoint.x - this.options.selectSize.x / 2, centerPoint.y + this.options.selectSize.y / 2);
                var lf1 = crs.projection.unproject(point1);
                var lf2 = crs.projection.unproject(point2);
                selectBounds = L.latLngBounds(lf1, lf2);
                selectBoundsCoords = L.rectangle(selectBounds).toGeoJSON().geometry.coordinates[0];

                this.options.featureGroup.eachLayer(function (layer) {
                    var coords = layer.feature.geometry.coordinates,
                        len, i, intersects = false;

                    switch (layer.feature.geometry.type) {
                        case 'Point':
                            coords = [coords];
                            // fall through
                        case 'MultiPoint':
                            for (i = 0; i < coords.length; i++) {
                                if (selectBounds.contains(L.latLng([coords[i][1], coords[i][0]]))) {
                                    intersects = true;
                                }
                            }
                            break;

                        case 'LineString':
                            coords = [coords];
                            // fall through
                        case 'MultiLineString':
                            for (i = 0; i < coords.length; i++) {
                                if (selectBounds.intersects(layer.getBounds()) && this._lineStringsIntersect(selectBoundsCoords, coords[i])) {
                                    intersects = true;
                                }
                            }
                            break;

                        case 'Polygon':
                            coords = [coords];
                            // fall through
                        case 'MultiPolygon':
                            var centerPoint = this._map.options.crs.project(this._center);
                            for (i = 0; i < coords.length; i++) {
                                if (selectBounds.intersects(layer.getBounds()) && this._pointInPolygon(centerPoint.x, centerPoint.y, coords[i][0])) {
                                    intersects = true;
                                }
                            }
                            break;
                    }
                    //判断是否是按住Ctrl多选状态
                    if (!intersects) {
                        for (var i = 0; i < this.justSelected.length; i++) {
                            if (this.justSelected[i] == layer) {
                                intersects = true;
                                break;
                            }
                        }
                    }
                    if (intersects) {
                        this._handleIntersection(layer);
                    } else {
                        this._handleNoIntersection(layer);
                    }

                }, this);

                //if (this.justUnselected.length) {
                this.fire('unselect', {
                    layers: this.justUnselected,
                    centerPoint: centerPoint
                });
                //}


                //if (this.justSelected.length) {
                this.fire('select', {
                    layers: this.justSelected,
                    centerPoint: centerPoint
                });
                //}
            },

            // adapted from https://github.com/maxogden/geojson-js-utils/
            _lineStringsIntersect: function (c1, c2) {
                for (var i = 0; i <= c1.length - 2; ++i) {
                    for (var j = 0; j <= c2.length - 2; ++j) {
                        var a1 = { x: c1[i][1], y: c1[i][0] },
                            a2 = { x: c1[i + 1][1], y: c1[i + 1][0] },
                            b1 = { x: c2[j][1], y: c2[j][0] },
                            b2 = { x: c2[j + 1][1], y: c2[j + 1][0] },

                            ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
                            ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
                            u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

                        if (u_b !== 0) {
                            var ua = ua_t / u_b,
                                ub = ub_t / u_b;
                            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                                return true;
                            }
                        }
                    }
                }

                return false;
            },

            // Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices
            _pointInPolygon: function (x, y, polyCoords) {
                var inside = false,
                    intersects, i, j;

                for (i = 0, j = polyCoords.length - 1; i < polyCoords.length; j = i++) {
                    var xi = polyCoords[i][0], yi = polyCoords[i][1];
                    var xj = polyCoords[j][0], yj = polyCoords[j][1];

                    intersects = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersects) {
                        inside = !inside;
                    }
                }

                return inside;
            },

            _mouseMove: function (e) {
                this._marker.setLatLng(e.latlng);
                this._center = e.latlng;
            },

            _drag: function (e) {
                this._center = this._map.getCenter();
                this._marker.setLatLng(this._center);
            },

            _dragEnd: function (e) {
                this._center = this._map.getCenter();
                this._marker.setLatLng(this._center);
                this._checkIntersections(e);
            },

            _zoomEnd: function (e) {
                this._center = this._map.getCenter();
                this._marker.setLatLng(this._center);
                this._checkIntersections(e);
            }
        }));

        var _featureSelect;
        var _locationInfo;
        function _initCenterPoint() {
            var map = Rtmap.Scene.getMap();
            if (_featureSelect) {
                _featureSelect.off('select', _onSelect);
                _featureSelect.disable();
            }
            _featureSelect = new FeatureSelect(map, {
                featureGroup: Rtmap.Scene.getLayer(),
                selectSize: [16, 16]
            });

            _featureSelect.enable();
            _featureSelect.on('select', _onSelect);
        };

        function _onSelect(e) {
            var name = "";
            if (e.layers.length > 0) {
                name = e.layers[0].feature.properties.name_chinese;
            }
            _locationInfo = name + "_" + e.centerPoint.x.toString() + "_" + e.centerPoint.y.toString();

            //调用WEBVIEW
            if (window.jsObj) {
                window.jsObj.HtmlSendCenterPointLocationInfo(name, e.centerPoint.x.toString(), e.centerPoint.y.toString());
            }
            //IOS调用时
            if (window.HtmlSendCenterPointLocationInfoForIOS) {
                window.HtmlSendCenterPointLocationInfoForIOS(name, e.centerPoint.x.toString(), e.centerPoint.y.toString());
            }
        }

        return {
            initCenterPoint: _initCenterPoint,
            getCenterPointLoctionInfo: function () {
                return _locationInfo;
            }
        };
    })();

    //wechat locate
    _page.WechatLocate = (function () {
        //iphone DeviceMotionEvent and  DeviceOrientationEvent
        var iphoneMotionDataArr = new Array(50);
        var iphoneOrientationDataArr = new Array(50);
        //Android DeviceMotionEvent
        var androidMotionDataArr = new Array(50);
        var androidOrientationDataArr = new Array(50);

        if (navigator.userAgent.indexOf("iPhone") != -1) {
            if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
                window.addEventListener("devicemotion", function (eventData) {
                    var iphoneData = {};
                    var accelerationGravity = eventData.accelerationIncludingGravity;
                    var acceleration = eventData.acceleration;
                    iphoneData.GravityX = accelerationGravity.x;
                    iphoneData.GravityY = accelerationGravity.y;
                    iphoneData.GravityZ = accelerationGravity.z;
                    iphoneMotionDataArr.timestamp = new Date().getTime();
                    iphoneMotionDataArr.push(iphoneData);
                    iphoneMotionDataArr.shift();
                }, false);
                window.addEventListener("deviceorientation", function (eventData) {
                    var iphoneData = {};
                    iphoneData.alpha = eventData.alpha;
                    iphoneData.beta = eventData.beta;
                    iphoneData.gamma = eventData.gamma;
                    //这里的heading是指北针的角度
                    iphoneData.heading = eventData.webkitCompassHeading;
                    iphoneData.accuracy = eventData.webkitCompassAccuracy;
                    iphoneOrientationDataArr.timestamp = new Date().getTime();
                    iphoneOrientationDataArr.push(iphoneData);
                    iphoneOrientationDataArr.shift();
                }, true);
            } else {
                alert("浏览器不支持");
            }
        } else if (navigator.userAgent.indexOf("Android") != -1) {
            if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
                window.addEventListener("devicemotion", function (eventData) {
                    var androidData = {};
                    var accelerationGravity = eventData.accelerationIncludingGravity;
                    androidData.GravityX = accelerationGravity.x;
                    androidData.GravityY = accelerationGravity.y;
                    androidData.GravityZ = accelerationGravity.z;
                    androidMotionDataArr.timestamp = new Date().getTime();
                    androidMotionDataArr.push(androidData);
                    androidMotionDataArr.shift();
                }, false);
                window.addEventListener("deviceorientation", function (eventData) {
                    var androidData = {};
                    androidData.alpha = eventData.alpha;
                    androidData.beta = eventData.beta;
                    androidData.gamma = eventData.gamma;
                    //这里的heading是指北针的角度
                    androidData.heading = eventData.webkitCompassHeading;
                    androidData.accuracy = eventData.webkitCompassAccuracy;
                    androidOrientationDataArr.timestamp = new Date().getTime();
                    androidOrientationDataArr.push(androidData);
                    androidOrientationDataArr.shift();
                }, true);
            } else {
                alert("浏览器不支持");
            }
        }

        function _prepare(data) {
            if (data && (data.debug == "true")) {
                $("#show").css("display", "block");
            } else if (!data || (data.debug == "false")) {
                $("#show").css("display", "none");
            }

            window.wechat.onScanStart = function (data) {
                $("#show .timestamp").html(data.toString());
            };
            window.wechat.onScanSearch = function (data, callback) {
                var filterAndSort = { beacons: new Array() };

                //GPS
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        if (position) {
                            window.wechat.param.locate_data.gps = {
                                "longitude": position.coords.longitude,
                                "latitude": position.coords.latitude,
                                "accuracy": position.coords.accuracy
                            }

                            //筛选设备然后做数据处理
                            if (navigator.userAgent.indexOf("iPhone") != -1) {
                                var step = window.countStep(iphoneMotionDataArr);
                                var moveStatus = window.moveStatus(iphoneMotionDataArr);
                                window.wechat.param.locate_data.pdr = {
                                    move_status: moveStatus,
                                    step: (step + moveStatus)
                                };
                                var standard = window.compassStandard(iphoneOrientationDataArr);
                                window.wechat.param.locate_data.compass = {
                                    "standard": parseInt(standard),
                                    "average": parseInt(iphoneOrientationDataArr[iphoneOrientationDataArr.length - 1].heading)
                                };
                                $("#show .step").html("<p>" + "记步：" + (step + moveStatus).toString() + "动静：" + moveStatus.toString() + "</p>");
                            } else if (navigator.userAgent.indexOf("Android") != -1) {
                                var step = window.countStep(androidMotionDataArr);
                                var moveStatus = window.moveStatus(androidMotionDataArr);
                                window.wechat.param.locate_data.pdr = {
                                    move_status: moveStatus,
                                    step: (step + moveStatus)
                                };
                                var heading = (360 - parseFloat(androidOrientationDataArr[androidOrientationDataArr.length - 1].alpha))
                                var standard = window.compassStandard(androidOrientationDataArr);
                                window.wechat.param.locate_data.compass = {
                                    "standard": parseInt(standard),
                                    "average": parseInt(heading)
                                };
                                $("#show .step").html("<p>" + "记步：" + (step + moveStatus).toString() + "动静：" + moveStatus.toString() + "</p>");
                            }
                        }
                        //              alert(JSON.stringify(window.wechat.param));
                    });
                }

                for (var i = 0; i < data.beacons.length; i++) {
                    if (data.beacons[i].rssi != 0) {
                        filterAndSort.beacons.push(data.beacons[i]);
                    }
                }

                if (filterAndSort.beacons.length == 0) {
                    return;
                } else {
                    for (var i = 0; i < filterAndSort.beacons.length - 1; i++) {
                        for (var j = 0; j < filterAndSort.beacons.length - 1; j++) {
                            if (parseInt(filterAndSort.beacons[j].rssi) < parseInt(filterAndSort.beacons[j + 1].rssi)) {
                                var tmp = filterAndSort.beacons[j];
                                filterAndSort.beacons[j] = filterAndSort.beacons[j + 1];
                                filterAndSort.beacons[j + 1] = tmp;
                            }
                        }
                    }
                    $("#show .wechat_text").html("<p>" + (new Date().toString()) + JSON.stringify(filterAndSort) + "</p>");
                    window.wechat.param.timestamp = new Date().getTime();
                    callback(filterAndSort);
                }
            };
            window.wechat.onPost = function (data) {
                if (data.timestamp && parseInt(data.timestamp) < parseInt(window.timeTmp)) {
                    return;
                }
                window.timeTmp = data.timestamp;
                $("#show .xy_text").html("<p>" + (new Date().toString()) + JSON.stringify(data) + "</p>");
                $("#show .result_timestamp").append("<p>" + window.timeTmp + "</p>");
                Page.wechat.drawLocation(data, function () {

                });
            };
            window.wechat.onScanStop = function (res) {
                alert(JSON.stringify(res));
                $("#show .wechat_text").html("");
                $("#show .xy_text").html("");
            };
            window.wechat.onOverTime = function () {
                //alert("请检查蓝牙是否开启，或者所在区域扫描不到设备");
            };
            window.wechat.init();
            $(".hide").click(function () {
                if ($("#show").css("width") != "0px") {
                    $("#show").css("width", 0);
                } else {
                    $("#show").css("width", "100%");
                }
            });
            $(".doIt").click(function () {
                window.wechat.init();
            });
            $(".stopIt").click(function () {
                window.wechat.stopBeacons();
            });
        }

        return {
            prepare: _prepare
        };
    })();

    window.Rtmap = _page;
    return _page;
});


function rgbToHex() { var d = "#"; for (var i = 0; i < arguments.length; i++) { d += arguments[i].toString(16); }; console.log(d); };

//polylineextend
(function () {

    var __onAdd = L.Polyline.prototype.onAdd,
        __onRemove = L.Polyline.prototype.onRemove,
        __updatePath = L.Polyline.prototype._updatePath,
        __bringToFront = L.Polyline.prototype.bringToFront;


    var PolylineTextPath = {

        onAdd: function (map) {
            __onAdd.call(this, map);
            this._textRedraw();
        },

        onRemove: function (map) {
            map = map || this._map;
            if (map && this._textNode)
                map._pathRoot.removeChild(this._textNode);
            __onRemove.call(this, map);
        },

        bringToFront: function () {
            __bringToFront.call(this);
            this._textRedraw();
        },

        _updatePath: function () {
            __updatePath.call(this);
            this._textRedraw();
        },

        _textRedraw: function () {
            var text = this._text,
                options = this._textOptions;
            if (text) {
                this.setText(null).setText(text, options);
            }
        },

        setText: function (text, options) {
            this._text = text;
            this._textOptions = options;

            /* If not in SVG mode or Polyline not added to map yet return */
            /* setText will be called by onAdd, using value stored in this._text */
            if (!L.Browser.svg || typeof this._map === 'undefined') {
                return this;
            }

            var defaults = {
                repeat: false,
                fillColor: 'black',
                attributes: {},
                below: false,
            };
            options = L.Util.extend(defaults, options);

            /* If empty text, hide */
            if (!text) {
                if (this._textNode && this._textNode.parentNode) {
                    this._map._pathRoot.removeChild(this._textNode);

                    /* delete the node, so it will not be removed a 2nd time if the layer is later removed from the map */
                    delete this._textNode;
                }
                return this;
            }

            text = text.replace(/ /g, '\u00A0');  // Non breakable spaces
            var id = 'pathdef-' + L.Util.stamp(this);
            var svg = this._map._pathRoot;
            this._path.setAttribute('id', id);

            if (options.repeat) {
                /* Compute single pattern length */
                var pattern = L.Path.prototype._createElement('text');
                for (var attr in options.attributes)
                    pattern.setAttribute(attr, options.attributes[attr]);
                pattern.appendChild(document.createTextNode(text));
                svg.appendChild(pattern);
                var alength = pattern.getComputedTextLength();
                svg.removeChild(pattern);

                /* Create string as long as path */
                text = new Array(Math.ceil(this._path.getTotalLength() / alength)).join(text);
            }

            /* Put it along the path using textPath */
            var textNode = L.Path.prototype._createElement('text'),
                textPath = L.Path.prototype._createElement('textPath');

            var dy = options.offset || this._path.getAttribute('stroke-width');

            textPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", '#' + id);
            textNode.setAttribute('dy', dy);
            for (var attr in options.attributes)
                textNode.setAttribute(attr, options.attributes[attr]);
            textPath.appendChild(document.createTextNode(text));
            textNode.appendChild(textPath);
            this._textNode = textNode;

            if (options.below) {
                svg.insertBefore(textNode, svg.firstChild);
            }
            else {
                svg.appendChild(textNode);
            }

            /* Center text according to the path's bounding box */
            if (options.center) {
                var textLength = textNode.getComputedTextLength();
                var pathLength = this._path.getTotalLength();
                /* Set the position for the left side of the textNode */
                textNode.setAttribute('dx', ((pathLength / 2) - (textLength / 2)));
            }

            /* Initialize mouse events for the additional nodes */
            if (this.options.clickable) {
                if (L.Browser.svg || !L.Browser.vml) {
                    textPath.setAttribute('class', 'leaflet-clickable');
                }

                L.DomEvent.on(textNode, 'click', this._onMouseClick, this);

                var events = ['dblclick', 'mousedown', 'mouseover',
                              'mouseout', 'mousemove', 'contextmenu'];
                for (var i = 0; i < events.length; i++) {
                    L.DomEvent.on(textNode, events[i], this._fireMouseEvent, this);
                }
            }
            //设置为不响应鼠标操作
            textNode.style.pointerEvents = "none";
            return this;
        }
    };

    L.Polyline.include(PolylineTextPath);

    L.LayerGroup.include({
        setText: function (text, options) {
            for (var layer in this._layers) {
                if (typeof this._layers[layer].setText === 'function') {
                    this._layers[layer].setText(text, options);
                }
            }
            return this;
        }
    });

})();

/* 埋点 */
(function(){
    try {
        var userDevice = navigator.userAgent.indexOf("iPhone") != -1 ? "iPhone" : "Android";
        var version = "3.0";
        window.accessLogAppender = function(target,key){
            var timeStamp = new Date().getTime();
            $.post("http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/opt_log", JSON.stringify({
                key:key,
                timestamp:timeStamp,
                source:"机场",
                device_type: userDevice,
                version:version,
                opt:target
            }));
        };
    } catch (err) {

    }

})();
///<jscompress sourcefile="index.js" />
var Page = window.Page || {};
var openId = null;
var debugTools = false;
var locationModel = "follow";//定位模式 -free or -follow

//获取颜色配置方案并配置
function getColorConfig(handler) {
    var requestData = { key: Page.URL.getParameter("key") };
    $.ajax({
        type: "POST",
        //url:"http://123.57.74.38:8080/rtmap_lbs_api/v1/rtmap/map_color",
        url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/map_color",
        data: JSON.stringify(requestData)
    }).done(function (data) {
            if (data.result.error_code) {
                if (data.map_color && data.map_color.colorData) {
                    for (var i in data.map_color.colorData) {
                        var obj = data.map_color.colorData[i];
                        Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
                    }
                    Rtmap.Style.setImageConfig(data.map_color.imageData); //设置全局图片属性
                    Rtmap.Style.setGlobalConfig(data.map_color.globalData); //设置全局属性
                    var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
                    $(".canvas").css({ background: canvasColor });
                } else {
                    var gloablData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.globalData; //默认智慧图的全局配置
                    var imageData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.imageData; //默认智慧图的图片地址配置
                    var colorData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.colorData; //默认颜色配置
                    for (i in colorData) {
                        var obj = colorData[i];
                        Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
                    }
                    Rtmap.Style.setImageConfig(imageData);
                    Rtmap.Style.setGlobalConfig(gloablData);
                    var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
                    $(".canvas").css({ background: canvasColor });
                }
            }
            handler();
        });
};

//初始化本地颜色方案
function initializeLocalColorConfig() {
    var gloablData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.globalData; //默认智慧图的全局配置
    var imageData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.imageData; //默认智慧图的图片地址配置
    var colorData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.colorData; //默认颜色配置
    for (i in colorData) {
        var obj = colorData[i];
        Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
    }
    Rtmap.Style.setImageConfig(imageData);
    Rtmap.Style.setGlobalConfig(gloablData);
    var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
    $(".canvas").css({ background: canvasColor });
};

/*
 *JS执行入口
 */
$(document).ready(function () {
    openId = Page.URL.getParameter("openid");
    debugTools = Page.URL.getParameter("debug");
    initializeLocalColorConfig();
    //getColorConfig(function () {
    Rtmap.Scene.initMapContext({ parentDOM: 'canvas' });
    Rtmap.Control.showZoom();//显示Zoom 控件
    Rtmap.Control.showScale(); //显示比例尺
    Rtmap.Control.showLocal(function () {
        /* 点击定位按钮 埋点 */
        accessLogAppender("opt_navi_button_click",Page.URL.getParameter("key"));

        var local = Page.Local.getLocaler();
        if (local) {
            if (Rtmap.Scene.getNowFloor().toUpperCase() != local.floor.toUpperCase()) {
                Rtmap.Scene.changeFloorTo(local.floor);
            }
            ;
            Rtmap.Scene.moveTo(local);
        } else {
            local = Page.wechat.getLocaler();
            if (local) {
                if (Rtmap.Scene.getNowFloor().toUpperCase() != local.floor.toUpperCase()) {
                    Rtmap.Scene.changeFloorTo(local.floor);
                }
                ;
                Rtmap.Scene.moveTo(local);
                locationModel = "follow";//切换为跟随模式
                Rtmap.Control.enableLocal();//默认置灰
            }
            else {
                //Rtmap.Scene.moveToCenter();
            }
        }
        ;
    }); //显示居中按钮
    Rtmap.Control.disableLocal();//默认置灰
    Page.SearchControl = Rtmap.Control.showSearch(); //显示搜索栏
    Page.FloorBtn = Rtmap.Control.showFloorChange(); //显示楼层切换按钮
    var buildId = Page.URL.getParameter("buildid");
    var floor = Page.URL.getParameter("floor");
    var key = Page.URL.getParameter("key");
    var token = Page.URL.getParameter("token");
    if (!(key || token)) {
        alert("Need Key or Token");
        return;
    }
    //是否为捕获模式(在中心打点)
    var capturemode = Page.URL.getParameter("capturemode");
    Page.capturemode = capturemode;

    (function () {
        var showBox = {};
        //            Rtmap.DataProvider.on("beforeGetPoi", function (timestamp) {
        //                for (var key in showBox){
        //                    Page.Controller.DialogLabel.close(showBox[key]);
        //                }
        //                showBox[timestamp] = Page.Controller.DialogLabel.show("正在加载地图...");
        //            });
        //
        //            Rtmap.DataProvider.on("afterGetPoi", function (timestamp) {
        //                Page.Controller.DialogLabel.close(showBox[timestamp]);
        //            });
        //            Rtmap.DataProvider.on("getPoi", function (timestamp) {
        //            Page.Controller.DialogLabel.close(showBox[timestamp]);
        //           });
    })();
    var labelStyle = Page.URL.getParameter("labelstyle");
    //地图初始化默认配置
    Rtmap.Config.setup({
        buildId: buildId,
        defaultFloor: floor || "f1",
        Key: key,
        Token: token,
        showLabelByStar: true,
        PoiStart: {
            "志愿者服务台": 9,
        },
        labelStyle: labelStyle
    });

    //绑定全局事件
    Page.Controller.bindGlobalEvent();
    //初始化地图
    Page.Controller.initMap();

    //右侧区域选择框 黄色提示条
    //Page.areaBar.makeBar();
    //Page.areaBar.makeYellowNotice("flying");
    //});
    //若传入openid，则进行实时定位
    if (openId) {
        Page.wechat.locateAlert();
        Rtmap.WechatLocate.prepare({ debug: "false" });
    }
});

/*
 *Tip UI Control
 */
(function (_page) {
    var Users = {};
    //控制插件用来提起最下方控制栏，以显示Tip框
    _page.controllerHelper = {
        up: function (user) {
            Users[user] = true;
            $(".rtmap_zoom_box").addClass("moveUp");
            $(".rtmap_scale_box").addClass("moveUp");
        },
        down: function (user) {
            delete Users[user];
            var haveUser = false;
            for (var i in Users) {
                haveUser = true;
            }
            if (!haveUser) {
                $(".rtmap_zoom_box").removeClass("moveUp");
                $(".rtmap_scale_box").removeClass("moveUp");
            }
        }
    }
})(window.Page);

/*
 * Global Event
 */
(function (_page) {
    function _bindGlobalEvent() {

        var firstLoad = true;

        Rtmap.DataProvider.getBuildInfo({}, function (err, data) {
            Page.FloorBtn.setData(data.floorinfo);

            var d = $("<div/>", {
                text: data.name_chn,
                class: "build_name"
            });

            $(".searchInput").attr("placeholder", "搜索店铺   @" + data.name_chn);
            $("title[class=bdn]").html(data.name_chn);
        });
        Rtmap.Scene.on("mapClick", function (obj) {
            Page.Tip.close();
        });

        Rtmap.Scene.on("BKClick", function (obj) {
            return;
        });

        Rtmap.TrackFactory.on("successTrack", function (pointList, distance) {
//            Page.ClearBtn.show("Track");
//            Page.ClearBtn.bind("clearPath",function(){
//                Rtmap.TrackFactory.clearPath();
//                Page.controllerHelper.down("TrackDashboard");
//                Page.TrackDashboard.close();
//            });
            /* anjun 16-05-26 */
        });

        var iCurrentTry = 1;
        var iTryCount = 10;

        //设置定位点并作为默认起点
        function setLocation() {
            Page.wechat.getUserPositionBase(openId, function (data) {
                if (data.result.error_code == 0) {
                    var x = data.user_position.x;
                    var y = data.user_position.y;
                    var floor = data.user_position.floor;
                    var startPoi = {
                        x: x,
                        y: y,
                        floor: floor
                    };
                    Rtmap.TrackFactory.setStartPoi(startPoi);
                }
                else {
                    iCurrentTry++;
                    if (iCurrentTry <= iTryCount && !Rtmap.TrackFactory.getTrackStatus) {
                        console.log(iCurrentTry);
                        setTimeout(function () {
                            setLocation();
                        }, 2000);
                    }
                }
            });
        }

        //设置导航起点
        function setTrackPoint(routeAry) {
            var Point = routeAry[0];
            var endPoi = {
                x: Point[0],
                y: Point[1],
                floor: Point[2]
            };
            Rtmap.TrackFactory.setEndPoi(endPoi, "car");
            //Rtmap.Scene.changeFloorTo(Point[2]);
            Page.wechat.getUserPositionBase(openId, function (data) {
                if (data.result.error_code == 0) {

                    $.confirm({
                        title: "提示",
                        content: "已为您找到导引路径，立即查看？",
                        confirmButton: '确定',
                        cancelButton: '取消',
                        confirm: function () {
                            var x = data.user_position.x;
                            var y = data.user_position.y;
                            var floor = data.user_position.floor;
                            var startPoi = {
                                x: x,
                                y: y,
                                floor: floor
                            };

                            Rtmap.TrackFactory.setStartPoi(startPoi);
                            Rtmap.TrackFactory.setEndPoi(endPoi, "car");
                        },
                        cancel: function () {
                            console.log('the user clicked cancel');
                        }
                    });
                }
                else {
                    iCurrentTry++;
                    if (iCurrentTry <= iTryCount) {
                        console.log(iCurrentTry);
                        setTimeout(function () {
                            setTrackPoint(routeAry);
                        }, 2000);
                    } else {//增加定位失败提示
                        //
                        //  Page.Controller.DialogLabel.show("未获得您的位置，请手动选择起点或重试",2000);

                        //  Rtmap.Scene.moveTo({
                        //     x: Point[0],
                        //     y: Point[1]
                        // });
                    }
                }
            });
        }

        //显示路径中的点和导航路径
        function drawPoints() {
            //point 参数 point=x,y
            var pointStr = Page.URL.getParameter("point");
            if (pointStr) {
                var coords = pointStr.split(",");
                Rtmap.Scene.createMarker({ x: parseFloat(coords[0]), y: parseFloat(coords[1]) });
            }
            //points参数带[]
            var pointsStr = Page.URL.getParameter("points");
            if (pointsStr) {
                var pointAry = JSON.parse(pointsStr);
                for (var i = 0; i < pointAry.length; i++) {
                    Rtmap.Scene.createMarker({ x: pointAry[i][0], y: pointAry[i][1] });
                }
            }
            try {
                var route = Page.URL.getParameter("route");
                var routeAry = JSON.parse(route);
                if (routeAry && routeAry.length > 1) {
                    var routePoint = [];
                    for (var i = 0; i < routeAry.length; i++) {
                        var Point = routeAry[i];
                        if (i > 0 && i != routeAry.length - 1) {
                            var point = {
                                x: Point[0],
                                y: Point[1],
                                floor: Point[2]
                            };
                            routePoint.push(point);
                        } else if (i == 0) {
                            var startPoi = {
                                x: Point[0],
                                y: Point[1],
                                floor: Point[2]
                            };
                            Rtmap.Scene.changeFloorTo(Point[2]);
                        } else if (i > 0 && i == routeAry.length - 1) {
                            var endPoi = {
                                x: Point[0],
                                y: Point[1],
                                floor: Point[2]
                            };
                        }
                        startPoi ? Rtmap.TrackFactory.setStartPoi(startPoi) : "";
                        routePoint.length > 0 ? Rtmap.TrackFactory.setRoutePoints(routePoint) : "";
                        endPoi ? Rtmap.TrackFactory.setEndPoi(endPoi) : "";
                    }
                } else if (routeAry && routeAry.length == 1) {
                    //只传入终点,并且openId存在
                    if (openId) {
                        setTrackPoint(routeAry);
                    } else {
                        var Point = routeAry[0];
                        var startPoi = {
                            x: Point[0],
                            y: Point[1],
                            floor: Point[2]
                        };
                        Rtmap.TrackFactory.setStartPoi(startPoi, "car");
                    }
                } else if (openId) {//只传入openId，显示起点
                    setLocation();
                }
            } catch (e) {
                console.log(e);
            }
            //支持endpoint_name参数，传入终点名称导航
            try {
                var pointNameStr = Page.URL.getParameter("endpoint_name");
                if (pointNameStr) {
                    var floor = Rtmap.Config.getOption().defaultFloor.toUpperCase();
                    var poilayer = Rtmap.Scene.getPoiByName(floor, pointNameStr);
                    if (poilayer) {
                        Rtmap.TrackFactory.setEndPoi(poilayer);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }

        //根据poino选中要素
        function selectPoiByNo(poiNo) {
            var floor = Rtmap.Config.getOption().defaultFloor.toUpperCase();
            var poiLayer = Rtmap.Scene.getPoiByNum(floor, poiNo);
            if (poiLayer) {
                var name = poiLayer.feature.properties.name_chinese;
                Page.Tip.show({
                    layer: poiLayer,
                    poiName: name,
                    parentDOM: $("#infoBox"),
                    start: function () {
                        Rtmap.TrackFactory.setStartPoi(poiLayer);
                    },
                    end: function () {
                        Rtmap.TrackFactory.setEndPoi(poiLayer);
                    }
                });
            }
        }

        var crossFloorSearchAction = null;
        Rtmap.Scene.on("drawedMap", function () {
            var zoom = null;
            var center = null;
            if (firstLoad) {
                zoom = Page.URL.getParameter("zoom");
                try {
                    center = JSON.parse(Page.URL.getParameter("center"));
                } catch (e) {

                }
                poiNo = Page.URL.getParameter("poino");
                if (poiNo) {
                    selectPoiByNo(parseInt(poiNo));
                }
                firstLoad = false;
                drawPoints();
                if (center) {
                    setTimeout(function () {
                        Rtmap.Scene.moveTo({
                            x: center[0],
                            y: center[1]
                        }, zoom);
                    });
                } else {
                    //此处不再设置范围，改为在加载完BK层后设置范围
                    //Rtmap.Scene.fitBounds();
                }
                //不带中括号方式
                var centerPoint = Page.URL.getParameter("centerpoint");
                if (centerPoint) {
                    var coords = centerPoint.split(",");
                    setTimeout(function () {
                        Rtmap.Scene.moveTo({
                            x: parseFloat(coords[0]),
                            y: parseFloat(coords[1])
                        }, zoom);
                    });
                }

                //begin location
                Rtmap.Location.start(function (msg) {
                });

                Rtmap.Location.on("haveLocation", function (locationData) {
                    Page.Local.update(locationData.x, locationData.y, locationData.floor.toLowerCase());
                });
            }
            crossFloorSearchAction ? crossFloorSearchAction() : "";
            crossFloorSearchAction = null;
            //绘制完地图后再弹出提示
            if (Page.SearchControl.isChangeToNearFloor) {
                Page.Controller.DialogLabel.show("当前楼层无该设施，已为您跳转至" + Page.SearchControl.changeToFloor + "层。", 2000);
                Page.SearchControl.isChangeToNearFloor = false;
            }
        });

        Rtmap.Scene.on("mapDrag", function (obj) {
            Page.Local.changeModel("free");
            locationModel = "free";
            Rtmap.Control.disableLocal();//默认置灰
        });

        var changeToNearFloor = false;
        //因为没有本层结果，触发跳转到最近结果的事件
        Page.SearchControl.on("changeToNearFloor", function (floor) {
            //Page.Controller.DialogLabel.show("当前楼层无该设施，为您跳转至"+floor.toUpperCase()+"层。",2000);
            changeToNearFloor = true;
            //绘制完地图后再弹出提示
            Page.SearchControl.changeToFloor = floor.toUpperCase();
            Page.SearchControl.isChangeToNearFloor = true;
        });

        //触发标记搜索结果到地图上的事件
        Page.SearchControl.on("markerSearchToMap", function (poiDatas, markers) {
            Page.ClearBtn.show("Search");

            function clearSearchResultEvent() {
                Page.SearchControl.clearSearchResult();
            };
            //移除事件
            Page.ClearBtn.removeEvent(
                clearSearchResultEvent
            );
            //添加事件
            Page.ClearBtn.addEvent(
                clearSearchResultEvent
            );

            for (var i = 0; i < markers.length; i++) {
                (function () {
                    var data = poiDatas[i];
                    markers[i].on("click", function () {
                        bindEvent(data);
                    });
                })();
            }
            if (changeToNearFloor) {
                crossFloorSearchAction = function () {
                    bindEvent(poiDatas[0]);
                }
            } else {
                bindEvent(poiDatas[0]);
            }
            ;
            changeToNearFloor = false;//重置状态
            var deleteM;

            function removeSelectedMarkers() {
                deleteM ? Rtmap.Scene.addLayer(deleteM) : "";
                for (var i = 0; i < markers.length; i++) {
                    if (markers[i].selected) {
                        deleteM = markers[i];
                        Rtmap.Scene.removeLayer(markers[i]);
                        break;
                    }
                }
            };
            function bindEvent(data) {
                Page.Tip.show({
                    layer: Rtmap.Scene.getPoiByNum(data.floor, data.poi_no),
                    poiName: data.name,
                    parentDOM: $("#infoBox"),
                    start: function () {
                        //根据 poi Num 获取POI层
                        var layer = Rtmap.Scene.getPoiByNum(data.floor, data.poi_no);
                        removeSelectedMarkers();
                        Rtmap.TrackFactory.setStartPoi(layer);
                    },
                    end: function () {
                        //根据 poi Num 获取POI层
                        var layer = Rtmap.Scene.getPoiByNum(data.floor, data.poi_no);
                        removeSelectedMarkers();
                        Rtmap.TrackFactory.setEndPoi(layer);
                    }
                });
            }

            Page.ClearBtn.addEvent(function () {
                Page.Tip.close();
            });

            if (Rtmap.TrackFactory.getTrackStatus()) {
                Rtmap.TrackFactory.clearPath();
                Page.controllerHelper.down("TrackDashboard");
                Page.TrackDashboard.close();
            }
        });
        //
        Page.SearchControl.on("searchFocus", function (events) {
            Page.Tip.closeCusDetail();
        });
        Page.SearchControl.on("categoryBtn", function (events) {
            Page.Tip.closeCusDetail();
        });
        Page.SearchControl.on("searchBtn", function (events) {
            Page.Tip.closeCusDetail();
        });

        Page.SearchControl.on("clearSearchResult", function (poiData) {
            if (!Rtmap.TrackFactory.getTrackStatus()) {
                Page.ClearBtn.close("Search");
            }
        });

        (function () {
            var showBox = {};
            Rtmap.Search.on("beforeSearch", function (timestamp) {
                showBox[timestamp] = Page.Controller.DialogLabel.show("正在搜索...");
            });

            Rtmap.Search.on("afterSearch", function (data, timestamp) {
                Page.Controller.DialogLabel.close(showBox[timestamp]);
                if ((!data.poilist) || data.poilist.length < 1) {
                    Page.Controller.DialogLabel.show("没有找到相关店铺或设施", 1000);
                }
            });
        })();

        Rtmap.Scene.on("changeFloor", function (f) {
            $("#floorChange").html(f.toUpperCase() + "");
            var d = Page.floorChange.getFloorInfo(f);
            $("#floorInfo").html(d + "");
            Page.Tip.close();
            //Rtmap.DataProvider.cacheAbutFloor({floor:f},function(){});
        });

        Rtmap.Scene.on("poiClick", function (data, layer) {
            //bk layer传入
            if (!layer) {
                Page.Tip.close();
                return;
            }
            //选中marker移除
            var marker = Rtmap.Scene.SelectMarker;
            marker ? Rtmap.Scene.removeLayer(marker, true) : "";
            var name = layer.feature.properties.name_chinese;
            Page.Tip.show({
                layer: layer,
                poiName: name,
                parentDOM: $("#infoBox"),
                start: function () {
                    Rtmap.TrackFactory.setStartPoi(layer);
                },
                end: function () {
                    Rtmap.TrackFactory.setEndPoi(layer);
                }
            });
            var redIconUrl = Rtmap.Style.getGlobalConfig("focus_icon_url");
            var _icon = L.icon({
                iconUrl: redIconUrl,
                iconRetinaUrl: redIconUrl,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            });
            marker = Rtmap.Scene.createMarker({ x: layer.feature.properties.x_coord, y: layer.feature.properties.y_coord, icon: _icon });
            marker.selected = true;
            Rtmap.Scene.SelectMarker = marker;
        });
    };

    function _initMap() {
        var f = Rtmap.Config.getOption().defaultFloor;
        Rtmap.Scene.changeFloorTo(f);
    };

    var _alertLabel = (function () {
        function _show(txt) {
            var alertBox = $("<div/>", {class: "alertBox"});
            alertBox.text(txt);
            $("body").append(alertBox);
            return alertBox;
        };

        function _clearShow(box) {
            if (box) {
                box.remove();
            }
        }

        return{
            getShow: _show,
            clearShow: _clearShow
        }
    })();

    var _dialogLabel = (function () {
        var _dialog = null;

        function _show(txt, time) {
            _dialog = $("<div/>", {class: "dialog_label"});
            var text = $("<div/>", {class: "content", text: txt});
            _dialog.html("").css({opacity: 1}).append(text);
            $("body").append(_dialog);
            height = text[0].scrollHeight;
            text.css({"margin-top": -height / 2 + "px"});
            //anj
            text.css({"text-shadow": "0 0 0"});
            if (time) {
                (function () {
                    var d = _dialog;
                    setTimeout(function () {
                        _close(d);
                    }, time);
                })()
            }
            return _dialog;
        };


        function _close(dailog) {
            dailog.animate({opacity: 0.01}, 500, function () {
                dailog.html("").remove().css({opacity: 1});
            });
        }

        return{
            show: _show,
            close: _close
        }
    })();

    _page.Controller = {
        bindGlobalEvent: _bindGlobalEvent,
        initMap: _initMap,
        AlertLabel: _alertLabel,
        DialogLabel: _dialogLabel
    }
})(window.Page);

/*
 *Clear Btn UI
 */
(function (_page) {
    var showStatus = false; //hide
    var Events = [];
    var JsonEvents = {};
    var clearBtn = $('<div class="clearBtn clearSearch"><img src="./public/img/cleanup.png"></div>');
    var showList = {};

    clearBtn.click(function () {
        for (var i in JsonEvents) {
            JsonEvents[i]();
        }
        for (var i = 0; i < Events.length; i++) {
            Events[i]();
        }
        if (!showStatus) {
            Events.length = 0;
        }
        //anj
        $(".tip_box").hide();
    });

    _page.ClearBtn = {
        show: function (name) {
            showList[name] = 0;
            showStatus = true;
            $(".top_right_bar").append(clearBtn);
            clearBtn.show();
        },
        addEvent: function (func) {
            Events.push(func);
        },
        removeEvent: function (func) {
            for (var i = 0; i < Events.length; i++) {
                if (Events[i].name == func.name) {
                    Events.splice(i, 1);
                    return;
                }
            }
        },
        bind: function (action, handler) {
            JsonEvents[action] = handler;

        },
        close: function (name) {
            delete showList[name];
            var haveUser = false;
            for (var i in showList) {
                haveUser = true;
            }
            if (!haveUser) {
                showStatus = false;
                clearBtn.hide();
            }
        }
    }
})(window.Page);

/*
 * Floor List UI
 */
(function (_page) {
    var _floorAry;
    var _floorJson = {};

    function _createFloorList() {
        var ul = $("<ul/>", {class: "show_floor_list"});
        for (var i = 0; i < _floorAry.length; i++) {
            var li = $("<li/>", {class: "li"});
            li.append("<div class='floor'>" + _floorAry[i].floor + "</div>");
            li.append("<div class='desc'>" + _floorAry[i].desc + "</div>");
            ul.append(li);
            _bindEvent(li, _floorAry[i].floor);
        }
        ;
        return ul;
    }

    function _bindEvent(tag, floor) {
        tag.click(function () {
            Rtmap.Scene.changeFloorTo(floor.toLowerCase());
            return false;
        });
    }

    _page.floorChange = {
        changeFloor: function () {
            var ul = _createFloorList();
            $("#infoBox").html("").append(ul);
        },
        setData: function (data) {
            if (!data.build_detail) {
                return;
            }
            _floorAry = data.build_detail.floorinfo;
            for (var i = 0; i < _floorAry.length; i++) {
                var key = _floorAry[i].floor.toLowerCase();
                _floorJson[key] = _floorAry[i].desc;
            }
        },
        getFloorInfo: function (floor) {
            floor = floor.toLowerCase();
            return _floorJson[floor];
        }
    };
})(window.Page);

/*
 *Tip and Detail UI
 */
(function (_page) {
    var tip_box = $("<div/>", {class: "tip_box"});
    var detail_box = $("<div/>", {class: "detail_Tip"});
    var startFuc = null;
    var endFuc = null;
    var showLayer = null;
    //选中要素样式
    var overstyle = {
        color: "#844d8c",
        fillColor: "#c28dc4",
        weight: 1,
        opacity: 1,
        fillOpacity: 1
    };
    var strHtml = '' +
        '<div class="top_bar">' +
        '<div class="title"></div>' +
        '<i class="fa fa-close close"></i>' +
        //'<div class="detail_enter"><i class="fa fa-angle-up"></i> 详情 </div>'+
        '</div>' +
        '<div class="btn_bar">' +
        '<div class="start"><i class="fa fa-long-arrow-up"></i>从这里出发</div>' +
        '<div class="end"><i class="fa fa-long-arrow-down"></i>去这里</div>' +
        '</div>';

    var detailHtml = '<div class="back"><i class="fa fa-close"></i></div>' +
        '<iframe src=""></iframe>';

    var cusDetailHtml = null;
    var cusDetailDOM = null;
    var showStatus = false;

    function updateHtml(json) {
        var image = "";
        var descript = "";
        var moregroup = "";
        var currecy = "";
        var phone = "";
        if (json.poi_image) {
            image = '<div class="group">' +
                '<img class="poi_image" src="' + json.poi_image + '" />' +
                '</div>';
        }
        ;
        if (json.poi_descript) {
            descript = '<div class="group">' +
                '<p>' + json.poi_descript + '</p>' +
                '</div>';
        }
        ;
        if (json.support_currecy) {
            currecy = '<p class="poi_phone_list">' +
                '<span>支持货币:</span>' +
                '<span class="poi_phone">' + (json.support_currecy || "") + '</span>' +
                '</p>';
        }
        ;
        if (json.more) {
            moregroup = '<a class="more">更多...</a>';
        }
        ;
        if (json.phone_number) {
            var ary = json.phone_number.split(",");
            for (var i = 0; i < ary.length; i++) {
                phone += '<a href="tel:' + ary[i] + '">' + ary[i] + '</a> &nbsp;';
            }
        }
        cusDetailHtml =
            '<div class="cus_detail">' +
                '<div class="detail_box">' +
                '<div class="poi_info">' +
                '<div class="group">' +
                '<div class="poi_logo">' +
                (json.poi_logo ? '<img src=' + json.poi_logo + '>' : "") +
                '</div>' +
                '<span class="poi_title">' + (json.poi_name || "") + '</span>' +
                '<p class="poi_address_list">' +
                '<span>地址：</span>' +
                '<span class="poi_address">' + (json.poi_address || "") + '</span>' +
                '</p>' +
                '<p class="poi_phone_list">' +
                '<span>电话：</span>' +
                '<span class="poi_phone">' + phone + '</span>' +
                '</p>' +
                '</div>' +
                '<div class="group">' +
                '<p class="poi_address_list">' +
                '<span>分类：</span>' +
                '<span class="poi_address">' + (json.business_type || "") + '</span>' +
                '</p>' +
                '<p class="poi_phone_list">' +
                '<span>营业时间：</span>' +
                '<span class="poi_phone">' + (json.business_time || "") + '</span>' +
                '</p>' +
                currecy +
                '</div>' +
                image +
                descript +
                moregroup +
                '</div>' +
                '</div>' +
                '</div>';
        cusDetailDOM ? cusDetailDOM.remove() : '';
        cusDetailDOM = $(cusDetailHtml);
        cusDetailDOM.find(".more").click(function () {
            showDetail(json.more);
        });
    }

    function toggleCusDetail(json) {
        if (!showStatus) {
            updateHtml(json);
            showStatus = true;
            $("body").append(cusDetailDOM);
            tip_box.find(".detail_enter").find("i").removeClass("fa-angle-up").addClass("fa-angle-down");
        } else {
            _closeCusDetail();
        }
    }

    function _closeCusDetail() {
        tip_box.find(".detail_enter").find("i").removeClass("fa-angle-down").addClass("fa-angle-up");
        showStatus = false;
        cusDetailDOM ? cusDetailDOM.remove() : "";
    }

    function showDetail(url) {
        detail_box.html("").append(detailHtml);
        detail_box.find(".back").click(function () {
            detail_box.remove();
        });
        detail_box.find("iframe").attr("src", url);
        $("body").append(detail_box);
    }

    tip_box.append(strHtml);

    tip_box.find(".close").click(function () {
        reStyle();
        _page.Tip.close();
    });

    tip_box.find(".start").click(function () {
        startFuc ? startFuc() : "";
        tip_box.hide();
        reStyle();
        _page.Tip.close();
        Page.ClearBtn.show("Track");
        Page.ClearBtn.bind("clearPath", function () {
            Rtmap.TrackFactory.clearPath();
            Page.controllerHelper.down("Tip");
        });

//        设置导航页信息
        if (window.createSetStartPage) {
            window.createSetStartPage({
                x: showLayer.feature.properties.x_coord,
                y: showLayer.feature.properties.y_coord,
                floor: Rtmap.Scene.getNowFloor().toLowerCase(),
                poi_no: showLayer.feature.properties.poi_no,
                poi_name: showLayer.feature.properties.name_chinese,
                type: "start"
            });
        }
    });

    tip_box.find(".end").click(function () {
        endFuc ? endFuc() : "";
        tip_box.hide();
        reStyle();
        _page.Tip.close();
        Page.ClearBtn.show("Track");
        Page.ClearBtn.bind("clearPath", function () {
            Rtmap.TrackFactory.clearPath();
            Page.controllerHelper.down("Tip");
        });

//        设置导航页信息
        if (window.createSetStartPage) {
            window.createSetStartPage({
                x: showLayer.feature.properties.x_coord,
                y: showLayer.feature.properties.y_coord,
                floor: Rtmap.Scene.getNowFloor().toLowerCase(),
                poi_no: showLayer.feature.properties.poi_no,
                poi_name: showLayer.feature.properties.name_chinese,
                type: "end"
            });
        }
    });

    tip_box.find(".detail_enter").click(function () {
        Page.SearchControl.hideCategory();
        var url = $(this).data("url");
        var type = $(this).data("type");
        var data = $(this).data("data");
        var self = this;
        if (url) {
            if (type == "html") {
                showDetail(url);
            } else if (type == 'button') {
                if (data.classify_attr) {
                    Page.PoiDetail.getDetailData(data, function (err, res) {
                        if (!err) {
                            res.more = url;
                            toggleCusDetail(res)
                        }
                    });
                } else {
                    toggleCusDetail({
                        more: url,
                        poi_name: data.name_chinese
                    })
                }
            }
        } else {
            Page.PoiDetail.getDetailData(data, function (err, res) {
                if (!err) {
                    toggleCusDetail(res)
                }
            });
        }
    });


    function reStyle() {
        if (showLayer) {
            var poiType = showLayer.feature.properties.style;
            var style = Rtmap.Style.getStyleByPoiType(poiType);
            //乘机相关换成黄底
            if (Rtmap.Classification.travelpoi.isTravelPoi(showLayer.feature.properties.two_class)) {
                style = {
                    type: 5,                 //poi
                    fillColor: "#efe39c",       //填充颜色
                    color: "#ba9856",           //边框颜色
                    weight: 0.5,                  //边框宽度
                    opacity: 1,                  //边框透明度
                    fillOpacity: 1,              //填充透明度,
                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                        fillColor: "#dddddd",
                        color: "#e9bbba",
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: 1
                    }
                };
            }
            //机场相关POI
            else if (Rtmap.Classification.airportpoi.isAirportpoi(showLayer.feature.properties.two_class)) {
                style = {
                    type: 5,                 //poi
                    fillColor: "#d0dee2",       //填充颜色
                    color: "#8eadc1",           //边框颜色
                    weight: 0.5,                  //边框宽度
                    opacity: 1,                  //边框透明度
                    fillOpacity: 1,              //填充透明度,
                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                        fillColor: "#dddddd",
                        color: "#e9bbba",
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: 1
                    }
                };
            }
            //商业相关POI
            else if (Rtmap.Classification.businesspoi.isBusinessPoi(showLayer.feature.properties.two_class)) {
                style = {
                    type: 5,                 //poi
                    fillColor: "#d8e0ca",       //填充颜色
                    color: "#97a869",           //边框颜色
                    weight: 0.5,                  //边框宽度
                    opacity: 1,                  //边框透明度
                    fillOpacity: 1,              //填充透明度,
                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                        fillColor: "#dddddd",
                        color: "#e9bbba",
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: 1
                    }
                };
            }
            //餐饮相关POI
            else if (Rtmap.Classification.restaurantpoi.isRestaurantPoi(showLayer.feature.properties.two_class)) {
                style = {
                    type: 5,                 //poi
                    fillColor: "#efe5ce",       //填充颜色
                    color: "#c9a659",           //边框颜色
                    weight: 0.5,                  //边框宽度
                    opacity: 1,                  //边框透明度
                    fillOpacity: 1,              //填充透明度,
                    hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                        fillColor: "#dddddd",
                        color: "#e9bbba",
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: 1
                    }
                };
            }

            if (showLayer.setStyle) showLayer.setStyle(style);
        }
    }

    Rtmap.TrackFactory.on("drawPath", function (e, trackLine) {
        Page.SearchControl.clearSearchResult();
        if (trackLine) {
            window.setTimeout(function () {
                if (!Rtmap.TrackFactory.getCTrackLine()) {
                    Rtmap.Scene.getMap().fitBounds(trackLine.getBounds().pad(0.2));
                }
            }, 350);
        }
    });

    Rtmap.TrackFactory.on("clearPath", function () {
        Page.ClearBtn.close("Track");
        Page.controllerHelper.down("TrackDashboard");
    });

    Rtmap.TrackFactory.on("needStartPoi", function () {
        Page.Controller.DialogLabel.show("请选择起点", 1000);
    });

    (function () {
        var showBox = {};
        Rtmap.TrackFactory.on("beforeRequest", function (timestamp) {
            //showBox['a']=Page.Controller.DialogLabel.show("正在规划路径...");
        });
        Rtmap.TrackFactory.on("afterRequest", function () {
            // Page.Controller.DialogLabel.close(showBox["a"]);
        });
    })();

    Rtmap.Scene.on("poiMouseover", function (layer, f) {
        var poiStyle = f.properties.style;
        var style = Rtmap.Style.getStyleByPoiType(poiStyle).hover || overstyle;
        layer.setStyle(overstyle);
    });

    Rtmap.Scene.on("poiMouseout", function (layer, f) {
        if (showLayer != layer) {
            var poiStyle = f.properties.style;
            var style = Rtmap.Style.getStyleByPoiType(poiStyle);
            layer.setStyle(style);
        }
    });

    function detialBtncheck(json) {
        if (!json.layer) {
            return;
        }
        var properties = json.layer.feature.properties;
        _closeCusDetail();
        if (Rtmap.Config.getOption().vendorDetailUrl) {
            Page.PoiDetail.getVendorDetail(properties, function (data) {
                if (data.result.error_code == "0") {
                    if (data.url) {
                        tip_box.find(".detail_enter").show();
                        tip_box.find(".detail_enter").data("url", data.url);
                        tip_box.find(".detail_enter").data("type", data.type);
                        tip_box.find(".detail_enter").data("data", properties);
                    } else if (properties.classify_attr == 0) {
                        tip_box.find(".detail_enter").data("url", null).hide();
                    } else {
                        tip_box.find(".detail_enter").data("url", null).data("data", properties).show();
                    }
                }
            });
        } else if (properties.classify_attr != 0) {
            tip_box.find(".detail_enter").data("url", null).data("data", properties).show();
        }
    }

    _page.Tip = {
        show: function (json) {
            Page.controllerHelper.up("Tip");
            reStyle();
            showLayer = json.layer;
            if (showLayer)
                showLayer.setStyle ? showLayer.setStyle(overstyle) : "";
            tip_box.show();
            tip_box.find(".title").text(json.poiName);
            tip_box.find(".detail_enter").hide();
            detialBtncheck(json);
            startFuc = json.start;
            endFuc = json.end;
            $("body").append(tip_box);
            $(".dashboardList").hide();
        },
        close: function () {
            //选中marker移除
            var marker = Rtmap.Scene.SelectMarker;
            marker ? Rtmap.Scene.removeLayer(marker, true) : "";
            reStyle();
            $(".dashboardList").show();
            tip_box.hide();
            _closeCusDetail();
            Page.controllerHelper.down("Tip");
        },
        closeCusDetail: _closeCusDetail
    }
})(window.Page);

/*
 *DetailInfo Service
 */
(function (_page) {
    function _getDetailData(json, callback) {
        $.ajax({
            type: "post",
            url: "http://lbsapi.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/classify_poiinfo",
            //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/classify_poiinfo",
            data: JSON.stringify({
                key: Page.URL.getParameter("key"),
                buildid: Rtmap.Config.getOption().buildId,
                floor: json.floor || 'F2',
                poi_no: json.poi_no || '75',
                classify_id: json.classify_attr || '1'
            })
        }).done(function (data) {
                if (data.result.error_code == 0) {
                    callback ? callback(null, data.poiinfo) : "";
                }
                callback ? callback(data.result.error_msg) : "";
            });
    }

    function _getVendorDetail(json, callback) {
        $.ajax({
            type: "get",
            url: Rtmap.Config.getOption().vendorDetailUrl,
            data: {
                buildid: json.id_build,
                floor: json.floor,
                poi_no: json.poi_no
            },
            jsonp: "callback",
            jsonpCallback: "handler",
            dataType: "jsonp",
        }).done(function (data) {
                callback ? callback(data) : "";
            });
    };

    _page.PoiDetail = {
        getDetailData: _getDetailData,
        getVendorDetail: _getVendorDetail
    }
})(Page);

/*
 * location for web browser
 */
(function (_page) {
    var localer = null;
    var oldX = null, oldY = null;
    var animate = null;
    var model = "follow"

    function Localer(x, y, floor) {
        this.x = x;
        this.y = y;
        this.floor = floor;
        var icon = L.icon({
            iconUrl: "./public/img/position.png",
            iconRetinaUrl: "./public/img/position.png",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            shadowSize: [68, 95],
            shadowAnchor: [22, 94]
        });
        this.body = Rtmap.Scene.createMarker({ icon: icon, floor: floor, fillOpacity: 1, opacity: 1, fillColor: "#0091FF", color: "#fff", weight: 2, size: 10, x: x, y: y });
    }

    //no used can be deleted
    Localer.prototype.flashLoop = function () {
        var carCircleSize = 10;
        var step = 0.2;
        var self = this;
        var scope = this.scope;
        scope.animate = new Rtmap.Animate(function () {
            carCircleSize += step;
            if (carCircleSize < 10 || carCircleSize > 25) {
                step = -step;
                carCircleSize = 10;
            }
            self.scope.setRadius(carCircleSize);
        });
        //scope.animate.run();
    };
    Localer.prototype.updateLocation = function (x, y, floor) {
        this.x = x;
        this.y = y;
        this.floor = floor;
        var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
        this.body.setLatLng(latlng);
        this.scope.setLatLng(latlng);
        console.log(this.floor, Rtmap.Scene.getNowFloor());
        if (this.floor == Rtmap.Scene.getNowFloor()) {
            this.scope.bringToFront();
            this.body.bringToFront();
            console.log(1);
        }
    };

    function _update(x, y, floor) {
        if (oldX == x && oldY == y) {
            return;
        }
        var nowX = parseFloat(oldX);
        var nowY = parseFloat(oldY);
        oldX = x;
        oldY = y;
        if (localer != null) {
            localer.updateLocation(x, y, floor);
            return;
            var oneStepX = (x - nowX) / 30;
            var oneStepY = (y - nowY) / 30;

            var count = 0;
            animate = new Rtmap.Animate(function (timestamp) {
                nowX += oneStepX;
                nowY += oneStepY;
                count++;
                if (count > 28) {
                    count = 0;
                    animate.clear();
                    if (model == "follow") {
                        //Rtmap.Scene.moveTo({x:nowX,y:nowY});
                    }
                } else {
                    localer.updateLocation(nowX, nowY);
                }
            });
            animate.run();
        } else {
            localer = new Localer(x, y, floor);
        }
    }

    _page.Local = {
        update: _update,
        changeModel: function (_model) {
            model = _model;
            if (_model == "follow") {
                Rtmap.Scene.moveTo({x: oldX, y: oldY});
            }
        },
        stop: function () {
            animate ? animate.stop() : "";
        },
        setLocaler: function () {

        },
        getLocaler: function () {
            return localer;
        }
    }
})(window.Page);

/*
 *URL util
 */
(function (_page) {
    function _getURLParameter(name, search) {
        var _search = search || location.search;
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(_search) || [, ""])[1].replace(/\+/g, '%20')) || null
    }

    _page.URL = {
        getParameter: function (name, search) {
            var str = _getURLParameter(name, search);
            str ? str = str.replace(/\//g, "") : "";
            return str
        }
    }
})(window.Page);

/*
 this function use to copy url to clipboard.
 * */
function getURL() {
    window.prompt("Ctrl+C,Enter", encodeURI(location.href));
}

/*
 * wechat realtime location
 */
(function (_page) {
    var _locationTimer = null;
    var _locationMarker = null;
    var _locationTargetLine = null;//实时定位点与目标点之间的直线
    var _lastLocationUpdateTime = null;
    var _openid = null;
    var _localer = null;
    var _bNavigator = true;//是否执行过导航
    var _bIsFirstLocation = true;

    function _getUserPosition(openid) {
        $.ajax({
            type: "post",
            url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/lbs_locateinfo",
            data: JSON.stringify({
                user_id: openid
            })
        }).done(function (data) {
                _drawLocation(data);
            });
    }

    function _drawLocation(data) {
        if (data.result.error_code == 0) {
            clearTimeout(window.locateAlertTmp);
            _updateStartMarker(data.lbsinfo.x, data.lbsinfo.y, data.lbsinfo.floor);
        }
    }

    function _getUserPositionBase(openid, callBack) {
        $.ajax({
            type: "post",
            url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/lbs_locateinfo",
            data: JSON.stringify({
                user_id: openid
            })
        }).done(function (data) {
                callBack(data);
            });
    }

    function _startLocation(openid) {
        _openid = openid;
        _locationTimer = window.setInterval(function () {
            _getUserPosition(_openid);
        }, 3000);
    }

    function _updateStartMarker(x, y, floor) {
        _localer = {};
        _localer.x = x;//user_position
        _localer.y = y;
        _localer.floor = floor;
        //_lastLocationUpdateTime = new Date().getTime();
        if (_locationMarker) {
            if (_locationMarker._map == null) {
                _locationMarker = null;
            }
        }
        if (!_locationMarker) {
            if (Rtmap.Scene.getNowFloor().toUpperCase() == floor.toUpperCase()) {
                var icon = L.icon({
                    iconUrl: "./public/img/position.png",
                    iconRetinaUrl: "./public/img/position.png",
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                    shadowSize: [68, 95],
                    shadowAnchor: [22, 94]
                });
                _locationMarker = Rtmap.Scene.createMarker({ icon: icon, floor: floor, fillOpacity: 1, opacity: 1, fillColor: "#0091FF", color: "#fff", weight: 2, size: 10, x: x, y: y });
                //
                Rtmap.Control.enableLocal();
            }
        }
        else {
            var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
            _locationMarker.setLatLng(latlng);
            //若楼层不一致，则移除定位点
            if (Rtmap.Scene.getNowFloor().toUpperCase() != floor.toUpperCase()) {
                Rtmap.Scene.removeLayer(_locationMarker, true);
            }
        }
        //跟随模式
        if (locationModel == "follow" || _bIsFirstLocation) {
            Rtmap.Scene.moveTo(_localer);
            if (Rtmap.Scene.getNowFloor().toUpperCase() != _localer.floor.toUpperCase()) {
                Rtmap.Scene.changeFloorTo(_localer.floor);
            }
        }
        _bIsFirstLocation = false;

        //判断是否执行过路径规划
        if (!_bNavigator && Rtmap.TrackFactory.getEndPoi()) {
            Rtmap.TrackFactory.setStartPoi(_localer);
            _bNavigator = true;
        }
        _updateLocationTargetLine(x, y, floor);
    }

    //清除橡皮筋线
    function _clearLocationTargetLine() {
        if (_locationTargetLine) {
            Rtmap.Scene.removeLayer(_locationTargetLine, true);
            _locationTargetLine = null;
        }
    }

    //更新定位点与目标点橡皮筋
    function _updateLocationTargetLine(x, y, floor) {
        var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
        if (_locationTargetLine) {
            Rtmap.Scene.removeLayer(_locationTargetLine, true);
            _locationTargetLine = null;
        }
        //若楼层一致
        if (Rtmap.Scene.getNowFloor().toUpperCase() == floor.toUpperCase()) {
            var endPoi = Rtmap.TrackFactory.getEndPoi();
            if (!endPoi) return;
            if (endPoi && endPoi.floor.toUpperCase() == Rtmap.Scene.getNowFloor().toUpperCase()) {//若存在目标点，且在同一楼层，则绘制橡皮筋,定位点与目标点橡皮筋
                try {
                    var endLatlng = L.CRS.EPSG3395.projection.unproject(new L.Point(endPoi.x_coord, endPoi.y_coord));//endPoi.Marker.getLatLng();
                    var latlngs = [];
                    latlngs.push(latlng);
                    latlngs.push(endLatlng);
                    _locationTargetLine = L.polyline(latlngs, { color: 'red', opacity: 1, weight: 2 });
                    Rtmap.Scene.addLayer(_locationTargetLine);
                }
                catch (e) {
                    //alert(e);
                }
            }
        }
    }

    //确认定位是否可用
    function _validLocationIsOK() {
        if (_lastLocationTime) {
            var nowTime = new Date().getTime();
            var tick = (nowTime - _lastLocationTime) / 1000;
            $("#show .step").html("时间间隔:" + tick);
            //距上次定位成功时间超过10秒
            if (tick > 10) {
                Page.Controller.DialogLabel.show("定位失败,网络可能不可用!", 2000);
                _isValidLocation = false;
            }
            else {
                //延迟验证网络是否可用
                window.setTimeout(function () {
                    _validLocationIsOK();
                }, 5000);
            }
        }
    }

    function _stopLocation() {
        if (_locationTimer) {
            window.clearInterval(_locationTimer);
        }
    }

    function _getOpenId() {
        var getSearch = location.search.substr(1);
        var strIndex = getSearch.indexOf("openid=") + 7;
        var endIndex = getSearch.indexOf("&", strIndex);
        return getSearch.substring(strIndex, endIndex);
    }

    //是否有效定位点
    function _isValidLocation(data) {
        if (_localer) {
            //容差
            var tolerance = (new Date().getTime() - _lastLocationUpdateTime) * 1.5 / 1000;
            if (_localer.floor != data.lbsinfo.floor) {
                return true;
            }
            var distance = Math.pow(((data.lbsinfo.x - _localer.x) * (data.lbsinfo.x - _localer.x) + (data.lbsinfo.y - _localer.y) * (data.lbsinfo.y - _localer.y)), 0.5);
            if (distance > tolerance) {
                return false;
            }
        }
        return true;
    }

    function _locateAlert() {
        window.locateAlertTmp = window.setTimeout(function () { Page.Controller.DialogLabel.show("定位需要蓝牙，请确认是否开启!", 3000) }, 10000);
    }

    _page.wechat = {
        getUserPosition: _getUserPosition,
        getUserPositionBase: _getUserPositionBase,
        startLocation: _startLocation,
        updateStartMarker: _updateStartMarker,
        updateLocationTargetLine: _updateLocationTargetLine,
        clearLocationTargetLine: _clearLocationTargetLine,
        stopLocation: _stopLocation,
        getLocaler: function () {
            return _localer;
        },
        getOpenId: _getOpenId,
        drawLocation: _drawLocation,
        locateAlert:_locateAlert
    }
})(Page);

/*
 *scence control button
 */
(function (_page) {
    function _makeYellowNotice(modelName) {
        var maps = {
            flying: "出发到达",
            shopping: "购物餐饮",
            parking: "停车场"
        }
        $(".yellow_notice").html("<div class='text_title'></div>");
        $(".yellow_notice .text_title").append("<div class='text_outer'>当前场景为 '" + maps[modelName] + "',请点击右侧按钮进行切换</div>");
        $(".yellow_notice .text_title").append("<div class='text_close_outer'><img class='text_close' src='./public/img/text_close.png' width='15px' height='15px'></div>");
        $(".text_close").click(function () {
                $(".yellow_notice .text_title").remove();
            }
        );
    }

    function _makeBar() {
        $(".top_right_bar_area").click(function () {
            var getDom = $(".top_right_bar_area").find("img");
            if (getDom.attr("src").indexOf("full") != -1) {
                _openMove();
            } else {
                _closeMove();
            }
            $(this).css("pointer-events", "none")
            setTimeout(function () {
                $(".top_right_bar_area").css("pointer-events", "auto");
            }, 300);
        });
        _bindSceneModel();

        function _openMove() {
            var getDom = $(".top_right_bar_area").find("img");
            getDom.attr("src", "./public/img/area_close.png");
            var selectArea = $("<div></div>");
            selectArea.addClass("selectArea");
            selectArea.css({"position": "fixed", "width": "100%", "height": "100%", "opacity": "0.5", "background-color": "black"});
            $("body").append(selectArea);
            $(".floor_change_box").css("display", "none");
            $(".rtmap_search_box").css("display", "none");
            $(".yellow_notice").css("display", "none");

            $(".tip_box").css("display", "none");
            if ($("img[src='./public/img/end.png']").length || $("img[src='./public/img/start.png']").length) {
            } else {
                $(".rtmap_scale_box").removeClass("moveUp");
            }

            $(".track_dashboard").css("display", "none");
            $(".rtmap_local").css("display", "none");
            $(".area_part").css({"width": "300", "height": "90", "display": "block"});//.animate({"width":"300","height":"90"},300);
            selectArea[0].addEventListener("touchend", function () {
                setTimeout(_closeMove, 100);
            }, false);
        }

        function _closeMove() {
            var getDom = $(".top_right_bar_area").find("img");
            getDom.attr("src", "./public/img/full_area.png");
            $(".selectArea").remove();
            $(".floor_change_box").css("display", "block");
            $(".rtmap_search_box").css("display", "block");
            $(".yellow_notice").css("display", "block");
            if ($("img[src='./public/img/end.png']").length || $("img[src='./public/img/start.png']").length) {
                $(".rtmap_scale_box").addClass("moveUp");
                $(".tip_box").css("display", "block");
            }
            $(".track_dashboard").css("display", "block");
            $(".rtmap_local").css("display", "block");
            $(".area_part").css({"width": "33", "height": "0", "display": "none"});
            /*animate({"width":"33","height":"0"},300,function (){
             $(this).css("display","none");
             });                 */
        }

        function _bindSceneModel() {
            var airDom = document.getElementsByClassName("air_area_div")[0];
            var foodDom = document.getElementsByClassName("food_area_div")[0];
            var parkDom = document.getElementsByClassName("park_area_div")[0];
            airDom.addEventListener("touchstart", function () {
                $(airDom).css("border", "1px solid #FFB603");
                _closeMove();
                Rtmap.Scene.setSceneModel(airDom.getAttribute("model_name"), function () {
                });
                _makeYellowNotice(airDom.getAttribute("model_name"));
                $(airDom).css("pointer-events", "none")
                setTimeout(function () {
                    $(".air_area_div").css("pointer-events", "auto");
                }, 300);
            }, false);
            airDom.addEventListener("touchend", function () {
                $(airDom).css("border", "1px solid white");
            }, false);
            foodDom.addEventListener("touchstart", function () {
                $(foodDom).css("border", "1px solid #FFB603");
                _closeMove();
                Rtmap.Scene.setSceneModel(foodDom.getAttribute("model_name"), function () {
                });
                _makeYellowNotice(foodDom.getAttribute("model_name"));
                $(foodDom).css("pointer-events", "none")
                setTimeout(function () {
                    $(".food_area_div").css("pointer-events", "auto");
                }, 300);
            }, false);
            foodDom.addEventListener("touchend", function () {
                $(foodDom).css("border", "1px solid white");
            }, false);
            parkDom.addEventListener("touchstart", function () {
                $(parkDom).css("border", "1px solid #FFB603");
                _closeMove();
                Rtmap.Scene.setSceneModel(parkDom.getAttribute("model_name"), function () {
                });
                _makeYellowNotice(parkDom.getAttribute("model_name"));
                $(parkDom).css("pointer-events", "none")
                setTimeout(function () {
                    $(".park_area_div").css("pointer-events", "auto");
                }, 300);
            }, false);
            parkDom.addEventListener("touchend", function () {
                $(parkDom).css("border", "1px solid white");
            }, false);
        }
    }

    _page.areaBar = {
        makeBar: _makeBar,
        makeYellowNotice: _makeYellowNotice
    }
})(window.Page);

/*
 * plugin 
 */
(function (_page) {

    function _loadScript(src, callback) {
        var sfile = document.createElement("script");
        sfile.charset = "utf-8";

        if (typeof callback == "function") {
            if (sfile.readyState) {
                sfile.onreadystatechange = function () {
                    if ("loaded" === sfile.readyState || "complete" === sfile.readyState) {
                        sfile.onreadystatechange = null;
                        typeof (callback) == "function" && callback();
                    }
                }
            } else {
                sfile.onload = function () {
                    typeof (callback) == "function" && callback();
                }
            }
        }
        sfile.src = src;
        var snode = document.getElementsByTagName("script")[0];
        snode.parentNode.insertBefore(sfile, snode)
    };

    _page.plugin = {
        loadScript: _loadScript
    }
})(Page);


(function getStep(window) {
    var CURRENT_SETP;
    var SENSITIVITY = 10; // SENSITIVITY灵敏度
    var mLastValues = [];
    var mScale = [];
    var mYOffset;
    var end = 0;
    var start = 0;
    var build_angle = 0;
    /**
     * 最后加速度方向
     */
    var mLastDirections = [];
    var mLastExtremes = [new Array(6), new Array(6)];
    var mLastDiff = [];
    var mLastMatch = -1;

    function _stepDetector() {
        var h = 480;
        mYOffset = h * 0.5;
        mScale[0] = -(h * 0.5 * (1.0 / (9.80665 * 2)));
        mScale[1] = -(h * 0.5 * (1.0 / (60.0)));
    }

    _stepDetector();

    function _countStep(data) {
        var event;
        CURRENT_SETP = 0;
        for (var num = 0; num < data.length; num++) {
            event = data[num];
            var vSum = 0;
            for (var key in event) {
                var v = mYOffset + event[key] * mScale[1];
                vSum += v;
            }
            var k = 0;
            var v = vSum / 3;

            var direction = (v > mLastValues[k] ? 1
                : (v < mLastValues[k] ? -1 : 0));
            if (direction == -mLastDirections[k]) {
                // Direction changed
                var extType = (direction > 0 ? 0 : 1); // minumum or
                // maximum?
                mLastExtremes[extType][k] = mLastValues[k];
                var diff = Math.abs(mLastExtremes[extType][k]
                    - mLastExtremes[1 - extType][k]);

                if (diff > SENSITIVITY) {
                    var isAlmostAsLargeAsPrevious = diff > (mLastDiff[k] * 2 / 3);
                    var isPreviousLargeEnough = mLastDiff[k] > (diff / 3);
                    var isNotContra = (mLastMatch != 1 - extType);

                    if (isAlmostAsLargeAsPrevious && isPreviousLargeEnough
                        && isNotContra) {
                        end = new Date().getTime();
                        if (end - start > 300) {// 此时判断为走了一步

                            CURRENT_SETP++;
                            mLastMatch = extType;
                            start = end;
                        }
                    } else {
                        mLastMatch = -1;
                    }
                }
                mLastDiff[k] = diff;
            }
            mLastDirections[k] = direction;
            mLastValues[k] = v;
        }
        return CURRENT_SETP;
    }

    function _moveStatus(data) {
        if (data.length) {
            var avg = 0; // 均值
            var tmp = 0;
            for (var f = 0; f < data.length; f++) {
                var plus = 0;
                if (data[f]) {
                    data[f].sq = 0;
                    for (var key in data[f]) {
                        var numTmp = parseFloat(data[f][key]);
                        plus += numTmp * numTmp;
                    }
                    avg += Math.sqrt(plus);
                    data[f].sq = Math.sqrt(plus);
                }
            }


            avg = avg / data.length;
            for (var g = 0; g < data.length; g++) {
                var tmp_1 = 0;
                tmp_1 = data[g].sq - avg;
                tmp += Math.pow(tmp_1, 2);
            }
            tmp = tmp / data.length;
            //$("#show .step").html(tmp);
            return tmp > 0.2 ? 1 : 0;
        } else {
            return 1;
        }
    }

    function _compassStandard(data) {

        function _getAvg(data1) {
            var sum = 0;
            var avg_befor = parseFloat(data1[0].alpha);

            for (var i = 0; i < data1.length; i++) {
                if (data1[i]) {
                    sum += (_getDegree(parseFloat(data1[i].alpha), avg_befor) + avg_befor);
                }
            }
            sum = sum / data1.length;
            if (sum < 0) {
                sum += 360;
            }
            return sum;
        }

        function _getDegree(start, end) {
            var tmp = start - end;
            if (tmp > 180) {
                tmp -= 360;
            } else if (tmp < 180) {
                tmp += 360;
            }
            return tmp;
        }

        function _getAngular(start, end) {
            var tmp = start - end;
            if (tmp < 0) {
                tmp = -tmp;
            }
            if (tmp > 180) {
                tmp -= 360;
            }
            if (tmp < 0) {
                tmp = -tmp;
            }
            return tmp;
        }

        function _getStandard(data2, avg) {
            var avr = 0;
            var tmp = 0;
            for (var i = 0; i < data2.length; i++) {
                tmp = _getAngular(data2[i].alpha, avg);
                avr += tmp * tmp;
            }
            avr = avr / data2.length;
            return Math.sqrt(avr);
        }

        if (data.length) {
            var avg = _getAvg(data);
            var standard = _getStandard(data, avg);
            return standard;
        } else {
            return 127;
        }
    }

    function _initBuildAngle(callBack) {
        var _buildId = Page.URL.getParameter("buildid");
        var _key = Page.URL.getParameter("key");
        var _buildid_list = [];
        _buildid_list.push(_buildId);
        $.ajax({
            type: "post",
            url: "http://lbsapi.rtmap.com/rtmap_lbs_api/rtmap_lbs_api/v1/rtmap/build_angle",
            dataType: "json",
            data: JSON.stringify({
                key: _key,
                buildid_list: _buildid_list
            })
        }).done(function (data) {
                if (data.build_angle_list) {
                    build_angle = data.build_angle_list[0].angle;//偏转角
                }
            });
    }

    function _getBuildAngle() {
        return parseInt(build_angle);
    }

    window.countStep = _countStep;
    window.moveStatus = _moveStatus;
    window.compassStandard = _compassStandard;
    window.initBuildAngle = _initBuildAngle;
    window.getBuildAngle = _getBuildAngle;
})(window);

(function () {
    window.hashDirection = {
        1: ["./public/img/straight.png","直行"], //直行
        2: ["./public/img/right_front.png","右前"], //右前
        3: ["./public/img/right.png","右转"], //右转
        4: ["./public/img/right_rear.png","右后"], //右后
        5: ["./public/img/left_rear.png","左后"], //左后
        6: ["./public/img/left.png","左转"],//左转
        7: ["./public/img/left_front.png","左前"], //左前
        8: ["./public/img/elevator_up.png","上直梯"], //直梯上
        9: ["./public/img/elevator_down.png","下直梯"],  //直梯下
        10: ["./public/img/stair_up.png","上扶梯"], //扶梯上
        11: ["./public/img/stair_down.png",'下扶梯']  //扶梯下
    };
})();


/**
 * track success callback
 * gaoletian
 */
(function(){
    window.__onTrackSuccess = function(point){
        window.__store = point;
        //console.log(point);
        window.Page.TrackDashboard.show(point);
        window.createDetailPage(point);
    }
})();
