$(function() {
	// < IE9
	if(!Modernizr.csstransforms) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});



/*------------------- Views/Pages -------------------*/


var TitleScreen = Backbone.View.extend({

	el: '#page',

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		var template = _.template($('#template-title').html());
		this.$el.html(template);

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
		console.log('begin');
		router.navigate('photon', {trigger: true});
	}

});

var Photon = Backbone.View.extend({

	el: '#page',

	events: {
		'click button.plop': 'next'
	},

	render: function() {
		var template = '<button class="plop">What is a Photon?</button>';
		this.$el.html(template);
	},

	next: function() {
		console.log('next');
		router.navigate('', {trigger: true});
	}

});


/*------------------- Routes -------------------*/


var globalRoutes = [
	//Name, slug/link/route, view
	['Home', /$/, new TitleScreen()],
	['WhatIsPhoton', 'photon', new Photon()]
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

	routes: {} //The routes are dynamically added using the globalRoutes variable

});

var router = new Router();
Backbone.history.start();