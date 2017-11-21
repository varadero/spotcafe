Before build:
* close all programs that are using "spotcafe/dist" folder

First install distribution files:
* make sure all versions are set correctly (in web and server package.json and in windows service and desktop app AssemblyInfos.cs)
* build windows service and desktop app in release mode
* make SpotCafe.Desktop.zip from SpotCafe.Desktop.exe and SpotCafe.Desktop.pdb in SpotCafe.Desktop/bin/Release folder
* make SpotCafe.Service.zip from SpotCafe.Service.exe and SpotCafe.Service.pdb in Service/bin/Release folder
* cd spotcafe
* npm run build
* zip content of the folder "spotcafe/dist" excluding the file "SpotCafe.Service.zip" in file spotcafe-server-clean-install.zip
* create "new-folder" (choose better name) on the server an extract content of spotcafe-server-clean-install.zip into it
* cd "new-folder/server"
* node index


Update from previous installation
* cd spotcafe
* npm run build-update
* zip content of the folder "spotcafe/dist" in file spotcafe-server-update.zip
* stop Spotcafe server
* extract spotcafe-server-update.zip into Spotcafe server folder overwriting all the files