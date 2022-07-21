const express = require('express');
const { fstatSync } = require('fs');
const { request } = require('http');
const fs = require('fs').promises;
const path = require('path');
const axios = require("axios");

require('dotenv').config();

const app = express();
const dataFile = path.join(__dirname, 'data.json');
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions))

app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.send('hello');
});

app.get('/teams', async (req, res) => {
    let request;
    res.header("Access-Control-Allow-Origin", "*");
    const options = {
        method: 'GET',
        url: 'https://api-baseball.p.rapidapi.com/teams',
        params: {league: '1', season: '2020'},
        headers: {
          'X-RapidAPI-Key': '0f54c0c558msh970571fee3a871dp1952c4jsn1e3e34489330',
          'X-RapidAPI-Host': 'api-baseball.p.rapidapi.com'
        }
      };

    try {
        request = await axios.request(options)
    } catch (error) {
        console.log(error);
    }
    
    if (!request) {
        return res.status(503).send({
            message: 'Failed to grab team data'
        });
    }

    const teams = request.data.response.map(team => team.name);
      
    res.json({teams});
});

app.get('/poll', async (req, res) => {
    let data = JSON.parse(await fs.readFile(dataFile, "utf-8"));

    const totalVotes = Object.values(data).reduce((total, value) => total += value, 0);

    data = Object.entries(data).map(([label, votes]) => {
        return {
            label,
            percentage: ((100 * votes) / totalVotes || 0).toFixed(0)
        }
    });

    res.json(data);
});

app.post('/set-poll', async (req,res) => {
    // Reset poll data
    await fs.writeFile(dataFile, JSON.stringify({}));

    const {team1} = req.body;
    const {team2} = req.body;
    const data = {};

    data[team1] = 0;
    data[team2] = 0;

    await fs.writeFile(dataFile, JSON.stringify(data));

    res.end();
});

app.post("/poll", async (req, res) => {
    const data = JSON.parse(await fs.readFile(dataFile, "utf-8"));

    data[req.body.add]++;

    await fs.writeFile(dataFile, JSON.stringify(data));

    res.end();
});


app.listen(process.env.PORT, () => console.log('server is running'))