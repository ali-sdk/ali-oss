(function () {
  var objectTypes = {
    function: true,
    object: true,
  };
  var root = (objectTypes[typeof window] && window) || this;
  var freeExports = objectTypes[typeof exports] && exports;
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  function qualify(string) {
    return String(string).replace(/([ -])(?!$)/g, '$1?');
  }

  function reduce(array, callback) {
    var accumulator = null;
    each(array, (value, index) => {
      accumulator = callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  function each(object, callback) {
    var index = -1;
    var length = object ? object.length : 0;

    if (typeof length === 'number' && length > -1 && length <= maxSafeInteger) {
      while (++index < length) {
        callback(object[index], index, object);
      }
    } else {
      forOwn(object, callback);
    }
  }

  function forOwn(object, callback) {
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        callback(object[key], key, object);
      }
    }
  }
  var maxSafeInteger = Math.pow(2, 53) - 1;

  var namePatterns = [
    'Adobe AIR',
    'Arora',
    'Avant Browser',
    'Breach',
    'Camino',
    'Electron',
    'Epiphany',
    'Fennec',
    'Flock',
    'Galeon',
    'GreenBrowser',
    'iCab',
    'Iceweasel',
    'K-Meleon',
    'Konqueror',
    'Lunascape',
    'Maxthon',
    { label: 'Microsoft Edge', pattern: '(?:Edge|Edg|EdgA|EdgiOS)' },
    'Midori',
    'Nook Browser',
    'PaleMoon',
    'PhantomJS',
    'Raven',
    'Rekonq',
    'RockMelt',
    { label: 'Samsung Internet', pattern: 'SamsungBrowser' },
    'SeaMonkey',
    { label: 'Silk', pattern: '(?:Cloud9|Silk-Accelerated)' },
    'Sleipnir',
    'SlimBrowser',
    { label: 'SRWare Iron', pattern: 'Iron' },
    'Sunrise',
    'Swiftfox',
    'Vivaldi',
    'Waterfox',
    'WebPositive',
    { label: 'Yandex Browser', pattern: 'YaBrowser' },
    { label: 'UC Browser', pattern: 'UCBrowser' },
    'Opera Mini',
    { label: 'Opera Mini', pattern: 'OPiOS' },
    'Opera',
    { label: 'Opera', pattern: 'OPR' },
    'Chromium',
    'Chrome',
    { label: 'Chrome', pattern: '(?:HeadlessChrome)' },
    { label: 'Chrome Mobile', pattern: '(?:CriOS|CrMo)' },
    { label: 'Firefox', pattern: '(?:Firefox|Minefield)' },
    { label: 'Firefox for iOS', pattern: 'FxiOS' },
    { label: 'IE', pattern: 'IEMobile' },
    { label: 'IE', pattern: 'MSIE' },
    'Safari',
  ];

  function getName() {
    var ua = getUa();
    var root = objectTypes[typeof window] && window;
    if (!ua) return '';
    if (root && !!root.ActiveXObject) return 'IE';

    return reduce(namePatterns, (result, guess) => {
      return (
        result ||
        (RegExp(`\\b${guess.pattern || qualify(guess)}\\b`, 'i').exec(ua) &&
          (guess.label || guess))
      );
    });
  }

  function getUa() {
    var nav = root.navigator || {};
    return nav.userAgent || '';
  }

  function getVersion() {
    var ua = getUa();
    var name = getName();
    if (name === 'IE' && !/(MSIE)|(IEMobile)/.test(ua)) {
      return '11.0';
    }

    return reduce(
      [
        '(?:Cloud9|CriOS|CrMo|Edge|Edg|EdgA|EdgiOS|FxiOS|HeadlessChrome|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$)|UCBrowser|YaBrowser)',
        'Version',
        qualify(name),
        '(?:Firefox|Minefield|NetFront)',
      ],
      (result, pattern) => {
        return (
          result ||
          (RegExp(
            `${pattern}(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)`,
            'i'
          ).exec(ua) || 0)[1] ||
          ''
        );
      }
    );
  }

  var platform = {};

  platform.description = getUa();

  platform.ua = getUa();

  platform.name = getName();

  platform.version = getVersion();

  if (
    typeof define == 'function' &&
    typeof define.amd == 'object' &&
    define.amd
  ) {
    root.platform = platform;
    define(function () {
      return platform;
    });
  } else if (freeExports && freeModule) {
    forOwn(platform, function (value, key) {
      freeExports[key] = value;
    });
  } else {
    root.platform = platform;
  }
}.call(this));
