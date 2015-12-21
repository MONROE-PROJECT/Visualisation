# MONROE: Visualization Application
This application is developed for the MONROE project under the GNU (GENERAL PUBLIC LICENSE, version 3) license.
Please take a loot at the text in the LICENSE.txt file.

# HOWTO install the dependencies
sudo apt-get install git nodejs nodejs-legacy npm
sudo npm install -g bower gulp

# HOWTO build the code and run the application
npm install
bower install
gulp build
gulp connect
