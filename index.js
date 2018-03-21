const brain = require("brain.js")
    , request = require("request")
    , getPixels = require("get-pixels")

const hostListCard = "https://www.ygohub.com/api/all_cards";

let net = new brain.recurrent.RNN();

let getYGOHub = async function(url, map) {
  return await new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      if(error) {
        reject(error);
      }
      if(response.statusCode === 200) {
        map ? resolve(map(body)) : resolve(body);
      } else {
        reject(response.statusCode)
      }
    });
  })
}

let listAllCard = async function() {
  return await getYGOHub('https://www.ygohub.com/api/all_cards', JSON.parse);
}

let getInfoFromCardName = async function(name) {
  console.log(name);
  let url = `https://www.ygohub.com/api/card_info?name=${name}`
  return await getYGOHub(url, JSON.parse);
}

let getImageCard = async function(card) {
  return await new Promise((resolve, reject) => {
    getPixels(card.image_path, (err, pixels) => {
      if(err) {
        reject(err);
      } else {
        resolve(pixels);
      }
    })
  });
}

let getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let training = async function(nbTrain, cards) {
  let testSet = [];
  for (var i = 0; i < nbTrain; i++) {
    let name = cards[getRandomInt(0, cards.length)];
    try {
      let card = (await getInfoFromCardName(name)).card;
      let image = (await getImageCard(card)).data;
      testSet.push({input: image, output: card.type});
    } catch(err) {
      console.log(err, name);
    }
  }
  net.train(testSet);
}

let check = async function(n, cards) {
  let sat = 0;

  for (var i = 0; i < n; i++) {
    let name = cards[i];
    try {
      let card = (await getInfoFromCardName(name)).card;
      let image = (await getImageCard(card)).data;
      let output = net.run(image);
      console.log(output);
      if(output === card.type) {
        sat++;
      }
    } catch(err) {
      console.log(err, name);
    }
  }
  console.log("Result:");
  console.log("Good: ", sat / n);
  console.log("Bad: ", (1 - sat0) / n);
}

let main = async function() {
  let allCards = (await listAllCard()).cards;
  training(200, allCards);
  check(10, allCards);
}

main();

// net.train([
//   {input: [0,0], output: [0]},
//   {input: [0,1], output: [1]},
//   {input: [1,0], output: [1]},
//   {input: [1,1], output: [0]}
// ])
//
// let output = net.run([0,0]);
// console.log(output);
