import { Component } from "../../core/bane";
import $ from "jquery";
import PhotoSwipe from "photoswipe";
import PhotoSwipeUI_Default from "photoswipe/dist/photoswipe-ui-default";
import track from "../../core/decorators/track";
import publish from "../../core/decorators/publish";

// Keep track of instance IDs
let instanceId = 0;

/**
 * A component for creating an Image Gallery
 */
export default class ImageGalleryComponent extends Component {
  /**
   * Render the gallery viewer
   * @return {jQuery} Returns the gallery element
   */
  get $pswp() {
    if (this._$pswp) {
      return this._$pswp;
    }

    return this._$pswp = $(this.template({})).appendTo("body");
  }

  initialize({
    galleryImageSelector = ".stack__article__image-container"
  } = {}) {
    this.template = require("./image_gallery.hbs");

    this.$images = this.$el.find(galleryImageSelector);

    this.events = {
      ["click " + galleryImageSelector]: "onGalleryClick"
    };

    this.$el.attr({
      "data-pswp-uid": ++instanceId,
      "data-gallery": this
    });
  }

  _parseThumbnailElements() {
    if (this._items) {
      return this._items;
    }

    let items = this._items = [];

    this.$images.each((i, el) => {
      let $galleryImage = $(el),
          $linkEl = $galleryImage.find("a"),
          size = $linkEl.attr("data-size").split("x"),
          image = $linkEl.find("img").attr("src"),
          link = $linkEl.attr("href"),
          largeImage = link.match(/\.(jpg|png|gif)/) ? link : image,
          youtubeID = this._youtubeID(link);

      let item = {
        src: largeImage,
        msrc: image,
        el: $linkEl.find("img")[0],
        w: parseInt(size[0], 10),
        h: parseInt(size[1], 10)
      };

      let $caption;
      if (($caption = $galleryImage.find("span")).length) {
        item.title = $caption.html();
      } else if (($caption = $galleryImage.next(".copy--caption")).length) {
        item.title = $caption.html();
      } else if (($caption = $galleryImage.next("p").find(".caption")).length) {
        item.title = $caption.html();
      }

      if (youtubeID) {
        item.youtubeID = youtubeID;
        item.html = `<div class="pswp__player" id="${youtubeID}"></div>`;
        item.title = null;
        item.src = null;
        item.msrc = null;
      }

      items.push(item);
    });

    return items;
  }

  /**
   * Callback from photoswipe gallery close
   */
  onGalleryClose() {
    this._youtubeStop();
  }

  /**
   * Callback from photoswipe item change
   */
  onGalleryChange() {
    this._youtubePlay(this._gallery.currItem);

    console.log(this._gallery.options.getNumItemsFn(), this._gallery.items.length);

    this.initFirstSlide();
    this.initLastSlide();

    let $ad = $(this._$pswp).find(".js-ad-slideshow");

    console.log($ad.length);

    if (!$ad.length) {
      this.adsReloaded = false;
    }

    let isLastItem = this._gallery.getCurrentIndex() + 1 === this._gallery.options.getNumItemsFn();

    if (isLastItem && !this.adsReloaded) {
      this.reloadAds($ad);
    }

    console.log(this.adsReloaded);
  }

  @publish("reload", "ads")
  reloadAds($ad) {
    this.adsReloaded = true;
    console.log("reloadAds");

    if ($ad.length) {
      $ad.data({
        adType: "ajax",
        targeting: null
      })
      .removeAttr("data-targeting");
    }
  }

  /**
   * Plays youtube movie if given proper movie ID
   */
  _youtubePlay(galleryItem) {
    if (galleryItem.youtubeID) {
      this._player = document.getElementById(galleryItem.youtubeID);
      this._player.innerHTML = "<iframe width='100%' height='100%' src='https://www.youtube.com/embed/" + galleryItem.youtubeID + "?autoplay=1' frameborder='0' allowfullscreen></iframe>";
    } else {
      this._youtubeStop();
    }
  }

