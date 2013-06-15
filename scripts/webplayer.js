// These events are run when the DOM is ready
$( document ).ready(function() {

  if (Modernizr.localstorage) {
    // This browser supports HTML5 so we can store the players
    // in the browser localstorage.
    if (localStorage.length == 0 || localStorage.getItem("webplayer.counter") == 0)
    {
      initialiseLocalStorage();
      var iframe = document.getElementById("playerframe");
      iframe.src="first.html";
    }
    readPlayers();
  }
  else
  {
    // no native support for HTML5 storage :(
    // maybe try dojox.storage or a third-party solution
    alert("HTML5 localtstorage not supported =(")
  }

  setPlayerDivDimensions();
  initialiseEventHandlers();

});

function initialiseLocalStorage()
{
  localStorage.setItem('webplayer.counter', 0);
}

function toggleTogglerAndForm()
{
  $("#playerForm").trigger("reset");
  $("#playerForm").slideToggle(200);
  $(".toggler").slideToggle(200);
}

function initialiseEventHandlers()
{

  // We use jQuery UI Dialog to show the add player form
  // and should be able to reuse most of this code for editing
  // existing players
  $( "#playerForm" ).dialog({
     autoOpen: false,
     modal: true,
     appendTo: "#player",
     width: "auto",
     dialogClass: "addPlayer",
     position: { my: "center", at: "center", of: window },
     resizable: false,
     buttons: {
       "Add player": function() {
           addNewPlayer($("#name").val(), $("#address").val()); 
           $( this ).dialog( "close" );
       },
       "Edit player": function() {
           editPlayer($("#name").val(), $("#address").val(), $("#id").val()); 
           readPlayers();
           $( this ).dialog( "close" );
       },
       Cancel: function() {
         $( this ).dialog( "close" );
       }
     },
     open: function() {
        $('.ui-widget-overlay').addClass('darker-overlay');
        var id = $(this).data("id");
        if (id == null)
        {
          $("#address").val("");
          $("#name").val("");
          $("#id").val("");
          $('.ui-button:contains(Add player)').show()
          $('.ui-button:contains(Edit player)').hide()
        }
        else
        {
          $('.ui-button:contains(Edit player)').show()
          $('.ui-button:contains(Add player)').hide()
          $("#address").val(localStorage.getItem("webplayer.players."+id+".url"));
          $("#name").val(localStorage.getItem("webplayer.players."+id+".name"));
          $("#id").val(id);
        }
     },
     close: function() {
       $('.ui-widget-overlay').removeClass('darker-overlay');
     }
   });
 
   $( "#new-player" )
     .button()
     .click(function() {
       $( "#playerForm" ).data("id",null).dialog( "open" );
     });
}

// Resize the player whenever the window is resized.
$(window).resize(function() {
  setPlayerDivDimensions();
});

function loadPlayer(sender) {
  // Load a player into the iframe
  // TODO: Fix focus so <space> can pause
  var iframe = document.getElementById("playerframe");
  var purl = sender.currentTarget.parentNode.childNodes.item(1).textContent;
  iframe.src = purl;
  if (purl.search("soundcloud.com") > 0)
  {
    // TODO: Autoplay on load
    iframe.src = "http://w.soundcloud.com/player/?url="+purl;
    soundcloudWidget = SC.Widget(iframe);
    soundcloudWidget.load(purl, {'auto_play': true});
  }
  document.title = "Webplayer - " + sender.currentTarget.parentNode.childNodes.item(0).textContent;
}

function setPlayerDivDimensions()
{
  var width = document.body.clientWidth;
  // playerList = 300px and has 2 x 10px paddings
  width = width - 320;

  $("#player").css("width", width);
  $("#playerframe").css("width", width);

  // TODO: Set div and frame height more correctly than this hack.
  $("#player").css("height", document.height);
  $("#playerFrame").css("height", document.height);
}

function resetPlaylistAttributes()
{
  $("li").hoverIntent({
    over: slideDownwards,
    interval: 1000,
    out: slideUpwards
  });

  $(".tools-delete").click(function(event) {
    deletePlayer(event);
  });

  $(".tools-edit").click(function(event) {
    $("#playerForm").data("id",event.currentTarget.parentNode.parentNode.parentNode.childNodes.item(0).childNodes.item(0).childNodes.item(2).textContent).dialog("open");
  });

  // This binds actions to the new <li> elements that make them open the players
  $(".playerlink").on("click", function(event) {
    loadPlayer(event);
  });
}

function slideDownwards()
{
  $(this).find(".tools").slideDown(200);
}

function slideUpwards()
{
  $(this).find(".tools").slideUp(200);
}

function editPlayer(name, address, id)
{
  if (id != null)
  {
    localStorage.setItem("webplayer.players."+id+".name", name);
    localStorage.setItem("webplayer.players."+id+".url", address);
  }
}

function readPlayers()
{
  // Read the saved players from the localstorage and populate the
  // playerlist with the stored metadata
  // TODO: set <a title=webplayer.players.i.added>

  var values = [];

  var counter = parseInt(localStorage["webplayer.counter"])
  for (var i = 0; i < counter; i++)
  {
    var exists = localStorage.getItem("webplayer.players."+i+".name");
    if (exists != null)
    {
      values.push({name: localStorage.getItem("webplayer.players."+i+".name"),
                   url: localStorage.getItem("webplayer.players."+i+".url"),
                   id: i});
    }
  }

  var options = {
    item: '<li><div class="playerLinkDiv"><div><a id="playerLink" href="#" class="name playlist_button playerlink ui-widget"></a><span id="url" class="url hidden"></span><span id="id" class="id hidden"></span></div><div id="tools" class="hidden tools"><a class="tools-edit ui-widget" href="#">Edit</a><a class="tools-delete ui-widget" href="#"">Delete</a></div></div></li>'
  };

  var playerList = new List('playerlist', options, values);
  resetPlaylistAttributes();
}

function addNewPlayer(name, url)
{
  // TODO: Scrape the Bandcamp <head> to extract a reference to the playlist ID
  //       so we can embedd HTML5 players instead of full pages inside the
  //       IFRAME
  // TODO: Make this modular so it can effectively cope with adding resources from
  //       different domains.
  if (Modernizr.localstorage)
  {
    if (url.length == 0)
    {
      return;
    }

    var counter = parseInt(localStorage.getItem("webplayer.counter"));
    if (name.length > 0)
    {
      localStorage.setItem("webplayer.players." + counter+".name", name);
    }
    else
    {
      localStorage.setItem("webplayer.players." + counter+".name", "No name");
    }
    localStorage.setItem("webplayer.players." + counter+".added", new Date());
    localStorage.setItem("webplayer.players." + counter+".url", url);
    localStorage.setItem("webplayer.counter", counter + 1);
  }
  readPlayers();
  return false;
}

function deletePlayer(sender)
{
  if (Modernizr.localstorage)
  {
    var key = sender.currentTarget.parentNode.parentNode.childNodes.item(0).childNodes.item(2).textContent;
    if (key != null)
    {
      localStorage.removeItem("webplayer.players."+key+".name");
      localStorage.removeItem("webplayer.players."+key+".added");
      localStorage.removeItem("webplayer.players."+key+".url");
      readPlayers();
     }
  }
}
