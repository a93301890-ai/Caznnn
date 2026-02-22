let closeHandler = (e) => {
  if ($(e.target).closest(".side_active").length !== 0) return;
  $(".side_active").removeClass("side_active");
  backblur_animation();
  $(document).off("click", closeHandler);
};

$(document).ready(function () {
  $(".sidebar").click(function (e) {
    e.preventDefault();
    let block = $(this).attr("href");

    side_animation_open(block);
  });

  $("side a").click(function (e) {
    closeHandler(this);
  });

  $("side .side_close").click(function (e) {
    console.log("cliick");
    closeHandler(this);
  });
});

function side_animation_open(block) {
  backblur_animation();

  if ($(block).length) {
    $(block).addClass("side_active");
    setTimeout(() => $(document).on("click", closeHandler), 0);
  }
}

function backblur_animation() {
  if (!$(".backblur").length) {
    $("BODY").append('<div class="backblur"></div>');
    $("html, body").css("overflow", "hidden");
  } else {
    $(".backblur").css("animation", "backblur_animation_end 0.3s linear");
    setTimeout(() => $(".backblur").remove(), 300);
    $("html, body").css("overflow", "auto");
  }
}
