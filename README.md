# jQuery.overlizle (2.0.0)

This plugin allows you to create fully customizable overlays


## Demo

You can find some demos here : http://olivierbossel.github.io/overlizle/


## Install

You can download or close the repo, or just use bower like this

```text
bower install jquery.overlizle
```


## Get Started

First, you need to include the scripts and css in your page

```html
<script src="jquery.js"></script>
<script src="jquery.overlizle.js"></script>
```

Then, you have multiple options to use overlizle :


### Use as a normal jQuery plugin

This is of course a jQuery plugin, so you can use it as it

```javascript
jQuery(function($) {

	// init overlizle on all data-overlizle elements
	var $overlays = $('[data-overlizle]').overlizle();

	// you can pass options directly at instanciation like this
	var $overlays = $('[data-overlizle]').overlizle({
		onOpen : function(api) {
			// do something here...
		}
		// etc...
	});

  // open through jquery reference
  $overlays.filter(':first').overlizle('open');

});
```


Then theirs different method to trigger an overlay and to load content

#### Ajax content

Load the content through ajax

```html
<a href="myCoolPage.html" data-overlizle>
	Open a cool overlay that will load the content through ajax
</a>

<span data-overlizle="myCoolPage.html">
	myCoolPage.html will be loaded and opened in overlay when somebody click on me
</span>
```

#### DOM element

Using an ID reference to a DOM element in the page

```html
<a href="#myCoolDomElement" data-overlizle>
	Open a cool overlay that will take the element #myCoolDomElement as content
</a>

<span data-overlizle="#myCoolDomElement">
	#myCoolDomElement will be loaded and opened in overlay when somebody click on me
</span>
```

> The dom content will be moved in the overlay and putted back to position when overlay is closing. A class (settings.classes.domContent) is applied on it when opened so you can make sure your content is not hided anymore at this point...

#### Iframe

Load the content in an iframe directly in the overlay

```html
<a href="iframe:http://olivierbossel.com" data-overlizle>
	Open olivierbossel.com in the overlay directly in an iframe
</a>

<a href="http://olivierbossel.com" data-overlizle data-overlizle-iframe>
	Same as link above, but with data-overlizle-iframe attribute
</a>

<span data-overlizle="iframe:http://olivierbossel.com">
	Open olivierbossel.com in the overlay directly in an iframe when somebody click on me
</span>
```

#### Automatically open overlay at page load

You can specify that your overlay has to open itself at page load by using the __data-overlizle-autopen__ attribute

```html
<div data-overlizle data-overlizle-autoopen>
	I will be the content of the overlay
	<button data-overlizle-close>
		I will close the overlay when somebody click on me
	</button>
</div>
```


### Use as an object"

You can also use overlizle as a "Class" directly in your javascript code. The dependence to jQuery remain of course...

```javascript
// instanciate overlizle :
var myOverlay = new Overlizle({
	onOpen : function(api) {
		// do something on open
	}
	// etc...
});

// open an ajax loaded overlay :
myOverlay.open('myCoolPage.html');

// open an DOM reference overlay :
myOverlay.open('#myCoolDomElement');

// open an iframe content loaded overlay :
myOverlay.open('iframe:http://olivierbossel.com');
```


## Structure

This is the generated html structure :

- wrapper 				: This is the wrapper of the overlay
    - shadow 				: This is the div that will cover all the screen
    - body 					: This is the div that will hold your actual content

 > You can access all of these elements with the __{api}.$refs.{name} public variables__. For example : {api}.$refs.body


## Options

Here's the list of all the available options :

```javascript
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
```

> All the options can be set directly on the DOM element using the pattern : __data-overlizle-{option-separated-with-dash}="{value}"__
> ```html
> <a href="..." data-overlizle data-overlizle-modal="true" data-overlizle-classes-loading="myLoadingClass">
>   Open overlay
> </a>
> ```


## Attributes

Some simple attributes are available. Here's the list :

* __data-overlizle-autoopen__     : make the overlay open at pageload
* __data-overlizle-type__         : specify the type of overlay to open
* __data-overlizle-close__        : usable in an overlay scope to make an element close the overlay on click



## Events

Overlizle trigger some events that you can catch to make what you want at certain point of the code execution

* __overlizle.open__         		: when the overlay is open
* __overlizle.close__         		: when the overlay is closing
* __overlizle.domContentOpen__ 	: triggered on the dom content itself when opening
* __overlizle.domContentClose__ 	: triggered on the dom content itself when closing


## Global settings

Overlizle offer a possibility to setting up your overlay by type one time, then each time you trigger an overlay of a certain type, it will take these settings.

To do that, you can use the __Overlizle.setup__ "static" method like so :

```javascript
// somewhere in your js :
Overlizle.setup({
  onOpen : function(api) {
    // do something when an "error" overlay is opened
  }
  // etc...
}, 'error');
```

> if no type is specified as second parameter, the setup method will specify the default settings

Then, trigger the overlays as so :

```html
<a href="myErrorPage.html" data-overlizle data-overlizle-type="error">
  Open my cool error message
</a>
```

Or with the "Class" method :
```javascript
var myOverlay = new Overlizle();
myOverlay.open('myCoolErrorPage.html', 'error');
```


## API

Overlizle expose a very simple api. When used on an element, you can get it by doing __$(element).data('overlizle_api')__

### open(content, type)

This method is used to open an overlay

* __content__     : This represent what will be the content of the overlay (myPage.html, #myDomElement, iframe:http://...)
* __type__        : This is the type of the overlay. Use in conjonction with the setup method

```javascript
// through jquery reference :
$myElement.overlizle('open','myPage.html','error');

// through object :
myOverlay.open('myPage.html','error');
```

### openIframe(url, type)

This is the same as the open method but to open an iframe directly

```javascript
// through jquery reference :
$myElement.overlizle('openIframe','myPage.html','error');

// through object :
myOverlay.openIframe('myPage.html','error');
```

### close()

Close an opened overlay

```javascript
// through jquery reference :
$myElement.overlizle('close');

// through object :
myOverlay.close();
```

### isOpened()

Return true if opened, false if not

```javascript
// usable only on object
if(myOverlay.isOpened()) {
  // do something
}
```

### setWidth(width)

Set the width of the overlay. This will set as inline style in the DOM

```javascript
myOverlay.setWidth(500);
```

### getWidth()

Get the overlay width

```javascript
width = myOverlay.getWidth();
```

### setHeight(height)

Set the height of the overlay. This will set as inline style in the DOM

```javascript
myOverlay.setHeight(500);
```

### getHeight()

Get the overlay height

```javascript
height = myOverlay.getHeight();
```

## onClose callback

The close caallback available in the settings has a to be used with caution. You need to call the callback passed in the callback params (I know it's quite weird when it's in a phrase but you will understand with a sample)

```
$('...').overlizle({
  onClose : function(api, callback) {
    // do something when the overlay has to close
    
    // call the callback to destroy the overlay
    callback();
  }
});