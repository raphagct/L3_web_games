
//Code récupéré sur l'exemple du cours

async function loadAssets(assetsToLoadURLs) {
  // here we should load the sounds, the sprite sheets etc.
  // then at the end call the callback function
  let result = await loadAssetsUsingHowlerAndNoXhr(assetsToLoadURLs);
  console.log("loadAssets after loadAssetsUsingHowlerAndNoXhr");
  return result;
}

// You do not have to understand in details the next parts of the code...
// just use the above function

/* ############################
    BUFFER LOADER for loading multiple files asyncrhonously. The callback functions is called when all
    files have been loaded and decoded 
 ############################## */
function isImage(url) {
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
}

function isAudio(url) {
  return url.match(/\.(mp3|ogg|wav)$/) != null;
}

async function loadAssetsUsingHowlerAndNoXhr(assetsToBeLoaded) {
  var assetsLoaded = {};
  var loadedAssets = 0;
  var numberOfAssetsToLoad = 0;

  return new Promise((resolve) => {
    // define ifLoad function
    var ifLoad = function () {
      if (++loadedAssets >= numberOfAssetsToLoad) {
        resolve(assetsLoaded);
      }
      console.log("Loaded asset " + loadedAssets);
    };

    // get num of assets to load
    for (var name in assetsToBeLoaded) {
      numberOfAssetsToLoad++;
    }

    console.log("Nb assets to load: " + numberOfAssetsToLoad);

    for (name in assetsToBeLoaded) {
      var url = assetsToBeLoaded[name].url;
      console.log("Loading " + url);
      if (isImage(url)) {
        assetsLoaded[name] = new Image();

        assetsLoaded[name].onload = ifLoad;
        // will start async loading.
        assetsLoaded[name].src = url;
      } else {
        // We assume the asset is an audio file
        console.log(
          "loading " + name + " buffer : " + assetsToBeLoaded[name].loop,
        );
        assetsLoaded[name] = new Howl({
          src: [url],
          buffer: assetsToBeLoaded[name].buffer,
          loop: assetsToBeLoaded[name].loop,
          autoplay: false,
          volume: assetsToBeLoaded[name].volume,
          onload: function () {
            if (++loadedAssets >= numberOfAssetsToLoad) {
              console.log("ALL ASSETS LOADEDS");
              return resolve(assetsLoaded);
            }
            console.log("Loaded asset " + loadedAssets);
          },
        }); // End of howler.js callback
      } // if
    } // for
  }); // promise
} // function

export { loadAssets };
