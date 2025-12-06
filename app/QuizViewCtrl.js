app.controller("QuizCtrl", function ($scope, $interval, $window, $timeout, ExamService, CryptoService, SocketService) {

    const data_local = JSON.parse(localStorage.getItem('data_exam_questions'));
    if (!data_local) {
        $window.location.href = 'index.html';
    }


    const decrypt = CryptoService.decrypt(data_local.questions, data_local.examId);
    data_local.questions = JSON.parse(decrypt)
    $scope.examData = data_local || ExamService.getAll() || [];

    let time_encrypt = CryptoService.encrypt(($scope.examData.time * 60), `${$scope.examData.roomId}${$scope.examData.isSelected}`);
    // localStorage.setItem('time', time_encrypt);
    // Initialize exam state
    $scope.currentQuestion = 1;
    $scope.answers = {};
    // $scope.timeRemaining = $scope.examData.time * 60; // Convert minutes to seconds
    $scope.timeRemaining = localStorage.getItem('time') ? CryptoService.decrypt(localStorage.getItem('time'), `${$scope.examData.roomId}${$scope.examData.isSelected}`) : $scope.examData.time * 60; // Convert minutes to seconds
    $scope.tabSwitchCount = 0;
    $scope.showWarningModal = localStorage.getItem('showWarningModal') ? localStorage.getItem('showWarningModal') : false;
    $scope.showSubmitConfirmModal = false;






    $scope.hoverImageId = null;

    $scope.setHover = function (imageId) {
        if (imageId && imageId !== "NULL") {
            $scope.hoverImageId = +imageId;
        } else {
            $scope.hoverImageId = null;
        }
    };

    $scope.clearHover = function () {
        $scope.hoverImageId = null;
    };





    // Generate question numbers array
    $scope.questionNumbers = [];
    for (var i = 1; i <= $scope.examData.countQuestions; i++) {
        $scope.questionNumbers.push(i);
    }

    // Helper functions
    $scope.getCurrentQuestion = function () {
        return $scope.examData.questions[$scope.currentQuestion - 1];
    };

    $scope.getOptionLetter = function (index) {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    $scope.formatTime = function (seconds) {
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        return (minutes < 10 ? '0' : '') + minutes + ':' +
            (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    };

    $scope.getTimerClass = function () {
        if ($scope.timeRemaining <= 60) return 'critical'; // Last minute
        if ($scope.timeRemaining <= 120) return 'warning'; // Last 2 minutes
        return '';
    };

    $scope.isAnswered = function (questionNum) {
        var answer = $scope.answers[questionNum];
        return answer !== null && answer !== undefined &&
            (angular.isArray(answer) ? answer.length > 0 : answer !== '');
    };

    $scope.getAnsweredCount = function () {
        var count = 0;
        for (var key in $scope.answers) {
            if ($scope.isAnswered(parseInt(key))) {
                count++;
            }
        }
        return count;
    };

    $scope.getProgressPercentage = function () {
        return ($scope.getAnsweredCount() / $scope.examData.countQuestions) * 100;
    };

    $scope.getQuestionButtonClass = function (questionNum) {
        if (questionNum === $scope.currentQuestion) return 'current';
        if ($scope.isAnswered(questionNum)) return 'answered';
        return 'unanswered';
    };

    $scope.updateAnsweredCount = function () {
        // Trigger digest cycle to update UI
        $timeout(function () {
            // Force update
        }, 0);
    };

    // Checkbox handling for multiple choice questions
    $scope.isCheckboxSelected = function (optionId) {
        var answers = $scope.answers[$scope.currentQuestion] || [];
        return angular.isArray(answers) && answers.indexOf(optionId) !== -1;
    };

    $scope.toggleCheckbox = function (optionId) {
        if (!$scope.examData.statusExam) return;

        if (!$scope.answers[$scope.currentQuestion]) {
            $scope.answers[$scope.currentQuestion] = [];
        }

        var answers = $scope.answers[$scope.currentQuestion];
        if (!angular.isArray(answers)) {
            answers = $scope.answers[$scope.currentQuestion] = [];
        }

        var index = answers.indexOf(optionId);
        if (index !== -1) {
            answers.splice(index, 1);
        } else {
            answers.push(optionId);
        }

        if (answers.length === 0) {
            $scope.answers[$scope.currentQuestion] = null;
        }

        $scope.updateAnsweredCount();
    };

    // Navigation
    $scope.goToQuestion = function (questionNum) {
        if (questionNum >= 1 && questionNum <= $scope.examData.countQuestions && $scope.examData.statusExam) {
            $scope.currentQuestion = questionNum;

        }
    };

    // Modal functions
    $scope.showSubmitModal = function () {
        if ($scope.examData.statusExam) {
            $scope.showSubmitConfirmModal = true;
        }
    };

    // $scope.closeWarningModal = function () {
    //     $scope.showWarningModal = false;
    // };
    $scope.requestReconnect = function () {
        const user = JSON.parse(localStorage.getItem('studentInfo'));
        const data_exam_questions = JSON.parse(localStorage.getItem('data_exam_questions'));
        if (user && data_exam_questions) {
            user.examId = data_exam_questions.examId;
            SocketService.emit("request_reconnect_user", { user });
        }

    };
    SocketService.on("user_reconnect_accepted", function (data) {
        $timeout(function () {
            $scope.showWarningModal = false;
        });
    });


    $scope.closeSubmitModal = function () {
        $scope.showSubmitConfirmModal = false;
    };

    $scope.confirmSubmit = function () {
        $scope.submitExam();
    };

    $scope.submitExam = function () {
        $scope.examData.statusExam = false;
        $interval.cancel(timerPromise);
        $scope.showSubmitConfirmModal = false;

        var answeredCount = $scope.getAnsweredCount();

        // Prepare submission data
        var submissionData = {
            examId: $scope.examData.examId,
            studentId: $scope.examData.isSelected,
            studentName: $scope.examData.nameSelected,
            className: $scope.examData.classNameSelected,
            answers: $scope.answers,
            answeredCount: answeredCount,
            totalQuestions: $scope.examData.countQuestions,
            tabSwitchCount: $scope.tabSwitchCount,
            timeUsed: ($scope.examData.time * 60) - $scope.timeRemaining,
            submissionTime: new Date().toISOString()
        };
        $scope.examData.roomId = JSON.parse(localStorage.getItem('studentInfo')).roomId;
        $scope.examData.timeUsed = ($scope.examData.time * 60) - $scope.timeRemaining;
        $scope.examData.submissionTime = new Date().toISOString();
        const data = JSON.stringify($scope.examData);
        // SocketService.emit("user_send_data", { data });
        localStorage.clear();
        SocketService.emit("user_send_data", { data }, function (response) {
            if (response.success) {
                localStorage.setItem("user_mark", response.mark);
                $window.location.href = 'index.html';
            } else {
                console.error("Lỗi:", response.error);
            }
        });



        // Disable all interactions
        // angular.element(document.querySelectorAll('input, button, textarea')).prop('disabled', true);
    };

    // Timer
    var timerPromise = $interval(function () {
        if ($scope.timeRemaining > 0 && $scope.examData.statusExam) {
            $scope.timeRemaining--;
            let time_encrypt = CryptoService.encrypt($scope.timeRemaining, `${$scope.examData.roomId}${$scope.examData.isSelected}`);
            localStorage.setItem('time', time_encrypt);
        } else if ($scope.timeRemaining <= 0) {
            $scope.submitExam();
        }
    }, 1000);

    // Anti-cheat system
    var setupAntiCheat = function () {
        // Detect when user switches tabs or minimizes window
        angular.element(document).on('visibilitychange', function () {
            if (document.hidden && $scope.examData.statusExam) {
                $scope.$apply(function () {
                    $scope.tabSwitchCount++;
                    $scope.showWarningModal = true;
                    localStorage.setItem('showWarningModal', $scope.showWarningModal);
                });
            }
        });

        // Detect keyboard shortcuts
        angular.element(document).on('keydown', function (e) {
            if ($scope.examData.statusExam) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'n' || e.key === 'w')) {
                    e.preventDefault();
                    $scope.$apply(function () {
                        $scope.tabSwitchCount++;
                        $scope.showWarningModal = true;
                        localStorage.setItem('showWarningModal', $scope.showWarningModal);
                    });
                    return false;
                }

                // Alt+Tab detection
                if (e.altKey && e.key === 'Tab') {
                    setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.tabSwitchCount++;
                            $scope.showWarningModal = true;
                            localStorage.setItem('showWarningModal', $scope.showWarningModal);
                        });
                    }, 100);
                    return false;
                }

                // Developer tools shortcuts
                if (e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                    (e.ctrlKey && e.key === 'u')) {
                    e.preventDefault();
                    // alert('Không được phép sử dụng Developer Tools trong khi làm bài!');
                    return false;
                }

                // Prevent F5 refresh
                if (e.key === 'F5') {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Detect focus loss
        angular.element($window).on('blur', function () {
            if ($scope.examData.statusExam) {
                setTimeout(function () {
                    if (!document.hasFocus()) {
                        $scope.$apply(function () {
                            $scope.tabSwitchCount++;
                        });
                    }
                }, 100);
            }
        });
        // $scope.hoverImageId=function(id){
        //     console.log('id: '.id)
        // }

        // Show warning when user focuses back
        angular.element($window).on('focus', function () {
            if ($scope.tabSwitchCount > 0 && $scope.examData.statusExam) {
                $scope.$apply(function () {
                    $scope.showWarningModal = true;
                    localStorage.setItem('showWarningModal', $scope.showWarningModal);
                });
            }
        });

        // Prevent right-click context menu
        angular.element(document).on('contextmenu', function (e) {
            if ($scope.examData.statusExam) {
                e.preventDefault();
                return false;
            }
        });

        // Prevent text selection (except in input fields)
        angular.element(document).on('selectstart', function (e) {
            if ($scope.examData.statusExam && !angular.element(e.target).is('input, textarea')) {
                e.preventDefault();
                return false;
            }
        });

        // Prevent copy/paste
        angular.element(document).on('keydown', function (e) {
            if ($scope.examData.statusExam && (e.ctrlKey || e.metaKey)) {
                if (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a') {
                    var target = angular.element(e.target);
                    if (!target.is('input, textarea')) {
                        e.preventDefault();
                        return false;
                    }
                }
            }
        });
    };

    // Prevent page refresh/close
    angular.element($window).on('beforeunload', function (e) {
        if ($scope.examData.statusExam) {
            var confirmationMessage = 'Bạn có chắc chắn muốn thoát khỏi bài thi? Dữ liệu có thể bị mất.';
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });

    // Initialize anti-cheat system
    // setupAntiCheat();
    if (!data_local.selectedDocument) {
        setupAntiCheat();
    }
    // Cleanup on destroy
    $scope.$on('$destroy', function () {
        if (timerPromise) {
            $interval.cancel(timerPromise);
        }
    });

    // Auto-save answers (optional feature)
    $scope.$watch('answers', function (newVal, oldVal) {
        if (newVal !== oldVal && $scope.examData.statusExam) {
            $scope.updateDataSend();
            localStorage.setItem('examAnswers_' + $scope.examData.examId, JSON.stringify($scope.answers));
        }
    }, true);

    $scope.updateDataSend = function () {
        let count = $scope.currentQuestion - 1;
        let currentQuestion = $scope.examData.questions[count];
        $scope.examData.roomId = JSON.parse(localStorage.getItem('studentInfo')).roomId;
        currentQuestion.correct_answer = [];
        if (currentQuestion.type_question_id == 2 && $scope.answers[count] && $scope.answers[count].length > 1) {
            $scope.answers[$scope.currentQuestion].forEach(a => {
                currentQuestion.correct_answer.push({
                    "correct_answer": a
                });
            });

        } else {
            currentQuestion.correct_answer.push({
                "correct_answer": $scope.answers[$scope.currentQuestion]
            });
        }
        $scope.temp = angular.copy($scope.examData);
        const data = CryptoService.encrypt($scope.temp.questions, $scope.temp.examId);
        $scope.temp.questions = data;
        localStorage.setItem('data_exam_questions', JSON.stringify($scope.temp))
    }

    var savedAnswers = localStorage.getItem('examAnswers_' + $scope.examData.examId);
    if (savedAnswers && $scope.examData.statusExam) {
        try {
            $scope.answers = JSON.parse(savedAnswers);
        } catch (e) {
            console.log('Could not load saved answers');
        }
    }
});
