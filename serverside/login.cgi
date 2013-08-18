#!/usr/bin/perl

use strict;
use CGI qw/:standard/;
use CGI::Carp 'fatalsToBrowser';
use LWP::UserAgent;
require HTTP::Headers;
use HTTP::Request::Common qw{ POST };
use JSON::Syck;
use Data::Dumper;
 
my $cgi = new CGI;

# Get the callback function name for AJAX requests 
my $callback = $cgi->param('callback');

# Get the dbname parameter passed to the script from the login field.
# Convert the @ and . to characters allowed by Cloudant.
# Only lowercase letters (a-z), digits (0-9), and any of the characters _, $, 
# (, ), +, -, and / are allowed. Moreover, the database name must begin with 
# a letter.
# 
# We convert user@email.com to user_email-com

my $dbname = quotemeta($cgi->param("dbname"));

$dbname =~ s/@/_/;
$dbname =~ s/\./-/;
$dbname =~ s/\./-/;
$dbname =~ s/\\//g;

# Cloudant server details
my $address = "<my address>";
my $port = "80";
my $username = "<my username>";
my $pass = "<my password>";

# Create a HTTP GET Request and send it to the DB.
# This will tell us if the database already exists.

my $ua = LWP::UserAgent->new;
my $get_request =  HTTP::Request->new( GET => "http://$address:$port/$dbname");
$get_request->authorization_basic( "$username", "$pass" );
my $get_response = $ua->request( $get_request );
my $create_success;

if ($get_response->code == 404)
{
  # The database does not exist, create it.
  
  my $create_db = HTTP::Request->new( PUT => "http://$address:$port/$dbname");
  $create_db->authorization_basic( "$username", "$pass" );
  my $create_response = $ua->request($create_db);

  if ($create_response->code == 201)
  {
      # Successfully created new database
      $create_success = 1;
      # Now create the empty document and save the revision identifier
      my $create =  HTTP::Request->new( PUT => "http://$address/$dbname/webplayer");
      $create->authorization_basic( "$username", "$pass" );
      $create->content_type("application/json");
      $create->content('{}');
      my $document_response = $ua->request( $create );
      if ($document_response->code == 201)
      {
      }
  }
  elsif ($create_response->code == 409)
  {
    # Error creating database
    if ($callback)
    {
      print "Status: 409 Conflict\n";
      print 'Access-Control-Allow-Origin: *';
      print 'Access-Control-Allow-Methods: GET'; 
      print "Content-type: application/javascript\n\n";
      print $callback . '({"code": "409", "message": "Conflict"})';
    }
    else
    {
      print "Status: 409 Conflict\n";
      print "Content-type: application/json\n\n";
      print '{"code": "409", "message": "Conflict"}';
    }
    return;
  }
}
elsif ($get_response->code == 400)
{
  if ($callback)
  {
    print "Status: 400 Revision or request invalid\n";
    print 'Access-Control-Allow-Origin: *';
    print 'Access-Control-Allow-Methods: GET'; 
    print "Content-type: application/javascript\n\n";
    print $callback . '({"code": "400", "message": "Revision of request invalid"})';
  }
  else
  {
    print "Status: 400 Revision or request invalid\n";
    print "Content-type: application/json\n\n";
    print '{"code": "400", "message": "Revision of request invalid"}';
  }
  return;
}
elsif($get_response->code == 200)
{
  # This database already existed so the user may already have a key.
  
  my $get_rev_req =  HTTP::Request->new( GET => "http://$address/$dbname/webplayer");
  $get_rev_req->authorization_basic( "$username", "$pass" );
  my $rev_response = $ua->request( $get_rev_req );

  my $jsondata = JSON::Syck::Load($rev_response->decoded_content);

  # Retrive an API Key for this client-database combination.
  my $api_request = HTTP::Request->new(POST => "https://$username:$pass\@cloudant.com/api/generate_api_key");
  $api_request->authorization_basic( "$username", "$pass" );
  my $key = $ua->request($api_request);
    
  # Extract the username from the API key.
  my $data = JSON::Syck::Load($key->decoded_content);
  my $api_username = $data->{key};
  my $api_password = $data->{password};
    
  # Set reader and writer permissions for this API key.
  my $perm_request = POST( "https://cloudant.com/api/set_permissions", [ 'database' => "$username/$dbname", 'username' => $api_username, 'roles' => '_reader', 'roles' => '_writer' ] );
  $perm_request->authorization_basic( "$username", "$pass" );
  my $permissions = $ua->request($perm_request);
    
  # Return the API Key username / password.
    
  if ($callback) 
  {
    print "Status: 200 Success\n";
    print 'Access-Control-Allow-Origin: *';
    print 'Access-Control-Allow-Methods: GET'; 
    print "Content-type: application/javascript\n\n";
    print $callback . '({"code": "200", "message": "success", "username":' . '"' . $api_username . '"' . ', "password":' . '"' . $api_password . '"' . ', "dbname":' . '"' . $dbname . '"})'; 
  } 
  else 
  { 
    print "Status: 200 Success\n";
    print "Content-type: application/json\n\n"; 
    print '{"code": "200", "message": "success", "username":' . '"' . $api_username . '"' . ', "password":' . '"' . $api_password . '"' . ', "dbname":' . '"' . $dbname . '"}'; 
  }
}

if ($create_success)
{
  # Retrive an API Key for this client-database combination.
  my $api_request = HTTP::Request->new(POST => "https://$username:$pass\@cloudant.com/api/generate_api_key");
  $api_request->authorization_basic( "$username", "$pass" );
  my $key = $ua->request($api_request);
    
  # Extract the username from the API key.
  my $data = JSON::Syck::Load($key->decoded_content);
  my $api_username = $data->{key};
  my $api_password = $data->{password};
    
  # Set reader and writer permissions for this API key.
  my $perm_request = POST( "https://cloudant.com/api/set_permissions", [ 'database' => "$username/$dbname", 'username' => $api_username, 'roles' => '_reader', 'roles' => '_writer' ] );
  $perm_request->authorization_basic( "$username", "$pass" );
  my $permissions = $ua->request($perm_request);
    
  # Return the API Key username / password.
    
  if ($callback) 
  { 
    print "Status: 200 Success\n";
    print 'Access-Control-Allow-Origin: *';
    print 'Access-Control-Allow-Methods: GET'; 
    print "Content-type: application/javascript\n\n";
    print $callback . '({"code": "200", "message": "success", "username":' . '"' . $api_username . '"' . ', "password":' . '"' . $api_password . '"' . ', "dbname":' . '"' . $dbname . '"})'; 
  } 
  else 
  { 
    print "Status: 200 Success\n";
    print "Content-type: application/json\n\n"; 
    print '{"code": "200", "message": "success", "username":' . '"' . $api_username . '"' . ', "password":' . '"' . $api_password . '"' . ', "dbname":' . '"' . $dbname . '"}'; 
  }

}
