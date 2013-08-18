#!/usr/bin/perl

use strict;
use warnings;
use CGI qw/:standard/;
use LWP::UserAgent;
require HTTP::Headers;
use HTTP::Request::Common qw{ POST };
use JSON::Syck;
use Data::Dumper;
use Encode;
use JSON::Syck qw(Dump);
use URI::Escape;
use CGI::Carp qw(fatalsToBrowser);

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
my $rev = $cgi->param("rev");
my $rawdata = uri_unescape($cgi->param("data"));

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
  # The database exists, post the new version of the database.

  if ($callback)
  {
    my $create =  HTTP::Request->new( PUT => "http://$address/$dbname/webplayer?rev=$rev" );
    $create->authorization_basic( "$dbusername", "$dbpassword" );
    $create->content_type("application/json");
    $create->header("If-Match", $rev);
    $create->add_content(Dump JSON::Syck::Load($rawdata));
    my $create_response = $browser->request( $create );
    if ($create_response->code == 201)
    {
      my $jsonresp = JSON::Syck::Load($create_response->decoded_content);
      my $rev_id = $jsonresp->{rev};
      if ($callback)
      {
        print "Status: 201 Success\n";
        print 'Access-Control-Allow-Origin: *';
        print 'Access-Control-Allow-Methods: GET';
        print "Content-type: application/javascript\n\n";
        print $callback . '({"code": "201", "new_revision":' . '"' . $rev_id . '"' . '})';
      }
      else
      {
        print "Status: 201 Success\n";
        print "Content-type: application/json\n\n";
        print '{"code": "201", "new_revision":' . '"' . $rev_id . '"' . '}';
      }
    }
    elsif ($create_response->code == 400)
    {
      if ($callback)
      {
        print "Status: 400 Revision or request invalid\n";
        print 'Access-Control-Allow-Origin: *';
        print 'Access-Control-Allow-Methods: POST';
        print "Content-type: application/javascript\n\n";
        print $callback . '({"code": "400", "message": "Revision or request invalid"})';
        print $create_response->decoded_content;
      }
      else
      {
        print "Status: 400 Revision or request invalid\n";
        print "Content-type: application/json\n\n";
        print '({"code": "400", "message": "Revision or request invalid"})';
      }
    }
    elsif ($create_response->code == 409)
    {
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
    }
  }
}
