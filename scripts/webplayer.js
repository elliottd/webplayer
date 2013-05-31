// These events are run when the DOM for the page is ready
$( document ).ready(function() {
 
  if (Modernizr.localstorage) {
    // This browser supports HTML5 so we can store the players
    // in the browser localstorage.
    readPlayers();
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

function loadPlayer(sender) {
  // Load a player into the iframe
  var iframe = document.getElementById("playerframe");
  var url = sender.currentTarget.parentNode.childNodes.item(1).textContent;
  iframe.src = url;
  document.title = sender.currentTarget.parentNode.childNodes.item(0).textContent;
}

function setPlayerWidth()
{
  var width = document.body.clientWidth;
  // playerList = 300px and has 2 x 10px paddings
  // TOOD: Make this change the style.height instead of <>.height
  width = width - 300 - 10 - 10;
  $("#player").css("width", width+"px");
  $("#playerframe").css("width", width+"px");
}

function resetPlaylistAttributes()
{
  $("li").hover(
      function() {
        img = document.createElement("img");
        img.setAttribute("src", "images/delete.png");
        img.setAttribute("id", "delete");
        img.setAttribute("onclick", "deletePlayer(this)");
        img.setAttribute("class", "delete");
        $(this).append(img);
    },
    function() {
      $(this).find("img").remove();
    }
  );

  // This binds actions to the new <li> elements that make them open the players
  $("a").on("click", function(event) {
    loadPlayer(event);
  });
}

function readPlayers()
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
    item: '<li><a id="playerLink" href="#" class="name playlist_button"></a><span id="url" class="url hidden"></span><span id="id" class="id hidden"></span></li>'  
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
  readPlayers();
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
    readPlayers();
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
