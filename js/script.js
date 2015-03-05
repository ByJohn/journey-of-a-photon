$(function() {
	// < IE9
	if(!Modernizr.csstransforms) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});


/*------------------- Global variable -------------------*/


var $page = $('#page'),
	fadeSpeed = 500;


/*------------------- View/Page Class Definitions -------------------*/


var PageView = Backbone.View.extend({

	el: '#page',

	initialize: function() {
	},

	unload: function() {
	},

	superRender: function() {
		this.renderPageTemplate(); //Render page template

		this.render(); //Call child function for page-specific rendering
	},

	renderPageTemplate: function(templateIDString) {
		var template = _.template($('#' + this.options.pageTemplate).html());
		this.$el.html(template);
		return template;
	},

	pageReady: function() {
	},

	//Overwrites default method to prevent removal of the #page element
	remove: function() {
		this.unload();
		// this.$el.remove();
		this.stopListening();
		this.undelegateEvents(); //Added this to remove all view events
		return this;
	}

});


var ChapterPageView = PageView.extend({

	initialize: function() {
		PageView.prototype.initialize.call(this);
		var that = this;

		this.events['click button.play'] = function() {
			// $('.chapter-title').velocity('fadeOut', { duration: fadeSpeed, complete: function() {
				$('.chapter-title').fadeOut(fadeSpeed, function() {
					that.videoPlay();
				});
			// }});
		};
	},

	superRender: function() {
		PageView.prototype.superRender.call(this); //Call the super/parent method

		//After render() is called

		this.$video = $('.main-video');
		this.video = this.$video[0];
	},

	pageReady: function() {
		PageView.prototype.pageReady.call(this);
		this.resizeVideo();
	},

	resizeVideo: function() {
		var $videoContainer = $('.video-container'),
			videoHeight = $videoContainer.outerHeight(),
			videoWidth = $videoContainer.outerWidth(),
			windowHeight = $(window).height();
		if(videoHeight > windowHeight) {
			var ratio = videoHeight / windowHeight;
			$videoContainer.css({width: videoWidth / ratio });
		}
	},

	videoPlay: function() {
		console.log('play');
		this.video.play();
		$('.page').toggleClass('playing', true);
	},

	videoPause: function() {
		this.video.pause();
		$('.page').toggleClass('playing', false);
	},

});


/*------------------- View/Page Instances -------------------*/


var PageTitle = PageView.extend({

	options: {
		pageTemplate: 'template-title'
	},

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		this.addTextShadow();
	},

	pageReady: function() {
		this.applyShadow();
	},

	addTextShadow: function() {
		var titleText = $('.main-title').html();

		$('.main-title').html('<div class="shadow">' + titleText + '</div><div class="top-text">' + titleText + '</div>');

		$('.main-title .shadow .words').html(function (i, html) {
			var chars = $.trim(html).split("");
			return '<span class="real-shadow-text">' + chars.join('</span><span class="real-shadow-text">') + '</span>';
		});

		this.applyShadow();
	},

	applyShadow: function() {
		$.fn.realshadow.reset();

		$('.page-title .real-shadow-text').realshadow({
			type: 'text',
			style: 'flat',
			// length: 40,
			color: '5,5,5',
			// color: '0,0,0'
		});
	},

	begin: function() {
		router.changePage('what-is-a-photon');
	}

});


var PageChapter0 = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-prologue'
	},

	events: {
	},

	render: function() {
	}

});


/*------------------- Routes -------------------*/

/*
The routes to the different pages. When the webpage is loaded, the correct route is selected using the URL
and the route object creates a new instance of the specific page object (and saves a globally-accessible reference).
This page object instance's superRender method is then called, which prints its template on the page.
*/

var globalRoutes = [
	//Name,  slug/link/route,  view
	['Home', /$/, PageTitle],
	['WhatIsAPhoton', 'what-is-a-photon', PageChapter0]
];


/*------------------- Routing -------------------*/


var Router = Backbone.Router.extend({

	currentPage: null,

	initialize: function() {
		for (var i = 0; i < globalRoutes.length; i++) {
			(function(that){
				var route = globalRoutes[i];

				that.route(route[1], route[0], function(args) {
					var newPage = new route[2](); //Creates a new instance of a specific page object. Its initialize method is called
					that.currentPage = newPage; //Saves a reference to the new page object
					newPage.superRender(); //Calls the page objects render method
				});
			})(this);
		}
	},

	routes: {}, //The routes are dynamically added using the globalRoutes variable

	//Intercepts every route change call
	execute: function(callback, args) {
		var that = this;

		$page.fadeOut(fadeSpeed, function() {
		// $page.velocity('fadeOut', { duration: fadeSpeed, complete: function() {

			if(that.currentPage) {
				that.currentPage.remove();
			}

			$page.html(''); //Clears all page content

			if (callback) callback.apply(that, args); //Applies the default behaviour

			$page.fadeIn(fadeSpeed, function() {
			// $page.velocity('fadeIn', { duration: fadeSpeed, complete: function() {
				if(that.currentPage) that.currentPage.pageReady(); //Calls the currently visible view once it has faded in
			});
		});
	},

	//Shortcut method
	changePage: function(url) {
		this.navigate(url, {trigger: true});
	}

});

var router = new Router();
Backbone.history.start();