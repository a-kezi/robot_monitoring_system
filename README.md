# Robot Monitoring System #
Robot monitoring system for Wonik Robotics guide robot "Addy". 

## Installation ##

* Windows 10

* node.js v12.9.1

    ```
    https://nodejs.org/download/release/v12.19.1/
    ```

* node.js modules

    ```
    // try below commands in Windows PowerShell
    npm install -g windows-build-tools
    npm install
    ```

* redis

    ```
    // download the latest msi file from below url and run to install redis
    https://github.com/microsoftarchive/redis/releases/tag/win-3.2.100
    ```

* NATS v2.1.4

    ```
    // install chocolatey
    open Windows PowerShell as administrator
    // enter a below command
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    // install nats by choco
    choco install nats-server
    ```

* NATS websocket relay

    ```
    // unzip file "ws-tcp-relay-win.zip" in the nats_ws_tcp_relay directory
    ```

* mysql

## Mysql DB setting ##

    // mysql installer > server 옆에 reconfigure > Auth 설정가서 legacy 선택  필수
    $ sudo mysql -u root -p
    $ CREATE USER 'wonik'@'localhost' IDENTIFIED BY '0070';
    $ CREATE DATABASE RobotMonitoringSystem;
    $ GRANT ALL PRIVILEGES ON RobotMonitoringSystem.* TO 'wonik'@'localhost';


## Nodes needed to run #

- **main.js :** robot monitoring system web server, api server
- **node/nats_logger.js :** Inspection result(event) logger
- **node/dbCleaner/db_cleaner_node.js :** a node for deleting data which are expired

## Configure files ##

1. **alarmConfig.yaml**
    - alarmType: List of message types to set the alarm.
    - componentType: Alarm type.
    - setting: Alarm type setting.
2. **dbCleanerConfig.yaml**
    - timeset: Time to start cleaning up the db.
    - cleanVolume: Number of data to clean up at once.
    - retentionPeriod: Retention period.
    - tables: Table list to clean up.
    - targetColumn: Tartget column to sort.
3. **resource.yaml**
    - group: group list
    - site: site list
    - zone: zone list
    - map: map list (not using)
    - robot: robot list
    - natsSubjectList: list of topic needed to subscribe by robot type
    - natsLoggingList: list of topic needed to log by robot type
    - service: service lists with db table
    - cameraList: camera list by robot type
    - poi: poi list (not using)
4. **serverConfig.yaml**
    - authentication : not using
    - server: server ip and port information
    - nats: nats server ip and port information
5. **stateMonitorConfig.yaml**
    - topics : topic list needed to subscribe to manage robot states
6. **.env**
    - environment variables