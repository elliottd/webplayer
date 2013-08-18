#!/usr/bin/perl

use strict;
use CGI qw/:standard/;
use CGI::Carp 'fatalsToBrowser';
use LWP::UserAgent;
require HTTP::Headers;
use HTTP::Request::Common qw{ POST };
use Data::Dumper;
 
my $cgi = new CGI;

# Get the callback function name 
my $callback = $cgi->param('callback');

# Get the dbname parameter passed to the script from the login field.
# Convert the @ and . to characters allowed by Cloudant.
# Only lowercase letters (a-z), digits (0-9), and any of the characters _, $, 
# (, ), +, -, and / are allowed. Moreover, the database name must begin with 
# a letter.
my $dbname = $cgi->param("dbname");
my $dbusername = $cgi->param("username");
my $dbpassword = $cgi->param("password");

my $address = "<my address>";
my $port = "80";

# Create a HTTP GET Request and send it to the DB.
# This will tell us if the database already exists.

my $browser = LWP::UserAgent->new;
my $req =  HTTP::Request->new( GET => "http://$address/$dbname/webplayer");
$req->authorization_basic( "$dbusername", "$dbpassword" );
my $page = $browser->request( $req );

if ($page->code == 200)
{
  # The GET request was successful, return the database as JSON.
  
  if ($callback) 
  {
    print "Status: 200 Success\n";
    print "Access-Control-Allow-Origin: *\n";
    print "Access-Control-Allow-Methods: GET\n"; 
    print "Content-type: application/javascript\n\n";

    print $callback . '({"code":"200", "data":' . $page->decoded_content . '})';  
  }
  else
  {
    print "Status: 200 Success\n";
    print "Content-type: application/json\n\n"; 
    print '{"code":"200", ' . $page->decoded_content . '})';
  }
}
elsif ($page->code == 400)
{
  # The format of the request or revision was invalid
  if ($callback) 
  { 
    print "Status: 400 Invalid\n";
    print "Access-Control-Allow-Origin: *\n";
    print "Access-Control-Allow-Methods: GET\n"; 
    print "Content-type: application/javascript\n\n";
    print $callback . '({"code": "400", "message": "The format of the request or revision was invalid"})'; 
  }
  else
  {
    print "Status: 400 Invalid\n";
    print "Content-type: application/json\n\n"; 
    print '{"code", "400", "message": "The format of the request or revision was invalid"}'; 
  }
}
elsif ($page->code == 404)
{
  # The format of the request or revision was invalid
  if ($callback) 
  { 
    print "Status: 404 Not Found\n";
    print "Access-Control-Allow-Origin: *\n";
    print "Access-Control-Allow-Methods: GET\n"; 
    print "Content-type: application/javascript\n\n";
    print $callback . '({"code": "404", "message": "The specified document or revision cannot be found, or has been deleted"})'; 
  }
  else
  {
    print "Status: 404 Not Found\n";
    print "Content-type: application/json\n\n"; 
    print '{"code": "404", "message": "The specified document or revision cannot be found, or has been deleted"}'; 
  }
}
