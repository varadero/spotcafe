# For information on how to start the application, look at ```server/README.md```

# Development installation
## Prerequisites
* NodeJS 8.4.0+
* TypeScript 2.4.2+ - ```npm install -g typescript```
* Angular CLI 1.3.1+ - ```npm install -g @angular/cli```

# Installing packages
* Navigate to ```server``` folder and execute ```npm install```
* Navigate to ```web``` folder and execute ```npm install```
* You might need to ```npm install -g typescript``` and ```npm install -g @angular/cli``` in order to execute ```tsc``` and ```ng``` later

# Development
* Navigate to ```server``` folder and execute ```tsc --pretty --watch```
* Navigate to ```web``` folder and execute ```ng build --sourcemaps --watch```
* Open root folder (the one that contains ```server``` and ```web``` folders) in Visual Studio Code. You can use the following VS Code ```launch.json``` in the root flder:
```
{
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Create DB",
            "program": "${workspaceRoot}/server/index",
            "outFiles": [
                "${workspaceRoot}/out/**/*.js"
            ],
            "args": [
                "--create-database",
                "--administrator-password=123456"
            ]
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Normal start",
            "program": "${workspaceRoot}/server/index",
            "outFiles": [
                "${workspaceRoot}/out/**/*.js"
            ]
        }
    ]
}
```
* Press ```F5``` to start and debug the server application and open a browser to the url, specified in ```host``` and ```port``` values in  ```server/config/app.json``` (most likely ```https://localhost```). Changing any file used by the server requires stop and restart the debugger.