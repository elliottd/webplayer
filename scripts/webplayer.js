// These events are run when the DOM is ready
$( document ).ready(function() {

  if (Modernizr.localstorage) {
    // This browser supports HTML5 so we can store the players
    // in the browser localstorage.
    login(convertDBName(localStorage.getItem("dbname")));
    updatePlayerFrame();
    readPlayers();
  }
  else
  {
    // no native support for HTML5 storage :(
    // maybe try dojox.storage or a third-party solution
    alert("HTML5 localtstorage not supported =(")
  }

  initialiseEventHandlers();
  setPlayerDivDimensions();

});

// -------------- //
// Event Handlers //
// -------------- //

function initialiseEventHandlers()
{
  initialiseLogoutButton();
  initialiseRefreshButton();
  initialiseNewPlayerForm();
  initialiseLoginField();
}

function initialiseNewPlayerForm()
{
  // We use jQuery UI Dialog to show the add player form
  // and should be able to reuse most of this code for editing
  // existing players
  $( "#playerForm" ).dialog(
  {
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
   
  $( "#new-player" ).button().click(function() {
    $( "#playerForm" ).data("id",null).dialog( "open" );
  });

  $('#name').keydown(function (e) {
    if (e.which == 13) {
      // just trigger the submit handler
          addNewPlayer($("#name").val(), $("#address").val()); 
          e.preventDefault();
          $( "#playerForm" ).dialog( "close" );
    }
  });
  $('#address').keydown(function (e) {
    if (e.which == 13) {
      // just trigger the submit handler
          addNewPlayer($("#name").val(), $("#address").val()); 
          e.preventDefault();
          $( "#playerForm" ).dialog( "close" );
    }
  });
}

function initialiseLoginField()
{
  // Set the event handler for the login field

  $( "#authenticate" ).keypress(function (e) {
    if (e.which == 13) 
    {
      var fieldName = e.target.value;
        
      if (localStorage.getItem("username") == null || 
          convertDBName(localStorage.getItem("dbname")) != fieldName)
      {
        login(fieldName);
      }
      else
      {
        retrieveRemoteDatabase();
      }
        
      return false;
    }
  }); 
}

function initialiseLogoutButton()
{
  // When a user clicks logout:
  // 1) reset the authenticate field
  // 2) reset all status messages
  // 3) hide logout button; show authenticate field
  // 4) clear LocalStorage
  
  $("#logout").button().click(function() {
    $("#authenticate").val("");
    $("#username").text("");
    toggleStatusMessage(null);
    toggleLogoutButton();
    toggleRefreshButton();
    initialiseLocalStorage();
    readPlayers();
    updatePlayerFrame();
  });
}

function initialiseRefreshButton()
{
  // When a user clicks Refresh retrieve the latest version of the database
  
  $("#refresh").button().click(function() {
    retrieveRemoteDatabase();
  });
}

function initialiseLocalStorage()
{
  localStorage.clear();
  localStorage.setItem('webplayer.counter', 0);
}

function setPlaylistEventHandlers()
{
  $("li").hoverIntent({
    over: slideDownwards,
    interval: 1000,
    out: slideUpwards
  });

  $(".tools-delete").click(function(event) {
    deletePlayer(event);
  });

  // TODO: Fix this selector. It is too easy to break.

  $(".tools-edit").click(function(event) {
    $("#playerForm").data("id",event.currentTarget.parentNode.parentNode.parentNode.childNodes.item(0).childNodes.item(0).childNodes.item(3).textContent).dialog("open");
  });

  // This binds actions to the new <li> elements that make them open the players
  $(".playerlink").on("click", function(event) {
    loadPlayer(event);
  });
}

// ------------------ //
// Local Interactions //
// ------------------ //

function loadPlayer(sender) {
  // Load a player into the iframe
  // TODO: Fix focus so <space> can pause
  var iframe = document.getElementById("playerframe");
  var purl = sender.currentTarget.parentNode.childNodes.item(2).textContent;
  if (purl.search("soundcloud.com") > 0)
  {
    // TODO: Autoplay on load
    iframe.src = "http://w.soundcloud.com/player/?url="+purl;
    soundcloudWidget = SC.Widget(iframe);
    soundcloudWidget.load(purl, {'auto_play': true});
    $("#playerframe").css("height", "100%");
    $("#playerframe").css("margin", "");
    $("#playerframe").css("width", "100%");
  }
  else if (purl.search("bandcamp.com/Embedded") > 0)
  {
    // This lets use dynamically choose the size of the embedded player, 
    // given the size of the user's browser display height.
    if (window.innerHeight > 700)
    {
      purl = purl.replace("$X", "large");
      $("#playerframe").css("height", "700");
      $("#playerframe").css("width", "550");
    }
    else
    {
      purl = purl.replace("$X", "medium");
      $("#playerframe").css("height", "400");
      $("#playerframe").css("width", "550");
    }
    $("#playerframe").css("margin", "auto");
    $("#playerframe").css("position", "absolute");
    $("#playerframe").css("top", "0");
    $("#playerframe").css("bottom", "0");
    $("#playerframe").css("left", "0");
    $("#playerframe").css("right", "0");
    iframe.src = purl;
  }
  else
  {
    $("#playerframe").css("height", "100%");
    $("#playerframe").css("width", "100%");
    $("#playerframe").css("margin", "auto");
    $("#playerframe").css("position", "absolute");
    $("#playerframe").css("top", "0");
    $("#playerframe").css("bottom", "0");
    $("#playerframe").css("left", "0");
    $("#playerframe").css("right", "0");
    iframe.src = purl;
  }
  document.title = "Webplayer - " + sender.currentTarget.parentNode.childNodes.item(1).textContent;
}


function editPlayer(name, address, id)
{
  if (id != null)
  {
    localStorage.setItem("webplayer.players."+id+".name", name);
    localStorage.setItem("webplayer.players."+id+".url", address);
    populateRemoteDatabase();
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
    item: '<li><div class="playerLinkDiv"><div><img id="icon" class="icon" width=16 height=16 src=""></img><a id="playerLink" href="#" class="name playlist_button playerlink ui-widget"></a><span id="url" class="url hidden"></span><span id="id" class="id hidden"></span></div><div id="tools" class="hidden tools"><a class="tools-edit ui-widget" href="#">Edit</a><a class="tools-delete ui-widget" href="#"">Delete</a></div></div></li>'
  };

  var playerList = new List('playerlist', options, values);
  populateIcons();
  setPlaylistEventHandlers();
}

function addNewPlayer(name, xurl)
{
  // TODO: Scrape the Bandcamp <head> to extract a reference to the playlist ID
  //       so we can embedd HTML5 players instead of full pages inside the
  //       IFRAME
  // TODO: Make this modular so it can effectively cope with adding resources from
  //       different domains.
  if (Modernizr.localstorage)
  {
    if (xurl.length == 0)
    {
      return;
    }

    if (doesURLExistInCollection(xurl))
    {
         $(function() {
             $( "#url-exists" ).dialog({
                 modal: true,
                 dialogClass: "addPlayer",    
                 position: { my: "center", at: "center", of: window },
                 resizable: false,
                 buttons: {
                     Ok: function() {
                         $( this ).dialog( "close" );
                     }
                 }
             });
         });
         return;
    }

    if (xurl.search("bandcamp.com") > 0)
    {
      var albumid = "";
      $.ajax(
        {
          async: false, 
          timeout: 1000, 
          dataType: "jsonp", 
          url: "http://api.bandcamp.com/api/url/1/info?key=vatnajokull&url="+xurl, 
          success: function(d) 
          { 
            console.log(d); 
            albumid = d.album_id; 

            if (albumid != null)
            {
              // Controversial use of the Bandcamp API to retrieve a Bandcamp-specific player
              yurl = "http://bandcamp.com/EmbeddedPlayer/album="+albumid+"/size=$X/bgcol=ffffff/linkcol=0687f5/notracklist=false/transparent=true/";
              if (doesURLExistInCollection(yurl))
              {
                   $(function() {
                       $( "#url-exists" ).dialog({
                           modal: true,
                           dialogClass: "addPlayer",    
                           position: { my: "center", at: "center", of: window },
                           resizable: false,
                           buttons: {
                               Ok: function() {
                                   $( this ).dialog( "close" );
                               }
                           }
                       });
                   });
                   return;
              }
              if (
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
              localStorage.setItem("webplayer.players." + counter+".url", yurl);
              localStorage.setItem("webplayer.counter", counter + 1);
              populateRemoteDatabase();
              readPlayers();
            }
          }
        }
      ); 
    }
    else
    {
  
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
      localStorage.setItem("webplayer.players." + counter+".url", xurl);
      localStorage.setItem("webplayer.counter", counter + 1);
      populateRemoteDatabase();
      readPlayers();
    }
  }
  return false;
}

function deletePlayer(sender)
{
  if (Modernizr.localstorage)
  {
    var key = sender.currentTarget.parentNode.parentNode.childNodes.item(0).childNodes.item(3).textContent;
    if (key != null)
    {
      localStorage.removeItem("webplayer.players."+key+".name");
      localStorage.removeItem("webplayer.players."+key+".added");
      localStorage.removeItem("webplayer.players."+key+".url");
      populateRemoteDatabase();
      readPlayers();
     }
  }
}

// --------------------------- //
// Remote database interaction //
// --------------------------- //

function login(uname)
{
  // Retrieve authentication credentials for the user with
  // a given username.

  if (uname == null)
  {
    return;
  }

  // Update the user interface
  toggleStatusMessage("#loggingin","" ,uname);
  toggleLogoutButton();
  toggleRefreshButton();

  if (localStorage.getItem("username") == null ||
      convertDBName(localStorage.getItem("dbname")) != uname)
  {
    // Retrieve authentication details if there are none, or
    // a different username is provided than the one we have credentials for.

    clearCredentials();

    // Send a POST request to the login server with the username. 
    // If this operation is successful, save the authentication 
    // credentials to LocalStorage and retrieve the remote database.

    $.ajax({
      type: "GET",
      dataType: "jsonp",
      url: "http://homepages.inf.ed.ac.uk/cgi/s0128959/login.cgi",
      data: { 'dbname' : uname },
    }).done(function(returnedData) {
      var code = returnedData['code'];
      if (code == '200') 
      {
          console.log("200: Login success");
          console.log(returnedData);
          localStorage.setItem("username", returnedData["username"]);
          localStorage.setItem("password", returnedData["password"]);
          localStorage.setItem("dbname", returnedData["dbname"]);
          // We have credentials for this user so synchronise databases
          retrieveRemoteDatabase();
      }
      else if(code == '400')
      {
          console.log("400: Revision or request invalid");
          toggleLogoutButton();
          toggleRefreshButton();
          toggleStatusMessage("#failure", returnedData['message']);
          console.log(returnedData);      
      }
      else if (code == '409')
      {
          console.log("409: Conflict");
          toggleLogoutButton();
          toggleRefreshButton();
          toggleStatusMessage("#failure", returnedData['message']);
          console.log(returnedData);      
      }
      else if (code == '500')
      {
          console.log("500: Server-side failure");
          toggleLogoutButton();
          toggleRefreshButton();
          toggleStatusMessage("#failure", "Server-side failure");
          console.log(returnedData);
      }
    });
  }
  else
  {
    // We have credentials for this user so synchronise databases
    retrieveRemoteDatabase();
  }
}

function retrieveRemoteDatabase()
{
  // Tell the user the databases are synchronising
  toggleStatusMessage("#synchronising")

  // Retrieve database from the server with a POST request
  $.ajax( 
  {
    type: "GET",
    dataType: "jsonp",
    url: "http://homepages.inf.ed.ac.uk/cgi/s0128959/retrieveDB.cgi",
    crossDomain: "true",
    data: { 'dbname': localStorage.getItem('dbname'), 
            'username': localStorage.getItem('username'), 
            'password': localStorage.getItem('password')}
  }).done(function(returnedData) {
    var code = returnedData['code'];
    if (code == '200')
    {
        console.log("200: Retrieve success");
        var data = returnedData['data'];
        // Make this not rely on a count
        if (remoteDatabaseIsEmpty(data))
        {
          // This was an empty database so populate the cloud from localhost.
          localStorage.setItem("rev", data['_rev']);
          populateRemoteDatabase();
        }
        else
        {
          populateLocalDatabase(data)
        }
        toggleStatusMessage("#loggedin");
    }
    else if (code == '400')
    {
        console.log("400: Revision or request invalid");
        toggleLogoutButton();
        toggleRefreshButton();
        toggleStatusMessage("#failure", returnedData['message']);
        console.log(returnedData);     
    }
    else if (code == '409')
    {
        console.log("409: Conflict");
        toggleLogoutButton();
        toggleRefreshButton();
        toggleStatusMessage("#failure", returnedData['message']);
        console.log(returnedData);      
    }
    else if (code == '500')
    {
        console.log("500: Server-side failure");
        toggleLogoutButton();
        toggleRefreshButton();
        toggleStatusMessage("#failure", "Server-side failure");
        console.log(returnedData);
    }
  });
}

function populateRemoteDatabase()
{
  if (localStorage.getItem("username") == null || localStorage.length < 5)
  {
    // Nothing to send to the remote database server
    return;
  }

  toggleStatusMessage("#synchronising");
  var stringified = localStorageWithoutCredentials();

  // POST request to store the current version of LocalStorage in the
  // remote database
  $.ajax(
  {
    type: "POST",
    url: "http://homepages.inf.ed.ac.uk/cgi/s0128959/postDB.cgi",
    dataType: "json",
    data: { "data": stringified , 
            "dbname": localStorage.getItem("dbname"), 
            "username": localStorage.getItem("username"), 
            "password": localStorage.getItem("password"), 
            "rev": localStorage.getItem("rev"),
            "callback": "callback"}
  }).complete(function(jqXHR, returnedData) {
      var returnedData = jqXHR.responseText;
      returnedData = returnedData.replace("callback(", "");
      returnedData = returnedData.replace(")", "");
      returnedData = JSON.parse(returnedData);
      var code = returnedData['code'];
      if (code == '201')
      {
        console.log("201: Post success");
        // Update the revision id so we can correctly retrieve and store in the future
        localStorage.setItem("rev", returnedData['new_revision']);
    
        // Tell the user synchronisation is complete.
        toggleStatusMessage("#loggedin");
      }
      else if (code == '400')
      {
        console.log("400: Revision or request invalid");
        toggleLogoutButton();
        toggleRefreshButton();
        toggleStatusMessage("#failure", returnedData['message']);
        console.log(returnedData);      
      }
      else if (code == '409')
      {
        console.log("409: Conflict");
        // Incorrect revision ID was supplied, which means the databases are out of sync.
        retrieveRemoteDatabase();
      }
      else if (code == '500')
      {
        console.log("500: Server-side failure");
        toggleLogoutButton();
        toggleRefreshButton();
        toggleStatusMessage("#failure", "Server-side failure");
        console.log(returnedData);
      }
  });
}


function populateLocalDatabase(retrievedData)
{

  if (retrievedData['_rev'] == localStorage.getItem("rev"))
  {
    // The databases are already synchronised
    return;
  }

  // Do collision detection so we know what to merge
  var oldLS = copyOfDatabase(localStorage);
  var remoteLS = copyOfDatabase(retrievedData);
  var collisions = detectCollisions(oldLS, remoteLS);

  var u = localStorage.getItem("username");
  var p = localStorage.getItem("password");
  var d = localStorage.getItem("dbname");
  initialiseLocalStorage();
  localStorage.setItem("rev", retrievedData['_rev']);
  localStorage.setItem("username", u);
  localStorage.setItem("password", p);
  localStorage.setItem("dbname", d);
  
  // We don't want to store these items in the LocalStorage
  delete retrievedData['_rev'];
  delete retrievedData['_id'];
  delete retrievedData['code'];

  // Empty the current LocalStorage and add key-value pair in the retrievedData 
  // to the HTML5 Localstorage.

  $.each(retrievedData, function(k,v) { 
    localStorage.setItem(k, v);
  });

  $.each(collisions, function(k,v) {
    var counter = parseInt(localStorage.getItem("webplayer.counter"));
    localStorage.setItem("webplayer.players." + counter+".name", v["webplayer.players." + k + ".name"]);
    localStorage.setItem("webplayer.players." + counter+".added", v["webplayer.players." + k + ".added"]);
    localStorage.setItem("webplayer.players." + counter+".url", v["webplayer.players." + k + ".url"]);
    localStorage.setItem("webplayer.counter", counter + 1);
  });

  // Update the user interface
  updatePlayerFrame();
  readPlayers();

  // http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  if (Object.size(collisions) > 0)
  {
    populateRemoteDatabase();
  }
}

// ------------------- //
// Auxiliary functions //
// ------------------- //

function doesURLExistInCollection(url)
{
  var counter = parseInt(localStorage["webplayer.counter"])
  for (var i = 0; i < counter; i++)
  {
    if (localStorage.getItem("webplayer.players."+i+".url") == url)
    {
        return true;
    }
  }
  return false;
}


function remoteDatabaseIsEmpty(database)
{
  if (Object.keys(database).length < 3)
  {
      return true;
  }
  return false;
}

function convertDBName(name)
{
  // Cloudant doesn't allow certain characters so we need to convert them.
  // @ -> _
  // . -> -

  if (name == null)
  {
    return;
  }

  var d = name;
  d = d.replace(/-/g, ".");
  d = d.replace("_", "@");
  return d;
}

function clearCredentials()
{
  localStorage.removeItem("username");
  localStorage.removeItem("dbname");
  localStorage.removeItem("password");
  localStorage.removeItem("rev");
}

function copyOfDatabase(db)
{
  var current = $.extend(true, {}, db);

  var i;

  var oldObjects = {};

  for (i in current)
  {
    var splitI = i.split(".");
    if (splitI.length == 4)
    {
      var n = splitI[2];
      if (oldObjects[n] == null)
      {
        oldObjects[n] = {};
      }
      oldObjects[n][i] = current[i];
    }
  }

  return oldObjects;
}

function detectCollisions(local, remote)
{
  var n;
  var collisions = {};
  for (n in remote)
  {
    // Iterate over all entries in the master version of this database
    if (local[n] != null)
    {
      // This is a duplicate entry. Let's check if there is a collision
      if (remote[n]["webplayer.players." + n + ".url"] != local[n]["webplayer.players." + n + ".url"])
      {
        // Check whether the entries were made on different dates
        if (remote[n]["webplayer.players." + n + ".added"] != local[n]["webplayer.players." + n + ".added"])
        {
          // This was a new entry made when the local LocalStorage was out of sync.
          collisions[n] = local[n];
        }
      }
    }
  }
  return collisions;
}

function localStorageWithoutCredentials()
{
  // We don't want to send this information to the cloud!

  var u = localStorage.getItem("username");
  var d = localStorage.getItem("dbname");
  var p = localStorage.getItem("password");
  var r = localStorage.getItem("rev");

  localStorage.removeItem("username");
  localStorage.removeItem("dbname");
  localStorage.removeItem("password");
  localStorage.removeItem("rev");

  var s = JSON.stringify(localStorage);

  localStorage.setItem("username", u);
  localStorage.setItem("dbname", d);
  localStorage.setItem("password", p);
  localStorage.setItem("rev", r);

  s = encodeURIComponent(s);
  return s;
}

function determineIcon(url)
{
  if (url.search("bandcamp.com") > 0)
  {
    return "http://s0.bcbits.com/img/bc_favicon.ico";
  }
  else if (url.search("soundcloud.com") > 0)
  {
    return "http://soundcloud.com/favicon.ico";
  }
  else if (url.search("rdio.com") > 0)
  {
    return "http://www.rdio.com/media/favicon_rdio_2012_11_15.ico";
  }
  else if (url.search("spotify.com") > 0)
  {
    return "https://www.spotify.com/uk/favicon.ico";
  }
  else if (url.search("grooveshark.com") > 0)
  {
    return "http://grooveshark.com/favicon.ico";
  }
  else
  {
    return "";
  }
}


// ---------- //
// UI changes //
// ---------- //

function setPlayerDivDimensions()
{
  var width = window.innerWidth;
  // playerList = 300px and has 2 x 10px paddings
  width = width - 320;

  $("#player").css("width", width);
  $("#playerframe").css("width", width);

  // TODO: Set div and frame height more correctly than this hack.
  $("#player").css("height", window.innerHeight);
  $("#playerframe").css("height", window.innerHeight);
  // 130 for controller 170 for authentication
  $("#sidebar").css("height", window.innerHeight - 130 - 170);
}

function slideDownwards()
{
  $(this).find(".tools").slideDown(200);
}

function slideUpwards()
{
  $(this).find(".tools").slideUp(200);
}

function updatePlayerFrame()
{
    if (localStorage.length == 0)
    {
      initialiseLocalStorage();
      var iframe = document.getElementById("playerframe");
      iframe.src="first.html";
    }
    else
    {
      var iframe = document.getElementById("playerframe");
      iframe.src=""; 
    }
}

function toggleRefreshButton()
{
  if ($("#refresh").css("display") == "inline-block")
  {
    $("#refresh").css("display", "none");
  }
  else
  {
    $("#refresh").css("display", "inline-block");
  }
}

function toggleLogoutButton()
{
  if ($("#logout").css("display") == "inline-block")
  {
    $("#logout").css("display", "none");
    $("#authenticate").css("display", "inline-block");
  }
  else
  {
    $("#logout").css("display", "inline-block");
    $("#authenticate").css("display", "none");
  }
}

function toggleStatusMessage(toEnable, optionalValue, uname)
{
  // Automatically sets all status messages to display: none;
  // and sets toEnable to display: block;

  $("#loggingin").css("display", "none");
  $("#synchronising").css("display", "none");
  $("#loggedin").css("display", "none");
  $("#failure").css("display", "none");
  $("#username").css("display", "none");

  if (toEnable != null)
  {
    $(toEnable).css("display", "block");
    $("#username").css("display", "block");
    $("#username").text(uname);
    if (optionalValue != null)
    {
      $(toEnable).text(optionalValue);
    }
  }
}

// Resize the player whenever the window is resized.
$(window).resize(function() {
  //if ($("#playerframe").src != null && $("#playerframe").src.search("bandcamp.com/Embedded/") <= 0)
  //{
    setPlayerDivDimensions();
  //}
});

function populateIcons()
{
  // Can't seem to set attributes in list.js
  var icons = $(".icon");
  $.each(icons, function(i,e)
  {
    var p = e.parentNode;
    var url = p.childNodes[2].innerHTML;
    var iconurl = determineIcon(url);
    e.src = iconurl;
  });
}