  /**
   * Stops youtube movie and destroys the player
   */
  _youtubeStop() {
    if (this._player) {
      this._player.innerHTML = "";
      this._player = null;
    }
  }

  /**
   * Gets youtube movie id from given youtube movie url
   */
  _youtubeID(url) {
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
        match = url.match(regExp);

    return match && match[2].length == 11 ? match[2] : null;
  }

  /**
   * Callback from clicking on a gallery image
   * @param  {Event}  event Event
   * @return {Object}       Returns an object to send data to GA for tracking
   */
  @track("gallery click");
  onGalleryClick(event) {
    event.preventDefault();

    let clickedListItem = event.currentTarget,
        index = this.$images.index(clickedListItem),
        src = $(clickedListItem).find("img").attr("src");

    if (index >= 0) {
      this.openPhotoSwipe(index);
    }

    return src;
  }

  /**
   * Open the photo gallery
   * @param  {[type]} index [description]
   * @return {[type]}       [description]
   */
  openPhotoSwipe(index = 0) {
    let items = this._parseThumbnailElements();

    let options = {
      galleryUID: this.$el.attr("data-pswp-uid"),
      getThumbBoundsFn: function() { // (index)
        // console.log(index);
        // let thumbnail = items[index].el, // find thumbnail
        //     pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
        //     rect = thumbnail.getBoundingClientRect();

        // return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
        return false;
      },
      history: false,
      counterEl: false,
      loop: false,
      // preload: [0, 2],
      index
    };

    this._gallery = new PhotoSwipe( this.$pswp[0], PhotoSwipeUI_Default, items, options );
    this._gallery.listen("afterChange", this.onGalleryChange.bind(this));
    this._gallery.listen("close", this.onGalleryClose.bind(this));

    // this._gallery.listen("gettingData", function(index, item) {
    //   if(index === 3) {
    //     item.html = "<div>Dynamically generated HTML " + Math.random() + "</div>";
    //   }
    // });

    /*this._gallery.listen("preventDragEvent", function(e, isDown, preventObj) {
      // e - original event
      // isDown - true = drag start, false = drag release

      // Line below will force e.preventDefault() on:
      // touchstart/mousedown/pointerdown events
      // as well as on:
      // touchend/mouseup/pointerup events
      preventObj.prevent = true;
    });*/

    this._gallery.init();

    // if ad is not pushed and ad blocker is OFF
    if (!this.adPushed) {
      this._gallery.items.push({
        html: `<div class="ad ad--full js-ad-slideshow">
          <div class="adunit adunit--mpu adunit--slideshow" data-size-mapping="mpu"></div>
        </div>`
      });

      this.adPushed = true;
    }

    console.log(this._gallery.options.getNumItemsFn(), this._gallery.items.length);

    // this.reloadAds();

    // this._gallery.ui.update();
  }

  initFirstSlide() {
    let slideCount = this._gallery.getCurrentIndex() + 1;
    let $arrow = this._$pswp.find(".js-pswp-arrow-left");
    if (slideCount === 1) {
      // console.warn("First slide");
      $arrow.prop("hidden", true);
      // this._gallery.options.arrowKeys = false;

      $(document).on("keyup", (event) => {
        if (event.keyCode === 37) {
          console.warn("left arrow pressed");
          $(document).off("keyup");
          event.preventDefault();
          return false;
        }
      });

    } else {
      $arrow.prop("hidden", false);
      // this._gallery.options.arrowKeys = true;
    }
  }

  initLastSlide() {
    let slideCount = this._gallery.getCurrentIndex() + 1;
    let $arrow = this._$pswp.find(".js-pswp-arrow-right");
    if (slideCount === this._gallery.options.getNumItemsFn()) {
      // console.warn("Last slide");
      // this._gallery.options.arrowKeys = false;
      $arrow.prop("hidden", true);
    } else {
      $arrow.prop("hidden", false);
      // this._gallery.options.arrowKeys = true;
    }
  }
}
