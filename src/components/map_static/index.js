require("./_map_static.scss");

let mapLoaded = false;
let $mapButton = $(".js-open-map");
let map = null;
$mapButton.on("click", function() {
  if (!mapLoaded) {
    require.ensure([
      "../map/index"
    ], (require) => {
      if (map) {
        return map.open();
      }

      let MapComponent = require("../map/index");
      
      map = new MapComponent({
        el: ".map_holder"
      });
      
      map.open();
    }, "map");
  }
});

if (window.location.href.indexOf("/map") > -1) {
  $mapButton.trigger("click");
}
