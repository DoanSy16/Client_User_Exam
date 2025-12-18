
var app = angular.module("myApp", ["ngRoute", "ngAnimate"]);
app.run(function ($rootScope, $window, $timeout, ExamService, SocketService, CryptoService) {
  $rootScope.data_exam_questions = ExamService.getAll();

  $window.addEventListener("beforeunload", () => {
    const user = JSON.parse(localStorage.getItem('studentInfo'));
    const data_exam_questions = JSON.parse(localStorage.getItem('data_exam_questions'));
    if (user && data_exam_questions) {
      user.examId = data_exam_questions.examId;
      SocketService.emit("request_reconnect_user", { user });
    }
  });



  $rootScope.$on('$routeChangeSuccess', function () {
    let data_user = localStorage.getItem("user_mark");
    if (data_user) {
      $timeout(() => {
        $rootScope.$broadcast("SHOW_USER_MARK", data_user);
      }, 0);
      localStorage.removeItem("user_mark");
    }
  });

  SocketService.on("server_send_exam_to_client_user", function ({ exam }) {
    localStorage.setItem('data_exam_questions', JSON.stringify(exam))
    const data = CryptoService.decrypt(exam.questions, exam.examId);
    exam.questions = data;
    $rootScope.data_exam_questions = JSON.parse(JSON.stringify(exam));
    ExamService.setAll($rootScope.data_exam_questions);
    if (localStorage.getItem('data_exam_questions'))
      $window.location.href = '#!quizView';
  });


  SocketService.on("room_cancelled", function ({ message }) {
    localStorage.clear();
    $window.location.href = 'index.html';
  });
  SocketService.on("server_send_disconnect_client_user", function (data) {
    localStorage.clear();
    $window.location.href = 'index.html';
  });


  (function () {
    const styleBig = "color:red;font-size:50px;font-weight:bold;";
    const styleText = "font-size:14px;color:black;";

    console.clear();
    console.log("%cDừng lại!", styleBig);
    console.log(
      "%cĐây là một tính năng của trình duyệt dành cho các nhà phát triển.\n" +
      "Nếu ai đó bảo bạn sao chép-dán nội dung nào đó vào đây để bật tính năng hoặc hack tài khoản, đó là lừa đảo.\n" +
      "Việc này có thể khiến họ chiếm tài khoản của bạn.",
      styleText
    );
    // console.log("%cXem thêm: https://example.com/canh-bao", "color:blue;text-decoration:underline;");
  })();
  (function () {
    const original = console.log;
    console.log = function () {
      original.apply(console, arguments);
    };
  })();


});

app.config(function ($routeProvider) {
  $routeProvider
    .when("/login", {
      templateUrl: "html/Login.html",
      controller: "LoginCtrl"
    })
    .when("/quizView", {
      templateUrl: "html/QuizView.html",
      controller: "QuizCtrl"
    })
    .otherwise({ redirectTo: "/login" });
});
