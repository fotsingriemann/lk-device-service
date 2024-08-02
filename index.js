const { Kafka } = require("kafkajs");
const dotenv = require("dotenv");
dotenv.config();
const net = require('net');
const port = process.env.SERVER_PORT;
const { Client } = require('pg');


async function insertRawData(rawstring) {
  try {
      
    const text = 'INSERT INTO public.rawdatas(rawdata) VALUES($1)';
    const values = [`lk_${rawstring}`];

    const res = await client.query(text, values);

  } catch (err) {
    console.error('Error inserting data into the database:', err.stack);
  } 
}


const client = new Client({
  user: 'admin', // replace with your database user
  host: '79.143.185.100', // replace with your database host
  database: 'ba2ndivq93vckjxtbshv', // replace with your database name
  password: 'biast@dmin', // replace with your database password
  port: 5432, // default PostgreSQL port
});

const kafka = new Kafka({
  clientId: "lk-device-service" + Date.now(), // Append Current Epoch milliseconds for Random Id
  brokers: [
    process.env.KAFKA_BOOTSTRAP_SERVER_URL ||
    "my-cluster-kafka-bootstrap.my-kafka-project:9092",
  ],
  retry: {
      retries: 10
  }
});

//const consumerLive = kafka.consumer({ groupId: "lk-device-service-group" });
const producer = kafka.producer();

const publishToLive = async (payloadData, topic) => {
  let kafkaObject = payloadData
  return producer.send({
      topic: topic,
      waitForLeaders: true,
      messages: [
          { key: "live", value: JSON.stringify(kafkaObject) },
      ],
  }).catch(e => console.error("Failed to publish live data: ", e.message.toString()));
}


