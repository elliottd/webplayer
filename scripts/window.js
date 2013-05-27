// These events are run when the DOM for the page is ready
$( document ).ready(function() {
 
  if (Modernizr.localstorage) {
    // This browser supports HTML5 so we can store the players
    // in the browser localstorage.
    loadPlayers();
  } 
  else 
  {
    // no native support for HTML5 storage :(
    // maybe try dojox.storage or a third-party solution
    alert("HTML5 localtstorage not supported =(")
  }
  setPlayerWidth();

  // This binds an action to the #newPlayerForm form
  $( "#newPlayerForm" ).on( "submit", function( event ) {
    event.preventDefault();
    addNewPlayer(); 
    $('#newPlayerForm').trigger("reset");
  });

});

// Resize the player whenever the window is resized.
$(window).resize(function() {
  setPlayerWidth();
});

function load(sender) {
  // Load a player into the iframe
  var iframe = document.getElementById("iframe");
  var url = sender.currentTarget.parentNode.childNodes.item(1).textContent;
  iframe.src = url;
  document.title = sender.currentTarget.parentNode.childNodes.item(0).textContent;
}

function setPlayerWidth()
{
  var player = document.getElementById("player");
  var width = document.body.clientWidth;
  // playerList = 200px and has 2 x 10px paddings
  width = width - 300 - 10 - 10;
  player.setAttribute("width", width+"px");
  player.style.display="none";
  player.style.display="block";
  var iframe = document.getElementById("iframe");
  iframe.setAttribute("width", width+"px");
}

function resetPlaylistAttributes()
{
  $("li").hover(
      function() {
        img = document.createElement("img");
        img.setAttribute("src", "images/delete.png");
        img.setAttribute("id", "delete");
        img.setAttribute("onclick", "deletePlayer(this)");
        img.setAttribute("style", "width:16px; height: 16px; position: absolute; left: 280px; margin-top: 2px;");
        // TODO: set margin-top: -20px; when the <a> textContent is overflowing
        $(this).append(img);
    },
    function() {
      $(this).find("img").remove();
    }
  );

  // This binds actions to the new <li> elements
  $("a").on("click", function(event) {
    load(event);
  });
}

function loadPlayers()
{
  // Read the saved players from the localstorage and populate the
  // playerlist with the stored metadata
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
    item: '<li><a id="playerLink" href="#" class="name playlist_button"></a><span class="url" style="display: none;" id="url"></span><span class="id" style="display: none;" id="id"></span></li>'
  };

  var playerList = new List('playerlist', options, values);
  resetPlaylistAttributes();
}

function addNewPlayer()
{
  // TODO: Scrape the Bandcamp <head> to extract a reference to the playlist ID
  //       so we can embedd HTML5 players instead of full pages inside the 
  //       IFRAME
  // TODO: Make this modular so it can effectively cope with adding resources from
  //       different domains.
  if (Modernizr.localstorage)
  {
    var counter = parseInt(localStorage["webplayer.counter"]);
    if (isNaN(counter))
    {
      counter = 0;
    }
    var form = document.getElementById("newPlayerForm");
    localStorage["webplayer.players." + counter+".name"] = form.elements["name"].value;
    localStorage["webplayer.players." + counter+".added"] = new Date();
    localStorage["webplayer.players." + counter+".url"] = form.elements["url"].value;
    localStorage["webplayer.counter"] = counter + 1;
  }
  loadPlayers();
  return false;
}

function deletePlayer(sender)
{
  if (Modernizr.localstorage)
  {
    var key = sender.parentNode.childNodes.item(2).textContent;
    localStorage.removeItem("webplayer.players."+key+".name");
    localStorage.removeItem("webplayer.players."+key+".added");
    localStorage.removeItem("webplayer.players."+key+".url");
    loadPlayers();
  }
}

function loadNewPlayer()
{
  var options = {
    valueNames: ['name', 'url', 'id']
  };

  var playerList = new List('playerlist', options);

  var justAdded = parseInt(localStorage["webplayer.counter"])-1;
  playerList.add( {name: localStorage.getItem("webplayer.players."+justAdded+".name"),
                   url: localStorage.getItem("webplayer.players."+justAdded+".url")});
  
}
