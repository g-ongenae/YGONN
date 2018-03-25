const brain = require("brain.js")
    , request = require("request")
    , getPixels = require("get-pixels");

const hostListCard = "https://www.ygohub.com/api/all_cards";

const net = new brain.recurrent.RNN();

const getYGOHub = async function(url, map) {
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

const listAllCard = async function() {
  return await getYGOHub('https://www.ygohub.com/api/all_cards', JSON.parse);
}

const getInfoFromCardName = async function(name) {
  console.log(name);
  const url = `https://www.ygohub.com/api/card_info?name=${name}`;
  return await getYGOHub(url, JSON.parse);
}

const getImageCard = async function(card) {
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

const getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const training = async function(nbTrain, cards) {
  const testSet = [];
  for (let i = 0; i < nbTrain; i++) {
    const name = cards[getRandomInt(0, cards.length)];
    try {
      const card = (await getInfoFromCardName(name)).card;
      const image = (await getImageCard(card)).data;
      testSet.push({input: [image], output: card.type});
    } catch(err) {
      console.error(err);
    }
  }
  
  return net.train(testSet);
}

const check = async function(n, cards) {
  let sat = 0;

  for (let i = 0; i < n; i++) {
    const name = cards[i];
    try {
      const card = (await getInfoFromCardName(name)).card;
      const image = (await getImageCard(card)).data;
      const output = net.run([image]);
      console.log(output);
      if(output === card.type) {
        sat++;
      }
    } catch(err) {
      console.error(err);
    }
  }
  console.log(`Result:
  Good: ${sat / n}
  Bad:  ${(1 - sat) / n}`);
}

const main = async function() {
  console.log("Fecthing list of cards");
  const allCards = (await listAllCard()).cards;
  console.log("List fetched, beginning trainning");
  const res = await training(200, allCards);
  console.log("Training result:", res);
  if (res.error < 0.5) {
    await check(10, allCards);
  } else {
    console.log("BrainJS couldn't make sense of the data");
  }
}

main();

// net.train([
//   {input: [0,0], output: [0]},
//   {input: [0,1], output: [1]},
//   {input: [1,0], output: [1]},
//   {input: [1,1], output: [0]}
// ]);
//
// const output = net.run([0,0]);
// console.log(output);