if (process.env.KAFKA_BOOTSTRAP_SERVER_URL &&  process.env.OUTPUT_TOPIC_TRACK && process.env.OUTPUT_TOPIC_SENSOR) {

    const server = net.createServer();
    server.listen(port, () => {
        console.log('TCP Server is running on port ' + port + '.');
    });

    let sockets = [];

   // the payloadObject"
    let payloadObj = {"speed":0.0,"distance":0.0,"event_flag":1024,"fl_level":0,"gpsSignal":-92,"gpsStatus":"A","canValid":0,"direction":0,"extBatVol":0,"intBatVol":0,"satellites":0,"HDOP":0,"temperature":0.0,"reserved15":0.0,"packetEventCode":1,"eventCode":0,"isLiveEventCode":true,"rawString":"","uniqueId":"","serialNo":"","date":"","time":"","timestamp":0,"imeiNo":"","latitude":0.0,"callPhpForOldPack":false,"longitude":0.0,"vehicleRegNumber":"","latitudeDir":"","longitudeDir":"","altitude":0.0,"PDOP":0.0,"miscellaneous":"","frameNumberString":"","delta_distance":0.0,"analog2":0.0,"xval":0,"yval":0,"zval":0,"clientId":"DEFAULT"}

    let sensorObj = {"userId":0,"loginTimeStamp":0,"logoutTimeStamp":0,"loginStatus":0,"logoutStatus":0,"rfid":"00","packetEventCode":0,"eventCode":0,"isLiveEventCode":false,"rawString":"","uniqueId":"","serialNo":"1","date":"","time":"","timestamp":0,"latitude":0.0,"callPhpForOldPack":false,"longitude":0.0,"altitude":0.0,"PDOP":0.0,"delta_distance":0.0,"analog2":0.0,"xval":0,"yval":0,"zval":0,"clientId":"DEFAULT"}

    server.on('connection', async function(sock) {

        console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
        sockets.push(sock);
	      await producer.connect();   
        await client.connect() 


        sock.on('data', async function(data) {
                
                const buf = Buffer.from(data)
                const str = buf.toString("hex");

                // the GPS PACKET stat by 24 => $ and the HEARTBEAT PACKET

                await insertRawData(str)
          if(str.indexOf("24") == 0){
              // serial number
              let serialNo = str.split("").splice(2, 10).join("")

              payloadObj.rawString=str

              
              // the imei number an the unique_id
              payloadObj.serialNo=serialNo
              payloadObj.uniqueId="it_"+serialNo
              payloadObj.imeiNo = serialNo

              // the time
              let time = str.split("").splice(12, 6).join("").match(/../g).join(":").toString()
              payloadObj.time = time

              //the date
              let date = str.split("").splice(18, 6).join("").match(/../g)
              date[2] = (parseInt(date[2]) + 2000).toString()
              let temp = date[0]
              date[0] = date[2]
              date[2] = temp
              payloadObj.date = date.join("-").toString()

              // the timestamp
              payloadObj.timestamp = Date.parse(new Date(date + " " + time))/1000

              // latitude
              let latitude = str.split("").splice(24, 8)
              let latitude_decimal = latitude.slice(-4).join("")
              let latitude_entiere = latitude.slice(0, -4).slice(-2).join("")
              let degre_latitude = latitude.slice(0, -6).join("")
              latitude = `${latitude_entiere}.${latitude_decimal}`
              payloadObj.latitude =  parseFloat(degre_latitude) + parseFloat(latitude) / 60

              // Battery level
              let battery = str.split("").splice(32, 2)
              console.log(battery)
              payloadObj.intBatVol = parseFloat(battery.join(""))

              // longitude
              let longitude = str.split("").splice(34, 10)
              let gpsstatus = longitude.slice(-1).join("")
              let longitude_decimal = longitude.slice(0, -1).slice(-4).join("")
              let longitude_entiere = longitude.slice(0, -1).slice(0, -4).slice(-2).join("")
              let degre_longitude = longitude.slice(0, -7).join("")
              longitude = `${longitude_entiere}.${longitude_decimal}`
              payloadObj.longitude =  parseFloat(degre_longitude)  + parseFloat(longitude) / 60

              // gps status and lat long dirs
              gpsstatus = hex2bin(gpsstatus).split("").reverse().join("")
              payloadObj.gpsStatus = gpsstatus[1] == 0 ?  "V" : "A"
              payloadObj.latitudeDir = gpsstatus[2] == 0 ? "S" : "N"
              payloadObj.longitudeDir = gpsstatus[3] == 0 ? "W" : "E"
              payloadObj.longitudeDir == "W" ? payloadObj.longitude = -1 * payloadObj.longitude : payloadObj.longitude
              payloadObj.latitudeDir == "S" ? payloadObj.latitude = -1 * payloadObj.latitude : payloadObj.latitude
          

              // the speed and direction
              let speed_and_dir = str.split("").splice(44, 6).join("").match(/.../g)
              payloadObj.speed = knotsToKmPerHour(parseFloat(speed_and_dir[0]))
              payloadObj.direction = parseInt(speed_and_dir[1])




            }
          else{
            console.log("headbeat packet")
              str_convert = hexToText(str)
              if(str_convert.indexOf("V1") > 0 && str.indexOf("2a") == 0){

                //rawdata
                payloadObj.rawString = str_convert
            
            
                const table_of_element = str_convert.split(",")
            
                //time
                let time = table_of_element[3].match(/../g).join(":").toString()
                payloadObj.time = time
            
                // SERIAL NUMBER
                payloadObj.serialNo = table_of_element[1]
            
                // IMEI NUMBER
                payloadObj.imeiNo = table_of_element[1]
            
                // UNIQUE ID
                payloadObj.uniqueId = `it_${table_of_element[1]}`
            
                // gps status
                payloadObj.gpsStatus = table_of_element[4] == "V"
            
                // latitude
                
                let latitude = table_of_element[5]
                let degre_latitude = latitude.slice(0, 2)
                let latitude_value = latitude.slice(2)
                payloadObj.latitude =  parseFloat(degre_latitude) + parseFloat(latitude_value) / 60
                
            
                // latitude dir
                
                payloadObj.latitudeDir = table_of_element[6]
                
            
                //longitude
                
                let longitude = table_of_element[7]
                let degre_longitude = longitude.slice(0, 3)
                let longitude_value = longitude.slice(3)
                payloadObj.longitude =  parseFloat(degre_longitude)  + parseFloat(longitude_value) / 60    
                
            
                //longitude dir
                
                payloadObj.longitudeDir = table_of_element[8]
                
            
            
                // speed
                payloadObj.speed = parseFloat(table_of_element[9])
            
                // direction
                payloadObj.direction = parseFloat(table_of_element[10])
            
                // date
                let date = table_of_element[11].match(/../g)
                date[2] = (parseInt(date[2]) + 2000).toString()
                let temp = date[0]
                date[0] = date[2]
                date[2] = temp
                payloadObj.date = date.join("-").toString()
            
                //timestamp 
                payloadObj.timestamp = Date.parse(new Date(date + " " + time))/1000
            
                //Sattelite number
                payloadObj.satellites = parseInt(table_of_element[17])
            
            }
          }
                

            console.log(payloadObj)

            publishToLive(payloadObj,process.env.OUTPUT_TOPIC_TRACK)

            publishToLive(sensorObj,process.env.OUTPUT_TOPIC_SENSOR)               
        });

        
        sock.on('close', function(data) {
            let index = sockets.findIndex(function(o) {
                return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
            })
            if (index !== -1) sockets.splice(index, 1);
            console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
        });
    });
  }else{
    console.log("MQTT VARIABLES NOT SET!");
  }




function hex2bin(hex){
  return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function hexToText(hexString) {
    // Convert the hex string to a Buffer
    const buffer = Buffer.from(hexString, 'hex');
    
    // Convert the Buffer to a string
    return buffer.toString('utf-8');
}

function knotsToKmPerHour(knots) {
  return knots * 1.852;
}