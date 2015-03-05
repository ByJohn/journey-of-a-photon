$(function() {
	// < IE9
	if(!Modernizr.csstransforms) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});


/*------------------- Global variable -------------------*/

var $page = $('#page');

/*------------------- Views/Pages -------------------*/

var PageView = Backbone.View.extend({

	el: '#page',

	initialize: function() {
	},

	renderTemplate: function(templateIDString) {
		var template = _.template($('#' + this.options.pageTemplate).html());
		this.$el.html(template);
		return template;
	},

	pageReady: function() {
	}

});

var PageTitle = PageView.extend({

	options: {
		pageTemplate: 'template-title'
	},

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		this.renderTemplate();

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

var PageChapter0 = PageView.extend({

	options: {
		pageTemplate: 'template-prologue'
	},

	events: {
		'click button.plop': 'next'
	},

	render: function() {
		this.renderTemplate();
	},

	next: function() {
		router.changePage('');
	}

});


/*------------------- Routes -------------------*/


var globalRoutes = [
	//Name,  slug/link/route,  view
	['Home', /$/, new PageTitle()],
	['WhatIsAPhoton', 'what-is-a-photon', new PageChapter0()]
];


/*------------------- Routing -------------------*/


var Router = Backbone.Router.extend({

	currentPage: null,

	initialize: function() {
		for (var i = 0; i < globalRoutes.length; i++) {
			(function(that){
				var route = globalRoutes[i];

				that.route(route[1], route[0], function(args) {
					that.currentPage = route;
					route[2].render();
				});
			})(this);
		}
	},

	routes: {}, //The routes are dynamically added using the globalRoutes variable

	//Intercepts every route change call
	execute: function(callback, args) {
		var fadeSpeed = 500,
			that = this;

		$page.fadeOut(fadeSpeed, function() {
			if (callback) callback.apply(this, args); //Applies the default behaviour
			$page.fadeIn(fadeSpeed, function() {
				that.currentPage[2].pageReady(); //Calls the currently visible view
			});
		});
	},

	changePage: function(url) {
		this.navigate(url, {trigger: true});
	}

});

var router = new Router();
Backbone.history.start();