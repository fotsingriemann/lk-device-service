Title : lk-device-service

Description : This microservice publish data to the topics track and sensor. It get the data from a tracker call lk tracker via the tcp/ip protocol on the server. Those data is parsing using this algorithm to put it in the sensor or payload object.

Documentation : NA.

Requirements : Broker has to be up and the URL/PORT/TOPIC-NAME has to be configured in the .env file before running the service. And verify if the tcp port is alseo present in the .env file
               

Setup : Pull the repo. Goto lk-device-service directory and run "node index.js" to get this microservice up and running. (Make sure the "Requirements" are met before this)

Testing : on window, use the command 'ncat serverhost port' and on linux you can une the command 'netcat serverhost port'. Example:
my code is running on the port 6001 and it is running on the server 7.23.45.671, then from windows you run 
- ncat 7.23.45.671 6001
- netcat 7.23.45.671 6001
and send data like this : 2447102717661103390407240402553006009422448c002000fffffbffff001f000000000002700200000000000c06



Configuration : .env file has to be configured as mentioned in "Requirements"

Road Map : 1) Planned Additions: Adding the microservice into docker image
           2) Current Issues: None 
           3) Changelog: NA

Discussion : NA 

Owner : Name  -  Bernoulli Riemann
        Title -  Telematic developer  
        Email -  riemann.fotsing@africasystems.com
