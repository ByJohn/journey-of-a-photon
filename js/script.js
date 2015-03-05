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

	renderTemplate: function(templateIDString) {
		var template = _.template($('#' + templateIDString).html());
		this.$el.html(template);
	}

});

var PageTitle = PageView.extend({

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		this.renderTemplate('template-title');

		var titleText = $('.main-title').html();

		$('.main-title').html('<div class="shadow">' + titleText + '</div><div class="top-text">' + titleText + '</div>');

		$('.main-title .shadow .words').html(function (i, html) {
			var chars = $.trim(html).split("");
			return '<span class="real-shadow-text">' + chars.join('</span><span class="real-shadow-text">') + '</span>';
		});

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

	events: {
		'click button.plop': 'next'
	},

	render: function() {
		this.renderTemplate('template-prologue');
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

	initialize: function() {
		for (var i = 0; i < globalRoutes.length; i++) {
			(function(that){
				var route = globalRoutes[i];

				that.route(route[1], route[0], function() {
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
			$page.fadeIn(fadeSpeed);
		});
	},

	changePage: function(url) {
		this.navigate(url, {trigger: true});
	}

});

var router = new Router();
Backbone.history.start();