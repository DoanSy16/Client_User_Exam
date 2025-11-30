
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

  SocketService.on("user_reconnect_accepted", function (data) {
    console.log('data: ', data)

    // socket.emit("user_join_room_again", {
    //     roomId: $rootScope.roomId,
    //     examId: data.examId
    // });
  });


  $rootScope.$on('$routeChangeSuccess', function () {
    let mark = localStorage.getItem("user_mark");
    if (mark) {
      $timeout(() => {
        $rootScope.$broadcast("SHOW_USER_MARK", mark);
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
  // SocketService.on("server_send_mark_to_client_user", function (data) {
  //   alert("Điểm: " + data.mark);
  // });
  // SocketService.on("server_send_mark_to_client_user", function (data) {
  //   console.log("Điểm nhận được: ", data.mark);
  //   localStorage.setItem("user_mark", data.mark);
  //   $window.location.href = 'index.html';
  // });


  SocketService.on("room_cancelled", function ({ message }) {
    console.log('message: ', message)
    localStorage.clear();

  })

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
