const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const twilio = require("twilio");
require("dotenv").config();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const app = express();
app.use(cors());
app.use(bodyParser.json());
// Serve static files from the "frontend" folder
app.use(express.static(path.join(__dirname, "frontend")));
// Serve index.html on root route

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Route to initiate a call
app.post("/call", async (req, res) => {
  console.log("Received call request:", req.body);
  const { to } = req.body;
  try {
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER, // Replace with your Twilio phone number
      to: process.env.CALL_TO_NUMBER, // Now using environment variable
      url: `${process.env.NGROK_URL}/voice?to=${encodeURIComponent(
        to
      )}`,
    });

    res.json(call);
  } catch (err) {
    console.error("Error creating call:", err);
    res.status(500).send({ error: "Failed to create call" });
  }
});
// Route to hang up a call
app.post("/hangup", async (req, res) => {
  const { sid } = req.body;
  try {
    const call = await client.calls(sid).update({ status: "completed" });
    res.json({ message: "Call ended", sid: call.sid });
  } catch (err) {
    console.error("Error ending call:", err);
    res.status(500).send({ error: "Failed to end call" });
  }
});
app.post("/voice", (req, res) => {
  const to = req.query.to || req.body.To;
  const twiml = new twilio.twiml.VoiceResponse();

  if (to) {
    twiml.dial(to);
  } else {
    twiml.say("No destination number provided.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// Start server
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
