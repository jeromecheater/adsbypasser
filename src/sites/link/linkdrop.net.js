(function () {

  _.register({
    rule: {
      host: [
        /^ulshare\.net$/,
        /^adurl\.id$/,
        /^(cutwin|cut-earn|earn-guide)\.com$/,
        /^(cutwi|cut-w|cutl|dmus)\.in$/,
        /^(www\.)?jurl\.io$/,
        /^mitly\.us$/,
        /^tui\.click$/,
        /^met\.bz$/,
      ],
    },
    async ready () {
      const handler = new NoRecaptchaHandler();
      await handler.call();
    },
  });

  _.register({
    rule: {
      host: [
        // com
        /^(dz4link|gocitlink|3rabcut|short2win)\.com$/,
        /^(tmearn|payshorturl|urltips|shrinkearn)\.com$/,
        /^(earn-url|bit-url|cut-win|link-zero)\.com$/,
        /^(vy\.)?adsvy\.com$/,
        /^(linkexa|admew|shrtfly|kuylink|cut4links)\.com$/,
        // net
        /^(safelinku|tinylinks|linkrex|zlshorte)\.net$/,
        /^(vn|vina|fox)url\.net$/,
        /^(www\.)?linkdrop\.net$/,
        // else
        /^(trlink|wolink|tocdo|megaurl)\.in$/,
        /^(petty|tr)\.link$/,
        /^idsly\.(com|bid)$/,
        /^(adbilty|adpop|wicr)\.me$/,
        /^wi\.cr$/,
        /^(oke|cuon)\.io$/,
        /^(3bst|coinlink|itiurl)\.co$/,
        /^(shink|shrten|gg-l)\.xyz$/,
        /^mlink\.club$/,
        /^(igram|gram)\.im$/,
        /^clk\.press$/,
        /^short\.pe$/,
        /^urlcloud\.us$/,
        /^(123link|clik|tokenfly)\.pw$/,
        /^(icutit|earnbig)\.ca$/,
        /^koylinks\.win$/,
        /^lopte\.pro$/,
        /^(www\.)?pnd\.tl$/,
        /^(tny|tiny)\.ec$/,
        /^tl\.tc$/,
      ],
    },
    async ready () {
      const handler = new RecaptchaHandler();
      await handler.call();
    },
  });

  _.register({
    rule: {
      host: /^(www\.)?ourl\.io$/,
    },
    async ready () {
      const handler = new OURLHandler();
      await handler.call();
    },
  });

  _.register({
    rule: {
      host: [
        // com
        /^(cut-urls|linclik|premiumzen|shrt10|itiad|by6dk|mikymoons|man2pro)\.com$/,
        /^short\.pastewma\.com$/,
        /^linkfly\.gaosmedia\.com$/,
        /^ads(horte|rt)\.com$/,
        /^(www\.)?viralukk\.com$/,
        /^(ot|load)url\.com$/,
        /^(cut4|rao)link\.com$/,
        // net
        /^www\.worldhack\.net$/,
        /^(eklink|vivads)\.net$/,
        // else
        /^(coshink|urle|adshort)\.co$/,
        /^(weefy|payskip|adbull|zeiz|link4)\.me$/,
        /^(adbilty|taive)\.in$/,
        /^(psl|twik|adslink)\.pw$/,
        /^(curs|crus|4cut|u2s|l2s)\.io$/,
        /^dzurl\.ml$/,
        /^petty\.link$/,
        /^shortad\.cf$/,
        /^123link\.(io|co|press)$/,
        /^git\.tc$/,
        /^adfu\.us$/,
        /^(cutearn|shortit)\.ca$/,
        /^spamlink\.org$/,
        /^royurls\.bid$/,
      ],
    },
    async ready () {
      const handler = new StagedHandler();
      await handler.call();
    },
  });


  class AbstractHandler {

    constructor () {
      this._overlaySelector = [
        '[class$="Overlay"]',
        '#__random_class_name__',
      ].join(', ');

      // TODO extract to paramater
      this._formSelector = [
        '#go-link',
        '.go-link',
        'form[action="/links/go"]',
        'form[action="/links/linkdropgo"]',
      ].join(', ');
    }

    removeOverlay () {
      $.remove(this._overlaySelector);
      $.block(this._overlaySelector, document.body);
    }

    removeFrame () {
      $.remove('iframe');
    }

    async call () {
      const ok = this.prepare();
      if (!ok) {
        return;
      }

      const mw = await this.getMiddleware();
      if (!mw) {
        this.withoutMiddleware();
        return;
      }

      const url = await this.getURL(mw);
      await $.openLink(url);
    }

  }


  class NoRecaptchaHandler extends AbstractHandler {

    constructor () {
      super();
    }

    prepare () {
      this.removeFrame();
      this.removeOverlay();
      return true;
    }

    async getMiddleware () {
      return getJQueryForm(this._formSelector);
    }

    withoutMiddleware () {
      _.info('no form');
    }

    async getURL (jForm) {
      return await getURLFromJQueryForm(jForm);
    }

  }


  class RecaptchaHandler extends AbstractHandler {

    constructor () {
      super();
    }

    prepare () {
      this.removeOverlay();

      const f = $.$('#captchaShortlink');
      if (f) {
        _.info('recaptcha detected, stop');
        return false;
      }
      return true;
    }

    async getMiddleware () {
      return getJQueryForm(this._formSelector);
    }

    withoutMiddleware () {
      // TODO This line was added for sflnk.me, but the domain is gone.
      // Need to confirm if this is still work for the rest sites.
      const f = $('#link-view');
      f.submit();
    }

    async getURL (jForm) {
      while (true) {
        await _.wait(2000);
        try {
          const url = await getURLFromJQueryForm(jForm);
          if (url) {
            return url;
          }
        } catch (e) {
          _.warn(e);
        }
      }
    }

  }


  class OURLHandler extends RecaptchaHandler {

    constructor () {
      super();
    }

    async getMiddleware () {
      return {
        verify: getJQueryForm('#get-link'),
        go: getJQueryForm(this._formSelector),
      };
    }

    async getURL (jFormObject) {
      await getURLFromJQueryForm(jFormObject.verify);
      return await getURLFromJQueryForm(jFormObject.go);
    }

  }


  class StagedHandler extends AbstractHandler {

    constructor () {
      super();
    }

    prepare () {
      this.removeFrame();
      this.removeOverlay();
      return true;
    }

    async getMiddleware () {
      const f = $.$('#link-view');
      if (!f) {
        return document;
      }

      const args = extractArgument(f);
      const url = f.getAttribute('action');
      let page = await $.post(url, args);
      page = $.toDOM(page);
      return page;
    }

    withoutMiddleware () {
      _.info('no page');
    }

    async getURL (page) {
      const f = $('#go-link', page);
      const args = extractArgument(f);
      const url = f.getAttribute('action');
      let data = await $.post(url, args);
      data = JSON.parse(data);
      if (data && data.url) {
        // nuke for bol.tl, somehow it will interfere click event
        $.nuke(data.url);

        return data.url;
      }
      throw new _.AdsBypasserError('wrong data');
    }

  }


  function extractArgument (form) {
    const args = {};
    _.forEach($.$$('input', form), (v) => {
      args[v.name] = v.value;
    });
    return args;
  }


  function getJQueryForm (selector) {
    const jQuery = $.window.$;
    const f = jQuery(selector);
    if (f.length > 0) {
      return f;
    }
    return null;
  }

  function getURLFromJQueryForm (jForm) {
    return new Promise((resolve, reject) => {
      const jQuery = $.window.$;
      jQuery.ajax({
        dataType: 'json',
        type: 'POST',
        url: jForm.attr('action'),
        data: jForm.serialize(),
        success: (result) => {
          if (result.url) {
            resolve(result.url);
          } else {
            reject(new _.AdsBypasserError(result.message));
          }
        },
        error: (xhr, status, error) => {
          _.warn(xhr, status, error);
          reject(new _.AdsBypasserError('request error'));
        },
      });
    });
  }

})();
