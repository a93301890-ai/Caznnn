let notifications = (param) => {
  let type = "success";
  let text = "";
  let runtime = 2;
  let selector = ".notifications";
  let id = $(".notificationsMessage").length + 1;

  if (
    typeof param.text !== "undefined" &&
    param.text !== null &&
    param.text !== ""
  ) {
    text = param.text;
  }
  if (
    typeof param.runtime !== "undefined" &&
    param.runtime !== null &&
    param.runtime !== ""
  ) {
    runtime = param.runtime;
  }
  if (
    typeof param.selector !== "undefined" &&
    param.selector !== null &&
    param.selector !== ""
  ) {
    selector = param.selector;
  }
  if (
    typeof param.type !== "undefined" &&
    param.type !== null &&
    param.type !== ""
  ) {
    type = param.type;
  }

  if (text && text !== "") {
    let message = `
			<div class="notificationsMessage notifications_${type}" data-id="${id}" onclick="notificationsClose(${id});">
				<div class="notificationsText">${text}</div>
				<div class="notificationsIndicator"><div></div></div>
			</div>
		`;
    $(selector).append(message);
    $('.notificationsMessage[data-id="' + id + '"]').slideDown(200);

    $(
      '.notificationsMessage[data-id="' + id + '"] .notificationsIndicator div',
    ).animate(
      {
        width: "0%",
      },
      runtime * 1000,
      "linear",
    );

    setTimeout(() => {
      $('.notificationsMessage[data-id="' + id + '"]').slideUp(200);
    }, runtime * 1000);
  }
};

let notificationsClose = (id) => {
  $('.notificationsMessage[data-id="' + id + '"]').slideUp(200);
};
