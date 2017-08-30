# Prerequisites
* MS SQL Server 2012+
* NodeJS 8.4.0+

# Installation
* Unzip application .ZIP file in a dedicated folder 
* Navigate to ```config``` folder and open ```database.json``` file. In ```"databaseProviders"``` section the ```"defaultProvider"``` is set to ```MSSQL Database Provider```. Find its item in ```"providers"``` section by matching the ```"name"``` to ```"defaultProvider"``` and change parameters in its ```"config"``` section. Values for ```"userName"``` and ```"password"``` must match user name and password for MS SQL Server user, which has righs to create new database and database tables. Change ```"server"``` to match the IP address or host name to the machine where MS SQL Server is installed. In ```"database"``` value of ```"options"``` section set the desired name for the database for the application.
* First time start-up needs to create application database (specified in ```database.json``` - ```"options": { "database": "..." }```) and also the application ```administrator``` user which can then add new users, change application settings etc. Open a command prompt, navigate to the folder of the application (where .ZIP file was unzipped) and start the application in "Create database" mode by typing (change the value of ```--administrator-password``` parameter from ```123456``` to the desired password for the administrator user):
```bash
node index --create-database --administrator-password=123456
```
Sample output:
```
2017-08-29T16:10:31.105Z: Creating database provider
2017-08-29T16:10:31.229Z: Creating database
2017-08-29T16:10:31.569Z: Database was created
```

# Usage
Open command prompt, navigate to application folder and type:
```bash
node index
```
Sample output:
```
2017-08-29T16:16:12.018Z: Creating database provider
2017-08-29T16:16:12.221Z: Database prepared
2017-08-29T16:16:12.221Z: Server: localhost
2017-08-29T16:16:12.221Z: Database: SpotCafe-Dev
2017-08-29T16:16:12.221Z: Database user name: admin
2017-08-29T16:16:12.221Z: Update script files processed: 
2017-08-29T16:16:12.221Z: Starting HTTP server
2017-08-29T16:16:12.252Z: Listening at {"address":"0.0.0.0","family":"IPv4","port":443}
2017-08-29T16:16:12.252Z: App started
```
A service could be used to start the application automatically on operating system startup.