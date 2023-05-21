import MobileMenu from 'mmenu-light';
import Swal from 'sweetalert2';
import Anime from './partials/anime';
import initTootTip from './partials/tooltip';
import AppHelpers from "./app-helpers";

class App extends AppHelpers {
  constructor() {
    super();
    window.app = this;
  }

  loadTheApp() {
    this.commonThings();
    this.initiateNotifier();
    this.initiateMobileMenu();
    this.initiateStickyMenu();
    this.initAddToCart();
    this.initiateAdAlert();
    this.initiateDropdowns();
    this.initiateModals();
    this.initiateCollapse();
    initTootTip();

    salla.comment.event.onAdded(() => window.location.reload());

    this.status = 'ready';
    document.dispatchEvent(new CustomEvent('theme::ready'));
    this.log('Theme Loaded 🎉');
  }

  log(message) {
    salla.log(`ThemeApp(Raed)::${message}`);
    return this;
  }

  commonThings(){
    this.cleanContentArticles('.content-entry');
  }

  cleanContentArticles(elementsSelector){
    let articleElements = document.querySelectorAll(elementsSelector);

    if (articleElements.length) {
      articleElements.forEach(article => {
        article.innerHTML = article.innerHTML.replace(/\&nbsp;/g, ' ')
      })
    }
  }

  copyToClipboard(event) {
    event.preventDefault();
    let aux = document.createElement("input"),
      btn = event.currentTarget;
    aux.setAttribute("value", btn.dataset.content);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
    this.toggleElementClassIf(btn, 'copied', 'code-to-copy', () => true);
    setTimeout(() => {
      this.toggleElementClassIf(btn, 'code-to-copy', 'copied', () => true)
    }, 1000);
  }

