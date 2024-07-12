# DLSyUm
A restaurant review web application.

# Description
DLSyUm is a comprehensive web application designed to provide users with an interactive platform to review 
and discover restaurants. Users can browse through various establishments, read detailed reviews, and contribute 
their own insights. The application ensures a user-friendly experience, allowing visitors to view top-rated 
restaurants, leave feedback, and engage with other food enthusiasts.

# Dependencies
To ensure the application runs smoothly, the following dependencies and prerequisites are required:
1. Operating System: MacOS Sonoma 14.2.1
2. Browsers: Optimized for Safari on MacOS. Other browsers and devices might not provide the full functionality.
3. MongoDB Community Server: Required for database management.
4. Node.js and NPM: Required for running the server and managing packages.
5. NVM (Node Version Manager): Recommended for managing Node.js versions.

# Installing from Terminal
1. Download MongoDB Community Server:
   - Go to the MongoDB website.
   - Navigate to Products > Community Edition > Community Server.
   - Select the appropriate package for your Mac OS version (ARM for M-chips or x64 for Intels).
   - Download the .tgz package.
2. Extract the downloaded package.
3. Move the extracted folder to the home directory.
4. Open Terminal and navigate to the home directory.
5. Navigate to the MongoDB bin directory:
   - `cd ~/mongodb/bin`
6. Add the MongoDB bin directory to the PATH environment variable:
   - Open or create the .zshrc file:
      - `touch ~/.zshrc`
      - `open ~/.zshrc`
   - Add the following line to .zshrc:
      - `export PATH=$PATH:~/mongodb/bin`
   - Source the .zshrc file:
      - `source ~/.zshrc`
7. Create the data directory for MongoDB:
   - `sudo mkdir -p /data/db`
8. Run the MongoDB server:
   - `sudo mongod --dbpath /data/db`
   or
   - `sudo mongod --dbpath=/<homefolder>/data/db`

In our case it's
   - `sudo mongod --dbpath=/Users/riialindseypangilinan/data/db`


# Executing program on Node.js from Terminal
1. Open Terminal
2. Check if .zshrc file exists:
   - `ls -al`
3. Create .zshrc file if it doesn't exist:
   - `touch ~/.zshrc`
4. Install NVM (Node Version Manager) using curl:
   - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash`
5. Source the .zshrc file to refresh the terminal:
   - `source ~/.zshrc`
6. Check the NVM version to verify installation:
   - `nvm --version`
7. List all available Node.js versions with NVM:
   - `nvm ls-remote`
8. Install a specific Node.js version using NVM:
   - `nvm install v20.11.0`
9. Verify the installed Node.js version:
   - `node --version`
10. Check the installed NPM version:
   - `npm --version`
11. Run the Server.js script:
   - `node <pathtofolder>/server.js`
    or
   - Open Visual Studio Code Terminal
      - `node server.js`

In our case it's
   - `node /Users/riialindseypangilinan/Downloads/vscode/CCAPDEV/Grp7_MCO2/server.js`


# Help
Please do watch the "mockup demo.mov" for a runthrough of DLSyUm.
This README file currently includes instructions for MacOS only. Instructions for Windows will be added soon, 
as this was made in the very last minute.


# Authors
- Acosta, Axel Toby
- Cosue, Alexis Maureen
- Pangilinan, Riia Lindsey
- Punongbayan, Richard Daniel


# Acknowledgments
- Running the MongoDB server https://www.youtube.com/watch?v=8gUQL2zlpvI
- Installing Node Version Manager https://github.com/nvm-sh/nvm
- Implementing Node.js https://www.youtube.com/watch?v=I8H4wolRFBk
