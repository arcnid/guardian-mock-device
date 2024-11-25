import fastify from "fastify";
import wifi from "node-wifi";
import { promisify } from "util";
import formBody from "@fastify/formbody";

const server = fastify({});
server.register(formBody);

wifi.init({
	iface: "Wi-Fi", // network interface, choose a random wifi interface if set to null
});

server.get("/", async (req, res) => {
	console.log("Just hit root");

	res.send({ message: "Hello World" });
});

const scanWifiAsync = promisify(wifi.scan);
const connectWifiAsync = promisify(wifi.connect);
const getCurrentConnectionsAsync = promisify(wifi.getCurrentConnections);
const deleteConnectionAsync = promisify(wifi.deleteConnection);
let SSID;
let PASSWORD;
let DEVICE_UUID;

server.get("/scanWifi", async (req, res) => {
	try {
		console.log("Just hit scanWifi");
		const netowrks = await scanWifiAsync();
		console.log(netowrks);

		res.send({ message: "Success", data: netowrks });
	} catch (err) {
		res.send({ message: "Error" });
	}
});

interface ConnectWifiRequest {
	ssid: string;
	password: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

server.post("/connectWifi", async (req, res) => {
	const currentConnections = await getCurrentConnectionsAsync();

	try {
		if (currentConnections.length > 0) {
			for (const connection of currentConnections) {
				console.log(connection);
				console.log("gonna delete connection");
				wifi.disconnect((error) => {
					if (error) {
						console.log(error);
					} else {
						console.log("Disconnected");
					}
				});
			}
		}
	} catch (error) {
		res.send({ message: "Error", error });
	}

	console.log("Current Connections: ", currentConnections);
	console.log("Just hit connectWifi");
	const { ssid, password } = req.body as ConnectWifiRequest;
	console.log("Just go it");
	console.log({ ssid, password });

	if (!ssid || !password) {
		res.send({ message: "Please provide ssid and password" });
	}

	try {
		console.log("attempting to connect to " + ssid);

		await connectWifiAsync({ ssid, password });
		console.log("Checking to see if connection is valid");

		sleep(5000);

		const currentConnections = await getCurrentConnectionsAsync();

		console.log(currentConnections);

		if (currentConnections.length > 0) {
			res.send({ message: "Success" });
		} else {
			res.send({ message: "Failed" });
		}
	} catch (error) {
		res.send({ message: "Error" });
		console.log(error);
	}
});

interface Configuration {
	ssid: string;
	password: string;
	UUID: string;
}

server.post("/setConfiguration", async (req, res) => {
	// Set the configuration
	//on the physical device this will be stored in the EEPROM
	//for now we will just store it in memory
	const { ssid, password, UUID } = req.body as Configuration;

	SSID = ssid;
	PASSWORD = password;
	DEVICE_UUID = UUID;

	console.log({ SSID, PASSWORD, DEVICE_UUID });

	res.send({ message: "Configuration Set" });
});

//start the server on port 3000

server.listen({ port: 3000 }, (err, address) => {
	console.log(address);
	console.log("Server is running on port 3000");
});
