World Health Organization 
 
Indicator Metadata Registry - Conceptual Prototype

version 0.1

Welcome to the WHO's Indicator Metadata Registry (IMR) conceptual prototype.
This software package is meant to facilitate the discussion about, and, to 
illustrate the required capabilities and functions for the Organization's next 
IMR so that it fits the needs of Headquarters, Regional, and Country offices, as
well as partners who use this content.

Please send questions and comments to Philippe Boucher (boucherp@who.int)

REQUIREMENTS

In order to use the build and management scripts, you must install the IMR on
a Unix machine.  In addition, you must have the following software packages 
installed and available on your command line path:

1. MongoDB
   https://www.mongodb.com/download-center#community
   Minimum version: 3.2

2. Node.js
   https://nodejs.org
   Minimum version: 4.4.4

3. git
   https://git-scm.com
   Minimum version: 1.7

INSTALLATION

1. Retrieve the WHO IMR project from github:

   For the remainder of these instructions, the full path that holds the project
   will be refered to as __WHOIMR_PATH__.

2. Edit the project configuration file, imr.conf in the project root directory.
   You must set the logDir and dataDir parameters for the setup and management
   scripts to work correctly.

   %> vim __WHOIMR_PATH__/imr.conf

3. Add the WHO IMR project bin directory to your path

   %> export PATH="${PATH}:__WHOIMR_PATH__/bin"

4. Run the setup script - this will retrieve the required node modules for the
   application and will seed the database.

   %> imr-setup

5. Start the WHO IMR application.

   %> imr start

MANAGEMENT

The application can be started on the command line using:

   %> imr start

It can also be stopped using:

   %> imr stop

The downloaded node modules and the database content can be remove with:
  
   %> imr-cleanup

An you can restore the content and modules with the command:

   %> imr-setup
