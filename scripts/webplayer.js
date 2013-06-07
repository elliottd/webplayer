// These events are run when the DOM is ready
$( document ).ready(function() {

  if (Modernizr.localstorage) {
    // This browser supports HTML5 so we can store the players
    // in the browser localstorage.
    if (localStorage.length == 0)
    {
      initialiseLocalStorage();
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

function initialiseEventHandlers()
{
  // This binds the localstorage submit action to #newPlayerForm
  $("#newPlayerForm").on("submit", function( event ) {
    event.preventDefault();
    addNewPlayer();
    $('#newPlayerForm').trigger("reset");
  });

  $(".toggler").click(function(event) {
    var that = $(this);
    $("#" + that.attr("data-toggle")).slideToggle(200);
  })
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
    soundcloudWidget.load(purl, {'autoplay': true});
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
  $("li").hover(
      // TODO: Redesign this so it's a fadein/out div underneath the title
      function() {
        del = document.createElement("img");
        del.setAttribute("src", "images/delete.png");
        del.setAttribute("id", "delete");
        del.setAttribute("onclick", "deletePlayer(this)");
        del.setAttribute("class", "delete");
        $(this).append(del);
        edit = document.createElement("img");
        edit.setAttribute("src", "images/edit.png");
        edit.setAttribute("id", "edit");
        edit.setAttribute("class", "edit");
        edit.setAttribute("onclick", "editPlayer(this)");
        $(this).append(edit);
    },
    function() {
      $(this).find("img").remove();
    }
  );

  // This binds actions to the new <li> elements that make them open the players
  $(".playerlink").on("click", function(event) {
    loadPlayer(event);
  });
}

function editPlayer(sender)
{

  // TODO: Javascript prompts are ugly. Make this beautiful. fancybox?

  var parentNode = sender.parentNode;
  var name = prompt("Enter a name", parentNode.childNodes.item(0).textContent);
  var key = parentNode.childNodes.item(2).textContent;
  if (key != null && name != null)
  {
    localStorage.setItem("webplayer.players."+key+".name", name);
    readPlayers();
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
    item: '<li><a id="playerLink" contenteditable=false href="#" class="name playlist_button playerlink"></a><span id="url" class="url hidden"></span><span id="id" class="id hidden"></span></li>'
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
    var form = document.getElementById("newPlayerForm");

    if (url.length == 0)
    {
      return;
    }

    var counter = parseInt(localStorage.getItem("webplayer.counter"));
    if (form.elements["name"].value.length > 0)
    {
      localStorage.setItem("webplayer.players." + counter+".name", form.elements["name"].value);
    }
    else
    {
      localStorage.setItem("webplayer.players." + counter+".name", "No name");
    }
    localStorage.setItem("webplayer.players." + counter+".added", new Date());
    localStorage.setItem("webplayer.players." + counter+".url", form.elements["url"].value);
    localStorage.setItem("webplayer.counter", counter + 1);
  }
  readPlayers();
  return false;
}

function deletePlayer(sender)
{
  if (Modernizr.localstorage)
  {
    var key = sender.parentNode.childNodes.item(2).textContent;
    if (key != null)
    {
      localStorage.removeItem("webplayer.players."+key+".name");
      localStorage.removeItem("webplayer.players."+key+".added");
      localStorage.removeItem("webplayer.players."+key+".url");
      readPlayers();
     }
  }
}