  initiateNotifier() {
    salla.notify.setNotifier(function (message, type, data) {
      if (typeof message == 'object') {
        return Swal.fire(message).then(type);
      }

      return Swal.mixin({
        toast            : true,
        position         : salla.config.get('theme.is_rtl') ? 'top-start' : 'top-end',
        showConfirmButton: false,
        timer            : 3500,
        didOpen          : (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      }).fire({
        icon            : type,
        title           : message,
        showCloseButton : true,
        timerProgressBar: true
      })
    });
  }

  initiateMobileMenu() {
    let menu = this.element("#mobile-menu");
    //in landing menu will not be their
    if (!menu) {
      return;
    }
    menu = new MobileMenu(menu, "(max-width: 1024px)", "( slidingSubmenus: false)");
    salla.lang.onLoaded(() => {
      menu.navigation({title: salla.lang.get('blocks.header.main_menu')});
    });
    const drawer = menu.offcanvas({position: salla.config.get('theme.is_rtl') ? "right" : 'left'});

    this.onClick("a[href='#mobile-menu']", event => event.preventDefault() || drawer.close() || drawer.open());
    this.onClick(".close-mobile-menu", event => event.preventDefault() || drawer.close());
  }

  initiateStickyMenu() {
    let header = this.element('#mainnav'),
      height = this.element('#mainnav .inner')?.clientHeight;
    //when it's landing page, there is no header
    if (!header) {
      return;
    }

    window.addEventListener('load', () => setTimeout(() => this.setHeaderHeight(), 500))
    window.addEventListener('resize', () => this.setHeaderHeight())

    window.addEventListener('scroll', () => {
      window.scrollY >= header.offsetTop + height ? header.classList.add('fixed-pinned', 'animated') : header.classList.remove('fixed-pinned');
      window.scrollY >= 200 ? header.classList.add('fixed-header') : header.classList.remove('fixed-header', 'animated');
    }, {passive: true});
  }

  setHeaderHeight() {
    let height = this.element('#mainnav .inner').clientHeight,
      header = this.element('#mainnav');
    header.style.height = height + 'px';
  }

  /**
   * Because salla caches the response, it's important to keep the alert disabled if the visitor closed it.
   * by store the status of the ad in local storage `salla.storage.set(...)`
   */
  initiateAdAlert() {
    let ad = this.element(".salla-advertisement");

    if (!ad) {
      return;
    }

    if (!salla.storage.get('statusAd-' + ad.dataset.id)) {
      ad.classList.remove('hidden');
    }

    this.onClick('.ad-close', function (event) {
      event.preventDefault();
      salla.storage.set('statusAd-' + ad.dataset.id, 'dismissed');

      anime({
        targets : '.salla-advertisement',
        opacity : [1, 0],
        duration: 300,
        height  : [ad.clientHeight, 0],
        easing  : 'easeInOutQuad',
      });
    });
  }

  initiateDropdowns() {
    this.onClick('.dropdown__trigger', ({target: btn}) => {
      btn.parentElement.classList.toggle('is-opened');
      document.body.classList.toggle('dropdown--is-opened');
      // Click Outside || Click on close btn
      window.addEventListener('click', ({target: element}) => {
        if (!element.closest('.dropdown__menu') && element !== btn || element.classList.contains('dropdown__close')) {
          btn.parentElement.classList.remove('is-opened');
          document.body.classList.remove('dropdown--is-opened');
        }
      });
    });
  }

  initiateModals() {
    this.onClick('[data-modal-trigger]', e => {
      let id = '#' + e.target.dataset.modalTrigger;
      this.removeClass(id, 'hidden');
      setTimeout(() => this.toggleModal(id, true)); //small amont of time to running toggle After adding hidden
    });
    salla.event.document.onClick("[data-close-modal]", e => this.toggleModal('#' + e.target.dataset.closeModal, false));
  }

  toggleModal(id, isOpen) {
    this.toggleClassIf(`${id} .s-salla-modal-overlay`, 'ease-out duration-300 opacity-100', 'opacity-0', () => isOpen)
      .toggleClassIf(`${id} .s-salla-modal-body`,
        'ease-out duration-300 opacity-100 translate-y-0 sm:scale-100', //add these classes
        'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95', //remove these classes
        () => isOpen)
      .toggleElementClassIf(document.body, 'modal-is-open', 'modal-is-closed', () => isOpen);
    if (!isOpen) {
      setTimeout(() => this.addClass(id, 'hidden'), 350);
    }
  }

  initiateCollapse() {
    document.querySelectorAll('.btn--collapse')
      .forEach((trigger) => {
        const content = document.querySelector('#' + trigger.dataset.show);
        const state = {isOpen: false}

        const onOpen = () => anime({
          targets : content,
          duration: 225,
          height  : content.scrollHeight,
          opacity : [0, 1],
          easing  : 'easeOutQuart',
        });

        const onClose = () => anime({
          targets : content,
          duration: 225,
          height  : 0,
          opacity : [1, 0],
          easing  : 'easeOutQuart',
        })

        const toggleState = (isOpen) => {
          state.isOpen = !isOpen
          this.toggleElementClassIf(content, 'is-closed', 'is-opened', () => isOpen);
        }

        trigger.addEventListener('click', () => {
          const {isOpen} = state
          toggleState(isOpen)
          isOpen ? onClose() : onOpen();
        })
      });
  }


  /**
   * Workaround for seeking to simplify & clean, There are three ways to use this method:
   * 1- direct call: `this.anime('.my-selector')` - will use default values
   * 2- direct call with overriding defaults: `this.anime('.my-selector', {duration:3000})`
   * 3- return object to play it letter: `this.anime('.my-selector', false).duration(3000).play()` - will not play animation unless calling play method.
   * @param {string|HTMLElement} selector
   * @param {object|undefined|null|null} options - in case there is need to set attributes one by one set it `false`;
   * @return {Anime|*}
   */
  anime(selector, options = null) {
    let anime = new Anime(selector, options);
    return options === false ? anime : anime.play();
  }

  /**
   * These actions are responsible for pressing "add to cart" button,
   * they can be from any page, especially when mega-menu is enabled
   */
  initAddToCart() {
    salla.cart.event.onUpdated(summary => {
      document.querySelectorAll('[data-cart-total]').forEach(el => el.innerText = salla.money(summary.total));
      document.querySelectorAll('[data-cart-count]').forEach(el => el.innerText = salla.helpers.number(summary.count));
    });

    salla.cart.event.onItemAdded((response, prodId) => {
      app.element('salla-cart-summary').animateToCart(app.element(`#product-${prodId} img`));
    });
  }
  
}
$(document).ready(function () {
  $("#infoLink").click();
  $(".comments").hide();
  $(".addCommentForm").hide();
  $("#reviewsLink").click(function () {
      $(".comments").show();
      $(".addCommentForm").show();
  });
  $("#infoLink").click(function () {
      $(".comments").hide();
      $(".addCommentForm").hide();
  });
  $(".s-cart-summary-count").parent().next('.s-cart-summary-count').slideDown(100);
  if (window.location.href.indexOf("cart") > -1||window.location.href.indexOf("perfum") > -1 ) {
      var counterValue = $(" #value");
      var counterIncrement = $(" #increment");
      var counterDecrement = $(" #decrement");
      // console.log("counterValue : "+ counterValue.text());
      // console.log("counterIncrement : "+counterIncrement);
      // console.log("counterDecrement : "+counterDecrement);
      var count =   1;
  
      counterIncrement.on( "click", function() {
          count++;
          counterValue.text(count);
        } );
        
      
  
      counterDecrement.on( "click", function() {
          if(count>=1){
              count--;
              counterValue.text(count);
          }
         
      });
  }
  if (window.location.href.indexOf("payment") > -1 ||window.location.href.indexOf("perfum") > -1) {
      $("#secondCircle").addClass("active");
      $("#secondSpan").addClass("active");
      $("head").append(
          '<style>.progress-container::after{ content: "";height: 130px;width: 2px;position: absolute;right: 94px;background: #f282a9;top: -167%;transform: rotate(90deg);</style>'
      );
      $(".promo_discount").hide();
  }
  if (window.location.href.indexOf("shipping") > -1) {
      $("#secondCircle").addClass("active");
      $("#thirdCircle").addClass("active");
      $("#secondSpan").addClass("active");
      $("#thirdSpan").addClass("active");
      $("head").append(
          "<style>.progress-container::before{background-color:#f282a9 !important;}</style>"
      );
      $(".promo_discount").hide();
  }

  //   $("#modal").click(function(){
  //     // $('.modalToggle').toggle("slide", { direction: "right" }, 1000);

  //  //    if ($('.modalToggle:visible').length == 0) {
  //  //       $('.modalToggle').fadeIn();

  //  //   } else {
  //  //    $('.modalToggle').fadeOut();
  //  //   }

  //  //   if($('.modalToggle:visible').length)
  //  //      $('.modalToggle').hide();
  //  //  else
  //  //      $('.modalToggle').show();
  //    $('.modalToggle').toggle();
  //   });

  // var counterValue = document.querySelector("#counter-value");
  // var counterIncrement = document.querySelector("#counter-increment");
  // var counterDecrement = document.querySelector("#counter-decrement");
  // var count = 0;

  // counterIncrement.addEventListener("click", () => {
  //     count++;
  //     counterValue.setAttribute("value", count);
  // });

  // counterDecrement.addEventListener("click", () => {
  //     count--;
  //     counterValue.setAttribute("value", count);
  // });
  $("#creditCardResponsive").on( "click", function() {
     $("#madaResponsive").removeClass("activeCardResponsive");
     $("#paypalResponsive").removeClass("activeCardResponsive");
     $(this).addClass('activeCardResponsive');
    } );
    $("#madaResponsive").on( "click", function() {
      $("#creditCardResponsive").removeClass("activeCardResponsive");
      $("#paypalResponsive").removeClass("activeCardResponsive");
      $(this).addClass('activeCardResponsive');
     } );
     $("#paypalResponsive").on( "click", function() {
      $("#madaResponsive").removeClass("activeCardResponsive");
      $("#creditCardResponsive").removeClass("activeCardResponsive");
      $(this).addClass('activeCardResponsive');
     } );

     $("#creditCard").on( "click", function() {
      $("#mada").removeClass("activeCard");
      $("#paypal").removeClass("activeCard");
      $(this).addClass('activeCard');
      var newtop = $('.cartArrow').position().top + 15;
       $(".cartArrow").css('top', newtop + 'px');
     } );
     $("#mada").on( "click", function() {
       $("#creditCard").removeClass("activeCard");
       $("#paypal").removeClass("activeCard");
       $(this).addClass('activeCard');
       var newtop = $('.cartArrow').position().top + 165;
       $(".cartArrow").css('top', newtop + 'px');
      } );
      $("#paypal").on( "click", function() {
       $("#mada").removeClass("activeCard");
       $("#creditCard").removeClass("activeCard");
       $(this).addClass('activeCard');
       var newtop = $('.cartArrow').position().top + 90;
       $(".cartArrow").css('top', newtop + 'px');
      } );
});

salla.onReady(() => (new App).loadTheApp());
