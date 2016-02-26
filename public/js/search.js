var Search = {
	templates: {},
	initialize: function()
	{
		
	},
	showLogin: function()
	{
		$("#content").html(Search.templates.loginTemplate());
	},
	showMain: function()
	{
		$("#content").html("");
	},
	
	showGames: function()
	{
		$.get("/api/game/list",
			{},
			function(res)
			{
				if (res.Result == "Success")
				{
					$("#content").html(Search.templates.gamelistTemplate(res));
				}
				else
				{
					// waaat
				}
			},
			"json"
		);
	},
	
	setUserInfo: function(user)
	{
		$("*[data-field=username]").text(user.name);
	},
	
	api: {
		login: function()
		{
			$.post("/api/login",
				{
					email: $("#login-form input[name=email]").val(),
					password: $("#login-form input[name=password]").val()
				},
				function(res)
				{
					if (res.Result == "Success")
					{
						Search.setUserInfo(res.User);
						Search.showMain();
					}
					else
					{
						$("#login-form .error").text(res.Message).slideDown();
						setTimeout(function() { $("#login-form .error").slideUp(); }, 5000);
					}
				},
				"json"
			);
		},
		register: function()
		{
			$.post("/api/register",
				{
					name: $("#register-form input[name=name]").val(),
					email: $("#register-form input[name=email]").val(),
					password: $("#register-form input[name=password]").val()
				},
				function(res)
				{
					if (res.Result == "Success")
					{
						Search.setUserInfo(res.User);
						Search.showMain();
					}
					else
					{
						$("#register-form .error").text(res.Message).slideDown();
						setTimeout(function() { $("#register-form .error").slideUp(); }, 5000);
					}
				},
				"json"
			);
		},
		
		createGame: function(title)
		{
			$.post("/api/game/create",
				{ title: title },
				function(res)
				{
					if (res.Result == "Success")
					{
						Search.showGames();
					}
					else
					{
						// TODO error
					}
				},
				"json"
			);
		}
	}
};


$(function()
{
	
	$("script[type*=handlebars]").each(function(idx,tpl)
	{
		Search.templates[tpl.id] = Handlebars.compile($(tpl).html());
		$(tpl).remove(); // free up memory, simplify DOM
	});


	$.get("/api/status",
		{},
		function(res)
		{
			if (res.User)
			{
				Search.setUserInfo(res.User);
			}
			else
			{
				Search.showLogin();
			}
		},
		"json"
	);

	Search.initialize();
});