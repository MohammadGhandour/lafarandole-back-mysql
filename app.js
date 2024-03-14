const express = require("express");
const app = express();
const path = require("path");
const db = require("./models");
const cors = require("cors");
const PORT = process.env.PORT || 2022;
const FORCE = false;
const axios = require("axios");
const WebSocket = require("ws");
const specificIP = "154.56.57.79";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(cors());
// app.use(cors({ origin: ["https://lafarandoleparis.com", "https://invvest.co", "https://backend.invvest.co", "154.56.57.79"] }));

app.use("/api/images", express.static(path.join(__dirname, "images")));

app.get("/api", async (req, res) => { res.status(200).json({ message: "Hello from lafarandole backend" }) });

const usersRoutes = require("./routes/usersRoutes");
const productsRoutes = require("./routes/productsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const customersRoutes = require("./routes/customersRoutes");
const expensesRoutes = require("./routes/expensesRoutes");

app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/expenses", expensesRoutes);

app.post("/api/trade-republic/request-sms-code", async (req, res) => {
    try {
        const { phoneNumber, pinCode: pin, isEdit, rawPhoneNumber, countryCode } = req.body;

        const userAgent = req.get("user-agent");
        console.log({ phoneNumber, pin, "User-Agent": userAgent });
        const response = await axios.post(`https://api.traderepublic.com/api/v1/auth/web/login`, { phoneNumber, pin });
        console.log(response.data);
        res.status(200).json(response.data);
    } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
            console.error(error.response.data);
            if (error.response.data.errors.length) {
                if (["AUTHENTICATION_ERROR"].includes(error.response.data.errors[0].errorCode)) {
                    return res.status(400).json("Identifiants incorrects.");
                } else if (["TOO_MANY_REQUESTS"].includes(error.response.data.errors[0].errorCode)) {
                    return res.status(400).json("Trop de tentatives. Veuillez ressayer dans 5 minutes.");
                } else {
                    return res.status(500).json("Une erreur est survenue. Veuillez ressayer.");
                }
            } else {
                return res.status(500).json("Une erreur est survenue. Veuillez ressayer.");
            }
        } else {
            if (error.response && error.response.data) {
                console.error(error.response.data);
            } else {
                console.error(error);
            }
            return res.status(500).json("Une erreur est survenue. Veuillez ressayer.");
        }
    }
});



app.post("/api/trade-republic/submit-sms-code", async (req, res) => {
    try {
        const { processId, smsCode, synchronisationId, connection_key } = req.body;
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        if (!processId || !smsCode) return res.status(400).json({ processId, smsCode });

        const response = await axios.post(`https://api.traderepublic.com/api/v1/auth/web/login/${processId}/${smsCode}`);
        const token = response.headers["set-cookie"].find(cookie => cookie.startsWith("tr_session=")).split(";")[0].split("=")[1];
        console.log("Logged in");

        let arrayOfAssets = [];
        let gotCash = false;
        let initiated = false;

        if (token) {
            const ws = new WebSocket("wss://api.traderepublic.com", { headers: { "Host": "api.traderepublic.com", "Origin": "https://app.traderepublic.com", "User-Agent": userAgent } });

            ws.on("open", () => {
                const message = JSON.stringify({ clientId: "app.traderepublic.com", clientVersion: "1.27.7", locale: "en", platformId: "webtrading", platformVersion: "chrome - 120.0.0" });
                ws.send(`connect 28 ${message}`);
                console.log("WebSocket Connected.");
                setTimeout(() => { ws.close() }, 2000);
            });

            ws.on("message", (data) => {
                const message = data.toString();
                if (message === "connected") {
                    ws.send(`sub 0 ${JSON.stringify({ type: "availableCash", token })}`);
                    ws.send(`sub 959 ${JSON.stringify({ type: "compactPortfolio", token })}`);
                } else if (message.includes("959")) {
                    let jsonPart = message.substring(message.indexOf("{"));
                    if (message.includes("positions")) {
                        if (jsonPart) {
                            const parsed = JSON.parse(jsonPart);
                            if (parsed && parsed.positions) {
                                const assets = parsed.positions;
                                console.log({ "assets.length": assets.length });
                                for (let asset of assets) {
                                    arrayOfAssets.push({ isin: asset.instrumentId, quantity: asset.netSize, cost_per_share: asset.averageBuyIn });
                                };
                                if (gotCash && arrayOfAssets.length > 1 && !initiated) {
                                    console.log(arrayOfAssets);
                                    res.status(200).json(arrayOfAssets);
                                    initiated = true;
                                };
                            }
                        }
                    }
                } else if (message.includes("0 A")) {
                    let jsonPart = message.substring(message.indexOf("[{"));
                    const jsonObject = JSON.parse(jsonPart);
                    const price = (jsonObject.length && jsonObject[0].amount) ? Number(jsonObject[0].amount) : 0;
                    arrayOfAssets.push({ isin: "liquidity", quantity: 1, currentPrice: price });
                    gotCash = true;

                    if (gotCash && arrayOfAssets.length > 1 && !initiated) {
                        console.log(arrayOfAssets);
                        res.status(200).json(arrayOfAssets);
                        initiated = true;
                    };
                } else {
                    console.log("===================");
                    console.log("NONE OF THE ABOOOOOOVE");
                    console.log(message);
                    console.log("NONE OF THE ABOOOOOOVE");
                    console.log("===================");
                }
            });

            ws.on("error", (error) => { console.log("WebSocket Error: ", error); });

            ws.on("close", () => {
                console.log("WebSocket Closed.");
                if (!initiated) {
                    console.log(arrayOfAssets);
                    res.status(200).json(arrayOfAssets);
                    initiated = true;
                }
            });
        } else {
            console.error("No token");
            res.status(400).json("Une erreur est survenue. Veuillez ressayer.");
        }
    } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
            console.log(error.response.data.errors);
            if (error.response.data.errors.length && ["INVALID_PROCESS"].includes(error.response.data.errors[0].errorCode)) {
                return res.status(400).json("La session a expiré.");
            } else if (error.response.data.errors.length && ["VALIDATION_CODE_INVALID", "VALIDATION_CODE_INVALIDATED"].includes(error.response.data.errors[0].errorCode)) {
                return res.status(400).json("Code de vérification incorrect.");
            } else {
                res.status(500).json("Une erreur est survenue. Veuillez ressayer.");
            }
        } else {
            console.error(error);
            res.status(500).json("Une erreur est survenue. Veuillez ressayer.");
        }
    }
});



db.sequelize.sync({ force: FORCE })
    .then(() => {
        app.listen(PORT, specificIP, () => { console.log(`Server running on port ${PORT}`); })
    }).catch(err => {
        console.log("Couldnt connect to database");
        console.log(err);
    });
