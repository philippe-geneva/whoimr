 
# Indicator Metadata Registry - Conceptual Prototype

version 0.1

Welcome to the WHO's Indicator Metadata Registry (IMR) conceptual prototype.
This software package is meant to facilitate the discussion about, and, to 
illustrate the required capabilities and functions for the Organization's next 
IMR so that it fits the needs of Headquarters, Regional, and Country offices, as
well as partners who use this content.

Please send questions and comments to Philippe Boucher (boucherp@who.int)

## REQUIREMENTS

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

## INSTALLATION ON UNIX

1. Retrieve the WHO IMR project from github:

   %> git clone https://github.com/philippe-geneva/whoimr.git

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

6. Connect to the IMR using your web browser, connecting to port 3000 to the 
   machine hosting the IMR installation.

## MANAGEMENT

The application can be started on the command line using:

   %> imr start

It can also be stopped using:

   %> imr stop

The downloaded node modules and the database content can be remove with:
  
   %> imr-cleanup

An you can restore the content and modules with the command:

   %> imr-setup

## INSTALLATION ON WINDOWS

Note that the installation and management of the application under windows
is currently manual, batch file (.bat) equivalents for the __imr__, 
__imr-setup__, and __imr-clean__ scripts have not yet been written.

### REQUIRED PACKAGES

1. Get and install the open source MongoDB Community Server

   >   https://www.mongodb.com/download-center#community

   Depending on the installer that you have used, you may have to 
   manually set the mongodb bin directory in your system path.
   The installer will dump files most likely in C:\Program files\MongoDB.  

   You may also have to create a mondodb data storage directory.  The
   default it expects is c:\data\db, so:

   >   C:> mkdir c:\data\db

2. Get and install node.js

   >   https://nodejs.org/en/download/

3. Get and install git:

   >   https://git-scm.com/download/win   

### INSTALLING THE INDICATOR METADATA REGISTRY

1. In a new cmd.exe window, start MongoDB server - do not close this
   window as this will terminate the database server.
   ```
   C:> mongod
   ```
2. In a new cmd.exe window, find a location/make a directory to clone
   the WHO IMR project from github, then clone the repository:
   ```
   C:> mkdir some\installation\directory
   C:> cd some\installtion\directory
   C:> git clone https://github.com/philippe-geneva/whoimr.git
   ```
3. Load the raw data for the IMR into 
   MongoDB server.  First, cd to the whoimr directory that you have
   just retrieved from github:
   ```
   c:> cd whoimr
   ```
   then issue the commands:   
   ```
   C:> mongoimport --db imr --collection indicators -file whoimr/data/indicators.json
   C:> mongoimport --db imr --collection properties -file whoimr/data/properties.json
   C:> mongoimport --db imr --collection users -file whoimr/data/users.json
   c:> mongo imr whoimr\data\patches.js
   ```
4. In the same window, cd to the directory that holds the IMR node.js 
   application and load the required node modules for it:
   ```
   c:> cd imr
   c:> npm install 
   ```   
5. In its own cmd.exe window, start the IMR node application:
   ```
   c:> node imr
   ```
6. In your web browser, go to 
   ```
   http://localhost:3000/view/indicator/CHI_1
   ```

  
   
 