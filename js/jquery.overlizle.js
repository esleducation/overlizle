/**
 * Overlizle
 *
 * This plugin allow to easely create fully customizlable overlays
 *
 * @created	08.04.2012
 * @updated	13.05.2015
 * @version	1.2.20
 * @author	Olivier Bossel <olivier.bossel@gmail.com>
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	/**
	 * Shared variables :
	 */
	OverlizleCount = 0;
	OverlizleDefaultSettings = {
		classes : {
			body : {

				// the class applied on the container when it's an iframe opened
				iframe : 'overlizle-iframe', 

				// the class applied on the body when a loading happens							
				loading : 'overlizle-loading', 	

				// the class applied on the body when overlays are opened						
				opened : 'overlizle-opened' 							
			},

			wrapper : {

				// the class applied on the container when it's an iframe opened
				iframe : 'overlizle--iframe',
			},

			// the class applied to the overlay
			overlay : null,	

			// the loading class added when ajax request is made									
			loading : 'loading', 	

			// the class applied on the wrapper on close
			close : 'close',

			// the class applied on the dom content when injected in the overlay
			domContent : 'overlizle-dom-content',

			// the class applied on the iframe when it's an iframe overlay
			iframe : 'overlizle-iframe'						
		},

		// preprocessors for differents elements
		preprocessors : {										
			
			// function to process the content before injecting into the overlay (param : content)
			content : null
		},
		
		// content (can be a function a string or a jquery dom element)
		content : null,

		// type by default
		type : 'default',

		// Disallow click on overlay to close									
		modal : false,

		// iframe attributes applied on the opened iframe
		iframeAttrs : {},

		// open callback
		onOpen : null,		

		// callback when content is loading									
		onContentLoadStart : null, 	

		// callback when content is loaded								
		onContentLoadComplete: null,	

		// callback when the content loading has faild								
		onContentLoadError : null,	

		// close callback								
		onClose : null											
	};
	OverlizleTypesSettings = {};

	/**
	 * Plugin :
	 */
	Overlizle = function(itemOrOptions, options) {
		
		// vars :
		this.settings = $.extend({}, OverlizleDefaultSettings, true);
		this.$refs = {
			iframe : null, 									// the iframe jquery reference if exist
			_body : $('body'),
			wrapper : null,									// the overall wrapper
			shadow : null,									// the shadow div
			body_wrapper : null,							// the body wrapper
			body_wrapper_inner : null,						// the body wrapper inner that is verticaly aligned
			body : null										// the body itself
		};	
		this._clickEvent = 'click'; 									// use click. for touch devices, add fastclick if needed
		this._clickEvent += '.overlizle';
		this._isOpened = false; 									// track if overlay is opened or not
		this._restoreBefore = null; 									// save the first neighbour of the content before injecting in overlay to be able to restore it's position (if content is a DOM element)
		this._restoreIn = null; 										// save the parent of the content before injecting in overlay to be able to restore it's position (if content is a DOM element)
		this._domContent = null; 									// save the dom content reference

		this.$this = (itemOrOptions instanceof jQuery) ? itemOrOptions : $('<div/>');			// save the jQuery item to access it
		options = (! (itemOrOptions instanceof jQuery)) ? itemOrOptions : options;
		options = (! options) ? {} : options;

		// extend settings :
		this._extendSettings(options);

		// set events triggerer
		this.$eventsTriggerer = this.$this;
		if ( ! (itemOrOptions instanceof jQuery)) this.$eventsTriggerer = this.$refs._body;

		// init :
		this._init(this.$this,options);
		
	}

	/**
	 * Register types settings
	 */
	Overlizle.setup = function(settings, type) {
		type = type || 'default';
		OverlizleTypesSettings[type] = settings;
	};

	/**
	 * Init : init the plugin
	 *
	 * @param	jQuery	item	The jQuery item
	 * @param	object	options	The options
	 */
	Overlizle.prototype._init = function(item, options) {
		
		// vars :
		var _this = this,
			$this = item;

		// update options :)
		_this.settings = $.extend(_this.settings, options, true);

		// add listeners :
		_this._addListeners();

	};

	/**
	 * Add listeners :
	 */
	Overlizle.prototype._addListeners = function() {

		// vars :
		var _this = this,
			$this = _this.$this,
			url = $this.attr('href') || $this.data('overlizle');

		// add click handler :
		$this.on(_this._clickEvent, function(e) {

			// open :
			_this.open(url);

			// prevent default :
			e.preventDefault();

		});

		// listen for escape key :
		$(document).bind('keydown.overlizle', function(e) {
			if (e.keyCode == 27 && ! _this.settings.modal) _this.close();
		});

		// check if overlay has to be opened directly :
		if (typeof $this.data('overlizle-autoopen') != 'undefined') {
			// trigger click on element to open directly the overlay :
			$this.trigger(_this._clickEvent);
		}

	};

	/**
	 * Open an iframe
	 *
	 * @param 	String 	url 		The url to open in an iframe
	 * @param 	String 	type 		The overlizle type
	 */
	Overlizle.prototype.openIframe = function(url, type) {
		// open an iframe
		return this.open('iframe:'+url, type);
	};

	/**
	 * Open
	 *
	 * @param 	String 	content 	The content to load in overlay (url | id | jquery ref)
	 */
	Overlizle.prototype.open = function(content, type) {

		// vars :
		var _this = this,
			$this = _this.$this;

		// if no content as param but content in settings :
		if ( ! content && _this.settings.content)
		{
			// check if content is a function :
			if (typeof _this.settings.content == 'function')
			{
				content = _this.settings.content(_this);
			} else {
				content = _this.settings.content;
			}
		} else if ( ! content) {
			console.warn('content is needed to open an overlay...');
			return;
		}

		// update is opened state :
		_this._isOpened = true;

		// if is an iframe :
		var isIframeUrl = content.toString().substr(0,7) == 'iframe:',
			iframeUrl = (isIframeUrl) ? content.toString().substr(7) : content;
		if (content 
		   && typeof content == 'string'
		   && (
			isIframeUrl
			|| $this.data('overlizle-iframe') != null
		)) {
			// add loading class :
			$this.addClass(_this.settings.classes.loading);
			_this.$refs._body.addClass(_this.settings.classes.body.loading);
			if (_this.settings.onContentLoadStart) _this.settings.onContentLoadStart(_this);

			// init iframe :
			var $iframe = $('<iframe>');
			attrs = $.extend({}, {
				'webkitallowfullscreen' : true,
				'mozallowfullscreen' : true,
				'allowTransparency' : true,
				'frameborder' : false,
				'src' : iframeUrl,
				'class' : _this.settings.classes.iframe
			}, _this.settings.iframeAttrs);
			$iframe.attr(attrs);

			// wait for iframe to be loaded
			$iframe.load(function() {
				$this.removeClass(_this.settings.classes.loading);
				_this.$refs._body.removeClass(_this.settings.classes.body.loading);
				if (_this.settings.onContentLoadComplete) _this.settings.onContentLoadComplete(_this);
			});

			// save the reference to the iframe
			_this.$refs.iframe = $iframe;

			// open the actual overlay
			_this._open($iframe, type, _this.settings.classes.wrapper.iframe);

			// add the iframe class on body
			_this.$refs._body.addClass(_this.settings.classes.body.iframe);

			// keep chaining capabilities
			return this;
		}

		// check if is an anchpr content type :
		if (content
		   && typeof content == 'string'
		   && content.toString().substr(0,1) == '#')
		{
			// try to get the element in the page :
			$ref = $(content + ':first');
			// check if element exist :
			if ($ref.length == 1)
			{
				// open overlay :
				_this._open($ref, type);
			}
			return this;
		}

		// if is a string, mean that is an url :
		if (typeof content == 'string')
		{
			// add loading class :
			$this.addClass(_this.settings.classes.loading);
			_this.$refs._body.addClass(_this.settings.classes.body.loading);
			if (_this.settings.onContentLoadStart) _this.settings.onContentLoadStart(_this);
			// try to make ajax request :
			$.ajax({
				url : content,
				type : $this.data('overlizle-request-type'),
				success : function(response) {
					// open overlay with content :
					_this._open(response, type);
					// remove loading class :
					$this.removeClass(_this.settings.classes.loading);
					_this.$refs._body.removeClass(_this.settings.classes.body.loading);
					if (_this.settings.onContentLoadComplete) _this.settings.onContentLoadComplete(_this);
				},
				error : function(response) {
					_this._open(response, type);
					// remove loading class :
					$this.removeClass(_this.settings.classes.loading);
					_this.$refs._body.removeClass(_this.settings.classes.body.loading);
					if (_this.settings.onContenLoadError) _this.settings.onContentLoadError(_this);
				}
			});
			return this;
		}
		
		// if content :
		if (content)
		{
			_this._open(content, type);
			return this;
		}
		
		// nothing so content is element content :
		_this._open($this, type);

		// maintain chainability :
		return this;

	};

	/**
	 * Open
	 *
	 * @param 	HTML 	content 	The content of the overlay
	 * @param 	String 	type 		The overlay type (specify whitch settings to use)
	 */
	Overlizle.prototype._open = function(content, type, _additionalClass) {

		// vars :
		var _this = this,
			$this = _this.$this
			random_id = 'overlizle-' + Math.round(Math.random()*99999),
			additionalClass = _additionalClass || '',
			type = type || _this.settings.type || 'default';

		// preprocess content if needed :
		if (_this.settings.preprocessors.content) {
			content = _this.settings.preprocessors.content(content, _this);
		}

		// update shared count :
		OverlizleCount++;

		// add the body class :
		_this.$refs._body.addClass(_this.settings.classes.body.opened);

		// extend option with default settings :
		if (OverlizleTypesSettings[type]) $.extend(_this.settings, OverlizleTypesSettings[type], true);

		// overlay class :
		var overlay_class = _this.settings.classes.overlay || type || 'default';

		// create the container :
		_this.$refs._body.append('<div class="overlizle overlizle--' + overlay_class + ' ' + additionalClass + '" id="'+random_id+'" />');
		_this.$refs.wrapper = _this.$refs._body.find('.overlizle#'+random_id);

		// create the shadow :
		_this.$refs.wrapper.append('<div class="overlizle-shadow" />');
		_this.$refs.shadow = _this.$refs.wrapper.find('.overlizle-shadow');

		// create the content container :
		_this.$refs.wrapper.append('<div class="overlizle-body-wrapper" />');
		_this.$refs.body_wrapper = _this.$refs.wrapper.find('.overlizle-body-wrapper');

		// create the content container :
		_this.$refs.body_wrapper.append('<div class="overlizle-body-wrapper-inner" />');
		_this.$refs.body_wrapper_inner = _this.$refs.wrapper.find('.overlizle-body-wrapper-inner');

		// create the body :
		_this.$refs.body_wrapper_inner.append('<div class="overlizle-body" />');
		_this.$refs.body = _this.$refs.body_wrapper.find('.overlizle-body');

		// add click listener on shadow :
		if( ! _this.settings.modal || _this.settings.modal == 'false') {
			_this.$refs.body_wrapper_inner.bind(_this._clickEvent, function(e) {
				// close only if click on wrapper, not on body itself :
				if ($(e.target).hasClass('overlizle-body-wrapper-inner')) _this.close();
			});
		}

		// apply basic css :
		_this._applyBasicCss();

		// set the content :
		if (typeof content == 'object'
			&& content instanceof jQuery
			&& ! content.hasClass(_this.settings.classes.iframe)) {
			
			// try to find the best referer to be able to put back the content where he was :
			var $next = content.next();
			if ($next.length) _this._restoreBefore = $next;
			else _this._restoreIn = content.parent();

			// append the content in overlay :
			_this.$refs.body.append(content);

			// save the content reference :
			_this._domContent = content;

			// trigger event on domContent :
			_this._domContent.trigger('overlizle.domContentOpen', [_this]);

			// apply the dom content class :
			_this._domContent.addClass(_this.settings.classes.domContent);
		}
		else
			_this.$refs.body.html(content);

		// find close element in overlay :
		_this.$refs.wrapper.on(_this._clickEvent, '[data-overlizle-close]', function(e) {
			// close :
			_this.close();

			// prevent default :
			e.preventDefault();
		});

		// callback :
		if (_this.settings.onOpen) _this.settings.onOpen(_this);
		_this.$eventsTriggerer.trigger('overlizle.open', [_this]);

	};

	/**
	 * Check if is opened
	 */
	Overlizle.prototype.isOpened = function() {
		return this._isOpened;
	};

	/**
	 * Get the iframe when an iframe is specified as content
	 */
	Overlizle.prototype.getIframe = function() {
		return this.$refs.iframe;
	}

	/**
	 * Close the overlay :
	 */
	Overlizle.prototype.close = function() {

		// vars :
		var _this = this,
			$this = _this.$this;

		// do nothing is not opened :
		if ( ! _this.isOpened()) return;

		// add close class
		_this.$refs.wrapper.addClass(_this.settings.classes.close);

		// close callback :
		function close_callback() {

			// update shared count :
			OverlizleCount--;

			// check if need to remove the body class :
			if (OverlizleCount <= 0) _this.$refs._body.removeClass(_this.settings.classes.body.opened);

			// put back content where it was if needed :
			if (_this._restoreBefore)  _this._restoreBefore.before(_this._domContent);
			else if (_this._restoreIn) _this._restoreIn.append(_this._domContent);

			// process domContent
			if (_this._domContent) 
			{
				// trigger event on domContent :
				_this._domContent.trigger('overlizle.domContentClose', [_this]);

				// remove the dom content class :
				_this._domContent.removeClass(_this.settings.classes.domContent);
			}

			// remove events :
			_this.$refs.body.on(_this._clickEvent);

			// remove the iframe classs from body :
			_this.$refs._body.removeClass(_this.settings.classes.body.iframe);

			// delete all iframes sources :
			_this.$refs.wrapper && _this.$refs.wrapper.find('iframe').removeAttr('src');

			// remove the html :
			_this.$refs.wrapper && _this.$refs.wrapper.remove();

			// trigger close :
			_this.$eventsTriggerer.trigger('overlizle.close', [_this]);

			// empty the references :
			_this.$refs.wrapper = null;
			_this.$refs.shadow = null;
			_this.$refs.body_wrapper = null;
			_this.$refs.body_wrapper_inner = null;
			_this.$refs.body = null;

			// update is opened state :
			_this._isOpened = false;
		}

		// check if an onClose callback exist :
		if (_this.settings.onClose) _this.settings.onClose(_this,close_callback);
		else {
			// call directly the close callback :
			close_callback();
		}

		// maintain chainability :
		return this;

	}

	/**
	 * Destroy the overlay :
	 */
	Overlizle.prototype._destroy = function() {

		// vars :
		var _this = this,
			$this = _this.$this;

		// remove the html :
		_this.$refs.wrapper.remove();

		// empty the references :
		_this.$refs.wrapper = null;
		_this.$refs.shadow = null;
		_this.$refs.body_wrapper = null;
		_this.$refs.body_wrapper_inner = null;
		_this.$refs.body = null;

		// unbind all the listeners :
		$this.off(_this._clickEvent);

	}

	/**
	 * Set height
	 *
	 * @param 	int 	height 		The new height fo the iframe
	 * @return 	object 				The plugin api
	 */
	Overlizle.prototype.setHeight = function(height) {

		// apply the height to the overlay body
		this.$refs.body.height(height);

		// maintain chainability
		return this;

	};

	/**
	 * Get the height of the overlay
	 *
	 * @return 		int 			The height of the overlay
	 */
	Overlizle.prototype.getHeight = function() {

		// return the height
		return this.$refs.body.height();

	};

	/**
	 * Set width
	 *
	 * @param 	int 	width 		The new width fo the iframe
	 * @return 	object 				The plugin api
	 */
	Overlizle.prototype.setWidth = function(width) {

		// apply the width to the overlay body
		this.$refs.body.width(width);

		// maintain chainability
		return this;

	};

	/**
	 * Get the width of the overlay
	 *
	 * @return 		int 			The width of the overlay
	 */
	Overlizle.prototype.getWidth = function() {

		// return the height
		return this.$refs.body.width();

	};


	/**
	 * Apply basic css :
	 */
	Overlizle.prototype._applyBasicCss = function() {

		// vars :
		var _this = this,
			$this = _this.$this;

		// wrapper css :
		_this.$refs.wrapper.css({
			display : 'block',
			position : 'fixed',
			top : 0, left: 0,
			width : '100%', height : '100%',
			overflow : 'auto'
		});
		// shadow css :
		_this.$refs.shadow.css({
			position : 'fixed',
			top : 0, left : 0,
			width : '100%', height : '100%'
		});
		// body wrapper :
		_this.$refs.body_wrapper.css({
			position : 'relative',
			display : 'table',
			'table-layout' : 'fixed',
			width : '100%',
			height : '100%'
		});
		_this.$refs.body_wrapper_inner.css({
			display : 'table-cell',
			'text-align' : 'center',
			'vertical-align' : 'middle',
			width : '100%',
			height : '100%'
		});
		// body css :
		_this.$refs.body.css({
			display : 'block',
			'text-align' : 'left',
			'max-height' : '100%',
			'margin' : '0 auto'
		});

		// if in FB tab :
		if (typeof FB != 'undefined' && typeof FB.Canvas != 'undefined' && window != window.top)
		{
			_this.$refs.body.css({
				position : 'absolute',
				top : '50%', left : '50%',
				'margin-top' : -_this.$refs.body.outerHeight()*.5,
				'margin-left' : -_this.$refs.body.outerWidth()*.5
			});

			// get canvas infos from facebook :
			FB.Canvas.getPageInfo(function(pageInfo){
				if (pageInfo && pageInfo.scrollTop != null)
				{
					// calculate top :
					var t = pageInfo.scrollTop + pageInfo.clientHeight / 2 - pageInfo.offsetTop;
					// apply the new top value to the body :
					_this.$refs.body.css({
						top : t
					});
				}				
			});
		}
	};

	/**
	 * Extend settings :
	 */
	Overlizle.prototype._extendSettings = function(options) {

		// vars :
		var _this = this,
			$this = _this.$this;

		// extend with options :
		_this.settings = $.extend(_this.settings, options, true);

		// flatten an object with parent.child.child pattern :
		var flattenObject = function(ob) {
			var toReturn = {};
			for (var i in ob) {
				
				if (!ob.hasOwnProperty(i)) continue;
				if ((typeof ob[i]) == 'object' && ob[i] != null) {
					var flatObject = flattenObject(ob[i]);
					for (var x in flatObject) {
						if (!flatObject.hasOwnProperty(x)) continue;
						toReturn[i + '.' + x] = flatObject[x];
					}
				} else {
					toReturn[i] = ob[i];	
				}
			}
			return toReturn;
		};

		// flatten the settings
		var flatSettings = flattenObject(_this.settings);

		// loop on each settings to get value on the DOM element
		for (var name in flatSettings)
		{
			// split the setting name :
			var inline_setting = 'overlizle-' + name.replace('.','-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
				inline_attr = $this.data(inline_setting);

			// check if element has inline setting :
			if (typeof inline_attr !== 'undefined') {
				// set the setting :
				if (typeof inline_attr == 'number' || typeof inline_attr == 'boolean')
					eval('_this.settings.'+name+' = '+inline_attr);
				else 
					eval('_this.settings.'+name+' = "'+inline_attr+'"');
			}
		}

	};
	 
	/**
	 * jQuery bb_counter controller :
	 */
	$.fn.overlizle = function(method) {

		// check what to do :
		if (Overlizle.prototype[method]) {

			// store args to use later :
			var args = Array.prototype.slice.call(arguments, 1);

			// apply on each elements :
			this.each(function() {
				// get the plugin :
				var plugin = $(this).data('overlizle_api');
				// call the method on api :
				plugin[method].apply(plugin, args);
			});
		} else if (typeof method == 'object' || ! method) {

			// store args to use later :
			var args = Array.prototype.slice.call(arguments);

			// apply on each :
			this.each(function() {
				$this = $(this);

				// stop if already inited :
				if ($this.data('overlizle_api') != null && $this.data('overlizle_api') != '') return;

				// make a new instance :
				var api = new Overlizle($this, args[0]);

				// save api in element :
				$this.data('overlizle_api', api);
			});
		} else {
			// error :
			$.error( 'Method ' +  method + ' does not exist on jQuery.slidizle' );
		}

		// return this :
		return this;
	}

	// return plugin :
	return Overlizle;

}));