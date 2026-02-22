function getCookieCounter(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)",
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

const counterSend = async (info) => {
  fetch(`${api}/counter`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(counterCore),
  });
};

const counterCore = {
  location: window.location.href,

  timeOpenedSite: new Date(),
  timeOpened: new Date(),
  timezone: new Date().getTimezoneOffset() / 60,

  referer: document.referrer,
  previousSites: history.length,
  userAgent: navigator.userAgent,
  browserLanguage: navigator.language,

  sizeScreenW: screen.width,
  sizeScreenH: screen.height,

  partner: $.cookie("partner") ? $.cookie("partner") : false,

  // dataCookies1: document.cookie,
  // dataStorage: localStorage,
};

if (getCookieCounter("token") != undefined) {
  counterCore.token = getCookieCounter("token");
}

if (lang && lang != undefined) {
  counterCore.lang = lang;
}

counterSend(counterCore);
